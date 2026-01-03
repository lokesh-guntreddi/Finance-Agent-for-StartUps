from typing import TypedDict, List, Dict, Any

class FinanceState(TypedDict):
    cash_balance: int
    salaries: List[Dict[str, Any]]
    fixed_bills: List[Dict[str, Any]]
    receivables: List[Dict[str, Any]]
    preferences: Dict[str, Any]
    
    # 🧮 Pre-calculated Metrics (Zero-Error)
    financial_metrics: Dict[str, int]

    # Agent-1 outputs
    scenarios: List[Dict[str, Any]]
    risk_analysis: Dict[str, Any]
    sub_goal: Dict[str, Any]

    # Agent-2 output ✅
    decision: Dict[str, Any]

    # Agent-3 output ⚡
    action_log: Dict[str, Any]

    # Memory update
    memory_updates: Dict[str, Any]
    client_profiles: Dict[str, Any]

