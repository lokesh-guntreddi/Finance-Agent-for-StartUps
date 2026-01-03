# app/data/dummy_state.py

finance_state = {
    "cash_balance": 10000, 

    "salaries": [
        {"employee": "Dev Team", "amount": 50000, "due_in_days": 10}
    ],

    "fixed_bills": [
        {"type": "AWS", "amount": 10000, "due_in_days": 10},
    ],

    "receivables": [
        {"client": "Client A", "amount": 40000, "due_in_days": 10},
        {"client": "Client B", "amount": 10000, "due_in_days": 10},
    ],

    "preferences": {
        "dont_delay_salaries": True,
        "avoid_vendor_damage": True
    }
}
