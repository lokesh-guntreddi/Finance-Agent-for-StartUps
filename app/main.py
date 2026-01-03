from dotenv import load_dotenv
load_dotenv()

import sys
import os

# Add the parent directory to sys.path to allow 'app' imports to work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.graph.finly_graph import finly_graph
from app.data.dummy_state import finance_state

if __name__ == "__main__":
    result = finly_graph.invoke(finance_state)

    print("\n🧠 Risk Analysis:\n")
    print(result["risk_analysis"])

    print("\n🎯 Sub-Goal:\n")
    print(result["sub_goal"])

    print("\n🧩 Decision (Agent-2):\n")
    print(result["decision"])
