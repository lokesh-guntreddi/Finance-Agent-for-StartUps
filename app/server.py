# app/server.py

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.graph.finly_graph import finly_graph
import uvicorn
import json

app = FastAPI(title="FinLy Autonomous Agent API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request body validation
class Salary(BaseModel):
    employee: str
    amount: int
    due_in_days: int

class Bill(BaseModel):
    type: str
    amount: int
    due_in_days: int

class Receivable(BaseModel):
    client: str
    email: str
    amount: int
    due_in_days: int

class Preferences(BaseModel):
    dont_delay_salaries: bool = True
    avoid_vendor_damage: bool = True

class FinanceStateRequest(BaseModel):
    cash_balance: int
    salaries: List[Salary]
    fixed_bills: List[Bill]
    receivables: List[Receivable]
    preferences: Optional[Preferences] = None

@app.get("/")
def health_check():
    return {"status": "active", "system": "FinLy Agentic Core"}

@app.post("/run-analysis")
async def run_analysis(request: FinanceStateRequest, background_tasks: BackgroundTasks):
    """
    Triggers the Multi-Agent Finance Loop.
    """
    try:
        # Convert Pydantic model to Dict for LangGraph
        initial_state = request.model_dump()
        print(f"DEBUG: Python received state: {json.dumps(initial_state, indent=2)}")
        
        if not initial_state.get("preferences"):
            initial_state["preferences"] = {
                "dont_delay_salaries": True,
                "avoid_vendor_damage": True
            }

        # 🧮 Zero-Error Arithmetic Pre-processing
        total_inflow = sum(r.get("amount", 0) for r in initial_state.get("receivables", []))
        total_outflow = sum(s.get("amount", 0) for s in initial_state.get("salaries", [])) + \
                        sum(b.get("amount", 0) for b in initial_state.get("fixed_bills", []))
        current_cash = initial_state.get("cash_balance", 0)
        
        # 🟢 LIQUIDITY (Can we pay bills NOW?)
        projected_balance = current_cash - total_outflow
        liquidity_status = "SURPLUS" if projected_balance >= 0 else "DEFICIT"
        
        # 🔵 SOLVENCY (Are we profitable long-term?)
        net_position = current_cash + total_inflow - total_outflow
        
        initial_state["financial_metrics"] = {
            "total_inflow": total_inflow,
            "total_outflow": total_outflow,
            "projected_balance": projected_balance,
            "liquidity_status": liquidity_status,
            "net_position": net_position,
            "burn_rate_coverage": round(current_cash / total_outflow, 2) if total_outflow > 0 else 999
        }
            
        print(f"🚀 Analysis Request. Funds: {current_cash} | Net: {net_position}")
        print("DEBUG: Invoking Graph...")
        
        # Invoke the LangGraph
        result = finly_graph.invoke(initial_state)
        print("DEBUG: Graph Invoked.")

        # Extract only the relevant agent outputs to return
        response = {
            "risk_analysis": result.get("risk_analysis"),
            "sub_goal": result.get("sub_goal"),
            "decision": result.get("decision"),
            "action_log": result.get("action_log"),
            "memory_updates": result.get("memory_updates"),
            "financial_metrics": initial_state.get("financial_metrics")
        }

        # 💾 Setup Async DB Save via Background Tasks
        # This prevents the DB connection (which might have DNS timeouts) from blocking the response
        from app.database import save_analysis_result
        background_tasks.add_task(save_analysis_result, response)
        
        return response

    except Exception as e:
        print(f"❌ Error running agent loop: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("app.server:app", host="0.0.0.0", port=8001, reload=True)
