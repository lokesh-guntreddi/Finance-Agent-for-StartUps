# app/agents/action.py

from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.tools.email_tool import send_payment_reminder

# ---------------------------
# LLM for Dynamic Content Generation
# ---------------------------
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.7, # Higher temperature for creative tone adaptation
    request_timeout=20
)

draft_prompt = ChatPromptTemplate.from_template("""
You are a professional Action Execution Agent drafting a payment reminder email to collect outstanding payments from clients.

Context:
- Client Name: {client_name}
- Outstanding Amount: ₹{amount}
- Payment Deadline: {deadline_days} days from now
- Tone: {tone}

Instructions - STRICTLY follow the tone specified:

If tone is POLITE:
- Use warm, friendly, professional language
- Assume this is just an oversight
- Express appreciation for their business
- Gently remind about the payment
- Example phrases: "friendly reminder", "we kindly request", "at your earliest convenience"

If tone is FIRM:
- Use professional but direct language
- Show urgency without being rude
- Mention business relationship implications if appropriate
- Be clear about expectations
- Example phrases: "immediate attention required", "payment must be received", "to avoid disruption"

If tone is URGENT:
- Use immediate, action-oriented language
- Emphasize the critical deadline
- Clearly state consequences of non-payment
- Request immediate action
- Example phrases: "immediate payment required", "final notice", "urgent action needed"

Format Requirements:
1. Start with appropriate greeting (e.g., "Dear {client_name},")
2. Clearly state the outstanding amount (₹{amount})
3. Specify the payment deadline ({deadline_days} days)
4. Include call-to-action (how/where to make payment)
5. Professional closing signature

Output ONLY the complete email body text (no subject line).
Make it professional, clear, and focused on collecting the payment.
""")

deferral_prompt = ChatPromptTemplate.from_template("""
You are an Action Execution Agent.
Draft a polite email to a vendor asking for a payment extension.

Context:
- Vendor: {client_name}
- Amount: ₹{amount}
- Current Tone: {tone}

Instructions:
- Apologize for the delay.
- Propose a new date (implied +7 days).
- Emphasize long-term partnership value.

Output only the email body text.
""")

def action_execution_node(state: Dict[str, Any]) -> Dict[str, Any]:
    # print("\n⚙️ ENTERED ACTION EXECUTION AGENT")
    decision = state.get("decision", {})
    sub_goal = state.get("sub_goal", {})
    strategy = decision.get("strategy")
    
    # Target details
    target_client = decision.get("target")
    amount = decision.get("amount_goal", 0)
    params = decision.get("execution_params", {})
    tone = params.get("tone", "POLITE")

    action_log = {}

    if strategy == "COLLECT_RECEIVABLE" or strategy == "DELAY_VENDOR_PAYMENT":
        # Handle single vs list target
        targets = target_client if isinstance(target_client, list) else [target_client]
        
        all_results = []
        
        for t in targets:
            if not t or t == "None": continue
            
            # Determine Prompt & Subject
            if strategy == "COLLECT_RECEIVABLE":
                prompt = draft_prompt
                # If multiple targets, split amount evenly or logic? For simplicity, we use total amount for context 
                # but ideally we should look up specific receivable amount. 
                # Agent instruction said "Amount: Set amount_goal = Total Receivable Amount".
                # We will just mention the total required in the email for now or generic.
                # BETTER: Look up the specific receivable amount for this client from state.
                
                specific_amount = amount # Default
                for r in state.get("receivables", []):
                    if r.get("client") == t:
                        specific_amount = r.get("amount")
                        break
                
                current_amount = specific_amount
                deadline_days = sub_goal.get("deadline_days", 7)
            else:
                prompt = deferral_prompt
                current_amount = amount
                deadline_days = 7 # Standard deferral
            
            # 1. Draft Email via LLM
            email_body_response = llm.invoke(
                prompt.format(
                    client_name=t,
                    amount=current_amount,
                    deadline_days=deadline_days,
                    tone=tone
                )
            )
            email_body = email_body_response.content
            
            # Find recipient email from state
            recipient_email = None
            for r in state.get("receivables", []):
                if r.get("client") == t:
                    recipient_email = r.get("email") 
                    break
            
            if not recipient_email:
                if strategy == "DELAY_VENDOR_PAYMENT":
                    recipient_email = "vendor_contact@example.com"
                else:
                    recipient_email = "client_contact@example.com"

            # 2. Execute Action (Send Email)
            result = send_payment_reminder(
                to_email=recipient_email,
                client_name=t,
                amount=current_amount,
                deadline_days=deadline_days,
                body=email_body,
                tone=tone  # Pass tone for dynamic subject and logging
            )
            
            all_results.append({
                "target": t,
                "email": recipient_email,
                "result": result
            })

        # 3. Log Action for 'Contextual Traceability'
        action_log = {
            "action_taken": "EMAIL_PAYMENT_REMINDER_MULTI" if strategy == "COLLECT_RECEIVABLE" else "PAYMENT_EXTENSION_REQUEST",
            "targets_processed": all_results,
            "tone_used": tone
        }

    elif strategy == "ALERT_FOUNDER":
        # Escalation Logic
        reason = decision.get("rationale", "Escalation requested due to high risk or persistent failures.")
        target_entity = target_client if target_client else "Unknown Entity"
        
        prompt = ChatPromptTemplate.from_template("""
        You are an Action Execution Agent.
        Draft an URGENT escalation email to the Founder.
        
        Context:
        - Issue: Repeated payment failures or high risk.
        - Target Entity: {target}
        - Rationale: {reason}
        
        Instructions:
        - Subject Line: 🚨 ACTION REQUIRED: Escalation for {target}
        - Body: Summarize the issue briefly and ask for manual intervention.
        """)
        
        email_body_response = llm.invoke(prompt.format(target=target_entity, reason=reason))
        email_body = email_body_response.content
        
        # In a real app, this would be the founder's email from env
        # recipient_email = os.getenv("ADMIN_EMAIL", "founder@finly.com")
        recipient_email = "founder@finly.app" 
        
        result = send_payment_reminder(
            to_email=recipient_email,
            client_name="Founder",
            amount=amount,
            deadline_days=0,
            body=email_body,
            subject=f"🚨 ACTION REQUIRED: Escalation for {target_entity}",
            tone="URGENT"
        )
        
        action_log = {
            "action_taken": "FOUNDER_ALERTED",
            "target": target_entity,
            "recipient_email": recipient_email,
            "tone_used": "URGENT",
            "content_draft": email_body,
            "result": result
        }

    else:
        action_log = {
            "action_taken": "NO_ACTION",
            "reason": strategy,
            "result": {"status": "SKIPPED"}
        }

    state["action_log"] = action_log
    return state
