# app/agents/risk_reasoning.py

import json
from typing import Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.agents.memory import get_client_context
from dotenv import load_dotenv

load_dotenv()

# ---------------------------
# Utility: Safe JSON Parsing
# ---------------------------
def safe_json_parse(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        # Fallback or strict error
        raise ValueError(f"Invalid JSON returned by LLM: {text}") from e

# ---------------------------
# Step 1: Scenario Simulation (Enhanced)
# ---------------------------
def simulate_scenarios(state: Dict[str, Any], client_profiles: Dict[str, Any]) -> List[Dict[str, Any]]:
    total_salaries = sum(s["amount"] for s in state["salaries"])
    total_bills = sum(b["amount"] for b in state["fixed_bills"])
    
    # Calculate probability-adjusted cashflows based on risk modifiers
    # (Simplified logic for simulation)
    
    return [
        {
            "name": "best_case",
            "description": "All clients pay on time",
            "net_cash": (
                state["cash_balance"]
                + sum(r["amount"] for r in state["receivables"])
                - total_salaries
                - total_bills
            )
        },
        {
            "name": "expected_case",
            "description": "Risk-adjusted based on client history",
            "net_cash": (
                state["cash_balance"]
                + sum(
                    r["amount"] / client_profiles.get(r["client"], {}).get("risk_score_modifier", 1.0) 
                    for r in state["receivables"]
                )
                - total_salaries
                - total_bills
            )
        },
        {
            "name": "worst_case",
            "description": "Multiple delays and fixed costs hit together",
            "net_cash": (
                state["cash_balance"]
                - total_salaries
                - total_bills
            )
        }
    ]

# ---------------------------
# LLM Configuration
# ---------------------------
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.3,
    model_kwargs={"response_format": {"type": "json_object"}},
    request_timeout=20
)

# ---------------------------
# Prompt: Risk Reasoning
# ---------------------------
# ---------------------------
# Prompt: Risk Reasoning
# ---------------------------
risk_prompt = ChatPromptTemplate.from_template("""
You are a Hyper-Rational Financial Risk Analyst.
Your job is to assess the financial health based ONLY on the provided data.
You must return only valid JSON.

INPUT DATA:
- Financial Metrics (Truth source): {financial_metrics}
- Cash Balance: {cash_balance}
- Upcoming Outflows: {outflow_details}
- Expected Inflows: {inflow_details}

STRICT RULES:
1. **CHECK LIQUIDITY STATUS (Can we pay NOW?)**:
   - Look at `liquidity_status` in Financial Metrics ("SURPLUS" or "DEFICIT").
   - **IF STATUS = "SURPLUS"**:
     - **RISK IS LOW**. We have enough cash.
     - Sub-Goal MUST be "MAINTAIN_LIQUIDITY".
     - REASON: "Cash {cash_balance} covers Outflows. Projected Balance: {projected_balance}."
   - **IF STATUS = "DEFICIT"**:
     - **RISK IS HIGH**.
     - Sub-Goal MUST be "COVER_DEFICIT".
     - REASON: "Cash is insufficient. Projected Balance: -{projected_balance}."

2. **TIMING ANALYSIS (Logic Check)**:
   - Check if any Receivable arrives BEFORE the outflow due date.
   - If YES -> Mention it in reasoning: "Receivable available to cover Bill."
   - If NO -> Mention it: "Receivables (20d) arrive too late for Bill (10d). Must rely on Cash."

3. **ASSESS SOLVENCY (Long-term)**:
   - Only relevant if Liquidity is SURPLUS.
   - If `net_position` > 0: Risk is VERY LOW.
   - If `net_position` < 0: Risk is MODERATE (Burning cash but safe for now).

3. **STRATEGY SELECTION**:
   - If Risk is HIGH (Deficit): Suggest "DELAY_PAYMENTS" or "URGENT_COLLECTION".
   - If Risk is LOW (Surplus): Suggest "MAINTAIN_STATUS_QUO" (JUST PAY THE BILLS).

4. **NO HALLUCINATIONS**:
   - Use the EXACT numbers provided.

Return JSON Structure:
{{
  "risk_score": number,
  "critical_window": string,
  "dominant_risk": string,
  "confidence": "HIGH",
  "sub_goal": {{
    "intent": "INCREASE_INFLOW" | "DELAY_OUTFLOW" | "MAINTAIN_LIQUIDITY" | "COVER_DEFICIT",
    "required_amount": number,
    "deadline_days": number,
    "reason": string
  }}
}}
""")

# ---------------------------
# Prompt: Sub-Goal Creation (Refined)
# ---------------------------
goal_prompt = ChatPromptTemplate.from_template("""
You are an autonomous finance agent.

Given the risk analysis below, create a concrete financial sub-goal
that reduces risk before obligations hit.

Return ONLY valid JSON with:
- goal
- amount
- deadline_days
- reason

Risk analysis:
{risk_analysis}
""")

# ---------------------------
# LangGraph Node: Risk Reasoning Agent
# ---------------------------

def risk_reasoning_node(state: Dict[str, Any]) -> Dict[str, Any]:
    # 1. Fetch Client Context from Memory Agent
    receivables = state.get("receivables", [])
    client_profiles = {}
    for r in receivables:
        c_id = r.get("client")
        if c_id:
            client_profiles[c_id] = get_client_context(c_id)
            
    # 2. Simulate Scenarios
    scenarios = simulate_scenarios(state, client_profiles)
    
    # 3. Extract Metrics (Zero-Hallucination Source)
    metrics = state.get("financial_metrics", {})
    cash = state.get("cash_balance")
    outflows = state.get("salaries", []) + state.get("fixed_bills", [])
    total_outflow = metrics.get("total_outflow", 0)
    projected_balance = metrics.get("projected_balance", 0)
    liquidity_status = metrics.get("liquidity_status", "UNKNOWN")
    
    # 4. Reason (LLM)
    inputs = {
        "financial_metrics": json.dumps(metrics, indent=2),
        "cash_balance": cash,
        "outflow_details": json.dumps(outflows, default=str),
        "outflow_total": total_outflow,
        "projected_balance": projected_balance,
        "liquidity_status": liquidity_status,
        "inflow_details": json.dumps(receivables, default=str)
    }
    
    response = llm.invoke(risk_prompt.format(**inputs))

    risk_analysis_output = safe_json_parse(response.content)
    
    # 5. Extract Sub-Goal directly
    sub_goal = risk_analysis_output.get("sub_goal", {})

    state["scenarios"] = scenarios
    state["risk_analysis"] = risk_analysis_output
    state["sub_goal"] = sub_goal
    
    return state
