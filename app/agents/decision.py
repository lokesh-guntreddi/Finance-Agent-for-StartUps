# app/agents/decision.py

import json
from typing import Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

# ---------------------------
# LLM (JSON forced)
# ---------------------------
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.2,
    model_kwargs={"response_format": {"type": "json_object"}},
    request_timeout=20
)

# ---------------------------
# Available Strategy Space
# ---------------------------
AVAILABLE_STRATEGIES = [
    "COLLECT_RECEIVABLE",
    "PARTIAL_COLLECTION",
    "DELAY_VENDOR_PAYMENT",
    "MAINTAIN_STATUS_QUO",
    "ALERT_FOUNDER"
]

# ---------------------------
# Prompt
# ---------------------------
# ---------------------------
# Prompt
# ---------------------------
decision_prompt = ChatPromptTemplate.from_template("""
You are a financial decision-making agent (The Strategist).

Your task is to select the BEST strategic action to achieve the sub-goal, considering ACCOUNT HISTORY.

TIERED ESCALATION LOGIC (MEMORIZED RULES):
- **Tier 1 (0 Recent Failures)**: Tone must be **POLITE**. Action: COLLECT_RECEIVABLE.
- **Tier 2 (1 Recent Failure)**: Tone must be **FIRM**. Action: COLLECT_RECEIVABLE.
- **Tier 3 (2+ Recent Failures)**: Strategy must be **ALERT_FOUNDER**. Do NOT email client directly.

METHODOLOGY:
1. **OBLIGATIONS ANALYSIS**:
   - Combine **Bills** and **Salaries** into a single list of "Obligations".
   - **Loop through EACH Obligation** (sorted by urgency).

2. **FUNDING WATERFALL (STRICT ORDER)**:
   
   **STEP 1: CHECK RECEIVABLES (POOLING)**
   - For the specific Obligation, look for **ALL** Receivables where:
     - `Receivable due_in_days` <= `Obligation due_in_days`?
     - **CRITICAL**: If `due_in_days` are EQUAL, it is a MATCH.
   - **SUM** the amounts of all matching receivables.
   
   **STEP 2: EVALUATE COVERAGE (Receivables + Cash)**
   - **CASE A: Receivables >= Obligation**
     - **ACTION**: "COLLECT_RECEIVABLE".
     - **TARGET**: List all contributing clients.
     - **REASON**: "Pooled receivables ({{total_rec}}) fully cover Obligation ({{amount}}). Preserving Cash."
     - **AMOUNT**: Set `amount_goal` = Total Receivable Amount.

   - **CASE B: (Receivables + Cash Balance) >= Obligation**
     - **ACTION**: "COLLECT_RECEIVABLE" (if receivables > 0) OR "MAINTAIN_STATUS_QUO" (if only cash used).
     - **REASON**: "Pooled receivables ({{total_rec}}) + Cash Balance ({{cash}}) covers Obligation ({{amount}})."
     - **AMOUNT**: Set `amount_goal` = Total Receivable Amount (collect what we can).

   - **CASE C: DEFICIT (Receivables + Cash < Obligation)**
     - **ACTION**: "DELAY_VENDOR_PAYMENT".
     - **TARGET**: The Vendor for this bill (if applicable).
     - **REASON**: "Insufficient funds (Cash + Recs) to cover Obligation by due date."
     - **AMOUNT**: Set `amount_goal` = Deficit Amount.

3. **Grace Period Management (STRICT)**:
   - Check the `last_contacted_at` timestamp for each client in the **Client History**.
   - If a client was contacted within the last 24 hours, do **NOT** send another reminder. 
   - Strategy for that client MUST be `MAINTAIN_STATUS_QUO` (Wait for response).

4. **Delay Strategy**:
   - NEVER delay Salaries (`preference.dont_delay_salaries`).
   - Only delay Bills if `due_in_days` > 2.

Context:
- Sub-goal: {sub_goal}
- Cash Balance: {cash_balance}

Output Requirement:
1. Perform a visible Chain of Thought (in "rationale").
2. Select ONE strategy and target(s).
3. **CRITICAL**: Check "Client History" below. If target is Tier 3, change Strategy to ALERT_FOUNDER.

Return ONLY valid JSON in the EXACT structure below:

{{
  "strategy": "COLLECT_RECEIVABLE" | "DELAY_VENDOR_PAYMENT" | "MAINTAIN_STATUS_QUO" | "ALERT_FOUNDER",
  "target": ["Name 1", "Name 2"] or "Vendor Name" or "None",
  "rationale": "Step-by-step reasoning...",
  "amount_goal": number,
  "execution_params": {{
    "tone": "FIRM" | "POLITE" | "URGENT" | "NONE",
    "channel": "EMAIL" | "SLACK" | "NONE"
  }}
}}

AVAILABLE STRATEGIES:
{strategies}

Financial Context:
Receivables: {receivables}
Client Account History (TIERS):
{client_history}

Obligations (Bills + Salaries): {obligations}
Preferences: {preferences}
Financial Metrics: {financial_metrics}
""")

# ---------------------------
# LangGraph Node
# ---------------------------
def decision_agent_node(state: Dict[str, Any]) -> Dict[str, Any]:
    # Extract inputs
    sub_goal = state.get("sub_goal", {})
    receivables = state.get("receivables", [])
    bills = state.get("fixed_bills", [])
    salaries = state.get("salaries", [])
    
    # Combine obligations for context
    obligations = bills + salaries
    
    preferences = state.get("preferences", {})
    cash_balance = state.get("cash_balance", 0)
    
    # 1. Fetch Client History from Memory (The "Truth")
    # We ignore state['client_profiles'] if it's stale, and fetch fresh from memory.py
    from app.agents.memory import get_client_context
    
    history_lines = []
    enriched_profiles = {}
    
    for r in receivables:
        c_id = r.get("client")
        if c_id:
            ctx = get_client_context(c_id)
            enriched_profiles[c_id] = ctx
            tier = ctx.get("tier", 1)
            fails = ctx.get("consecutive_failures", 0)
            history_lines.append(f"- {c_id}: Tier {tier} ({fails} failures). Last Contact: {ctx.get('last_contacted_at')}")
            
    client_history_str = "\n".join(history_lines)
    
    # Invoke LLM
    metrics = state.get("financial_metrics", {})
    response = llm.invoke(
        decision_prompt.format_messages(
            strategies=json.dumps(AVAILABLE_STRATEGIES),
            sub_goal=json.dumps(sub_goal),
            receivables=json.dumps(receivables),
            obligations=json.dumps(obligations),
            client_history=client_history_str, # Injected Here
            preferences=json.dumps(preferences),
            financial_metrics=json.dumps(metrics),
            cash_balance=cash_balance
        )
    )
    
    try:
        decision = json.loads(response.content)
    except json.JSONDecodeError:
        # Fallback
        fallback_amt = bills[0]["amount"] if bills else 0
        decision = {
            "strategy": "ALERT_FOUNDER",
            "target": "Admin",
            "rationale": "LLM failed to output valid JSON",
            "amount_goal": fallback_amt,
            "execution_params": {"tone": "URGENT"}
        }

    # ENFORCEMENT: Apply tier-based rules (Don't trust LLM blindly)
    target = decision.get("target")
    targets = target if isinstance(target, list) else [target] if target else []
    
    # Find the highest tier among all targets
    max_tier = 1
    for t in targets:
        if t and t not in ["None", "Admin", "N/A"]:
            ctx = enriched_profiles.get(t, {})
            tier = ctx.get("tier", 1)
            max_tier = max(max_tier, tier)
    
    # Enforce strategy and tone based on tier
    if max_tier >= 3:
        decision["strategy"] = "ALERT_FOUNDER"
        decision["execution_params"] = {"tone": "URGENT", "channel": "EMAIL"}
    elif max_tier == 2:
        if decision.get("strategy") == "COLLECT_RECEIVABLE":
            decision["execution_params"] = {"tone": "FIRM", "channel": "EMAIL"}
    elif max_tier == 1:
        if decision.get("strategy") == "COLLECT_RECEIVABLE":
            decision["execution_params"] = {"tone": "POLITE", "channel": "EMAIL"}

    # Update state
    state["decision"] = decision
    return state
