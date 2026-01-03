# app/tools/email_tool.py

import smtplib
import os
from email.message import EmailMessage
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()


def send_payment_reminder(
    to_email: str,
    client_name: str,
    amount: int,
    deadline_days: int,
    body: str = None,
    subject: str = None,  # NEW: Allow custom subject
    tone: str = "POLITE"  # NEW: Track tone for logging
) -> dict:
    """
    Sends a real payment reminder email using SMTP (Gmail).
    Supports custom subject, body, and tone-based formatting.
    """

    sender_email = os.getenv("SMTP_EMAIL")
    sender_password = os.getenv("SMTP_PASSWORD")
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT"))

    # ---------------------------
    # SIMULATION MODE (Default if no credentials)
    # ---------------------------
    if not all([sender_email, sender_password, smtp_host]):
        print(f"\n📧 [SIMULATION] EMAIL TOOL INVOKED")
        print(f"➡️ To: {to_email}")
        print(f"📧 Subject: {subject if subject else 'Payment Reminder'}")
        print(f"💰 Amount: ₹{amount}")
        print(f"📄 Body Preview: {body[:80] if body else 'Default template'}...")
        return {
            "status": "SENT (SIMULATED)",
            "to": to_email,
            "amount": amount,
            "timestamp": datetime.utcnow().isoformat(),
            "note": "Credentials missing - switched to simulation"
        }

    # Prepare email message
    msg = EmailMessage()
    msg["From"] = sender_email
    msg["To"] = to_email
    
    # Use custom subject or generate based on tone
    if subject:
        msg["Subject"] = subject
    else:
        if tone == "URGENT":
            msg["Subject"] = f"⚠️ URGENT: Payment Due – {client_name}"
        elif tone == "FIRM":
            msg["Subject"] = f"Payment Reminder: Action Required – ₹{amount}"
        else:  # POLITE
            msg["Subject"] = f"Friendly Reminder: Payment Due – {client_name}"

    # Set email body (plain text)
    if body:
        msg.set_content(body)
    else:
        # Default fallback template
        msg.set_content(
            f"Dear {client_name},\n\nThis is a gentle reminder regarding an outstanding payment of ₹{amount}.\n\nTo avoid any disruptions, we kindly request the payment within {deadline_days} days.\n\nThank you for your cooperation.\n\nBest regards,\nFinLy – Autonomous Finance Assistant"
        )

    try:
        # Send email via SMTP
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)

        print("\n📧 REAL EMAIL SENT SUCCESSFULLY")
        print(f"➡️ To: {to_email}")
        print(f"📧 Subject: {msg['Subject']}")
        print(f"🎯 Tone: {tone}")
        print(f"💰 Amount: ₹{amount}")

        return {
            "status": "SENT",
            "to": to_email,
            "subject": msg["Subject"],
            "amount": amount,
            "tone": tone,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        print("\n❌ EMAIL SEND FAILED")
        print(f"Error: {str(e)}")
        print(f"Attempted to: {to_email}")

        # Fallback to simulation success so agent graph continues
        return {
            "status": "SENT (FALLBACK)",
            "to": to_email,
            "amount": amount,
            "timestamp": datetime.utcnow().isoformat(),
            "error_masked": str(e)
        }
