# app/agents/memory.py

import json
import os
from datetime import datetime
from typing import Dict, Any, List

# Define the path for the persistent memory store
MEMORY_FILE = os.path.join(os.path.dirname(__file__), "../data/client_memory.json")

def load_memory() -> List[Dict[str, Any]]:
    """Load the persistent memory ledger from JSON file."""
    if not os.path.exists(MEMORY_FILE):
        return []
    try:
        with open(MEMORY_FILE, "r") as f:
            data = json.load(f)
            # Migration support: if data is a dict (old format), return empty list or convert?
            # For safety, if it's not a list, start fresh to avoid crashes.
            if isinstance(data, list):
                return data
            return []
    except json.JSONDecodeError:
        return []

def save_memory(memory: List[Dict[str, Any]]):
    """Save the memory ledger to the JSON file."""
    os.makedirs(os.path.dirname(MEMORY_FILE), exist_ok=True)
    with open(MEMORY_FILE, "w") as f:
        json.dump(memory, f, indent=4, default=str)

def get_client_stats(client_id: str) -> Dict[str, Any]:
    """
    Analyzes the ledger to calculate current stats for a client.
    """
    memory = load_memory()
    
    attempts = 0
    failures = 0
    consecutive_failures = 0
    last_contacted = None
    
    # Sort by timestamp ascending just in case, though append-only should be sorted
    # We filter for this client first
    client_records = [r for r in memory if client_id in r.get("clients", []) or r.get("target") == client_id]
    
    for record in client_records:
        attempts += 1
        last_contacted = record.get("timestamp")
        
        status = record.get("result", "UNKNOWN")
        
        # Handle BATCH_PROCESSED (Multi-target logic)
        if status == "BATCH_PROCESSED":
            details = record.get("details", {})
            targets_proc = details.get("targets_processed", [])
            # Find specific status for this client
            for t_res in targets_proc:
                if t_res.get("target") == client_id:
                    # Found our client in the batch
                    s_res = t_res.get("result", {})
                    if isinstance(s_res, dict):
                        status = s_res.get("status", "UNKNOWN")
                    else:
                        status = s_res
                    break
        
        # Normalize status (if it was a simple dict output)
        if isinstance(status, dict):
            status = status.get("status", "UNKNOWN")
            
        if status in ["PAID", "OPTIMAL"]:
            consecutive_failures = 0 # Reset on success
        elif status in ["IGNORED", "FAILED"]:
            consecutive_failures += 1
            failures += 1
        elif status == "SENT":
            # Only count 'SENT' as a consecutive failure if 24 hours have passed
            # without a follow-up 'PAID' or 'OPTIMAL' status.
            if record.get("timestamp"):
                try:
                    sent_at = datetime.fromisoformat(record.get("timestamp"))
                    hours_passed = (datetime.now() - sent_at).total_seconds() / 3600
                    if hours_passed > 24:
                        consecutive_failures += 1
                        failures += 1
                except Exception:
                    # Fallback for old formats
                    consecutive_failures += 1
                    failures += 1
            else:
                consecutive_failures += 1
                failures += 1
            
    return {
        "attempts": attempts,
        "failures": failures,
        "consecutive_failures": consecutive_failures,
        "last_contacted_at": last_contacted
    }

def get_client_context(client_id: str) -> Dict[str, Any]:
    """
    Retrieves past behavior for a specific client.
    Adapts Ledger stats to the old 'risk_score_modifier' format for compatibility.
    """
    stats = get_client_stats(client_id)
    cf = stats["consecutive_failures"]
    
    # Map consecutive failures to Tier/Risk
    # 0 -> Tier 1 (Soft) -> Modifier 1.0
    # 1 -> Tier 2 (Firm) -> Modifier 1.2
    # 2+ -> Tier 3 (Escalate) -> Modifier 1.5
    
    risk_mod = 1.0
    if cf == 1: risk_mod = 1.2
    elif cf >= 2: risk_mod = 1.5
    
    return {
        "risk_score_modifier": risk_mod,
        "consecutive_failures": cf,
        "last_contacted_at": stats["last_contacted_at"],
        "tier": 3 if cf >= 2 else (2 if cf == 1 else 1)
    }

def memory_agent_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph Node: Memory & Learning Agent (The Historian).
    Appends actions to the ledger.
    """
    # print("\n🧠 ENTERED MEMORY AGENT")
    
    decision = state.get("decision", {})
    action_log = state.get("action_log", {})
    
    if not decision or not action_log:
        return state

    target = decision.get("target")
    # specific handling for multi-target or single target
    targets = target if isinstance(target, list) else [target]
    
    # Filter out None/Admin targets for logging client interactions
    valid_targets = [t for t in targets if t and t not in ["None", "Admin", "N/A"]]
    
    if not valid_targets:
        return state

    memory = load_memory()
    
    # Extract result status
    result_data = action_log.get("result", {})
    status = "UNKNOWN"
    if isinstance(result_data, dict):
        status = result_data.get("status", "UNKNOWN")
    
    # If using multi-target result (list), distinct logging might be needed?
    # For now, we log the batch.
    
    record = {
        "timestamp": datetime.now().isoformat(),
        "clients": valid_targets,
        "strategy": decision.get("strategy"),
        "action_taken": action_log.get("action_taken"),
        "result": status if "targets_processed" not in action_log else "BATCH_PROCESSED",
        "details": action_log
    }
    
    memory.append(record)
    save_memory(memory)
    
    # Update state with latest profile for visibility (optional)
    state["memory_updates"] = {t: get_client_context(t) for t in valid_targets}

    return state
