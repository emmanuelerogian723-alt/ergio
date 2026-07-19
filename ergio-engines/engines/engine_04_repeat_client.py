"""
ERGIO Engine 04 — Repeat Client Management
Keeps existing clients coming back through automated follow-up sequences,
retainer offers, and re-engagement campaigns. Think of it as a CRM
with AI-powered timing and messaging.

What it does:
1. Analyzes client history to find patterns (when they usually return)
2. Identifies clients who are "due" for a follow-up based on service cycle
3. Generates personalized follow-up messages
4. Creates retainer/loyalty offers for high-value clients
5. Tracks client lifecycle value and engagement metrics
"""

import json
from datetime import datetime, timedelta
from typing import Optional
from utils.ai import ai_smart, ai_fast
from db.supabase_client import (
    get_clients, insert_outreach_log, is_db_ready, get_supabase
)
from utils.logger import log
from config import settings
import httpx

# Service cycle estimates (days between bookings for repeat business)
SERVICE_CYCLES = {
    "haircut": 21, "barbing": 14, "salon": 30, "spa": 45,
    "cleaning": 7, "laundry": 5, "car_wash": 7,
    "photography": 90, "catering": 60, "baking": 30,
    "tutoring": 7, "fitness": 3, "massage": 30,
    "nails": 21, "makeup": 30, "tattoo": 365,
    "consulting": 90, "legal": 180, "accounting": 30,
}

async def run_repeat_engine(
    business_id: str,
    business_name: str,
    business_type: str,
    city: str = "Lagos",
) -> dict:
    """
    Find clients due for re-engagement and generate follow-up messages.
    """
    log.info(f"🔄 Engine 04 [Repeat Client] starting for {business_name} ({business_type})")

    # ── Phase 1: Get all clients for this business ──
    clients = await get_clients(business_id)
    if not clients:
        log.info("No clients found. Engine 04 needs clients in the CRM first.")
        return {
            "engine": "repeat_client",
            "business_name": business_name,
            "clients_analyzed": 0,
            "follow_ups": [],
        }

    log.info(f"Analyzing {len(clients)} clients for re-engagement...")

    # ── Phase 2: Determine service cycle and find due clients ──
    service_cycle = estimate_service_cycle(business_type)

    now = datetime.utcnow()
    follow_ups = []
    retention_offers = []

    for client in clients:
        client_name = client.get("name", "there")
        client_email = client.get("email", "")
        client_phone = client.get("phone", "")
        client_status = client.get("status", "active")
        client_ltv = client.get("ltv", 0) or 0
        client_source = client.get("source", "")
        created_at = client.get("created_at", "")

        # Calculate days since last interaction
        days_since = 999
        if created_at:
            try:
                created_date = datetime.fromisoformat(created_at.replace("Z", "+00:00").replace("+00:00", ""))
                days_since = (now - created_date.replace(tzinfo=None)).days
            except:
                pass

        # Determine follow-up type
        followup_type = None
        if client_status == "dormant" and days_since > service_cycle:
            followup_type = "re_engagement"
        elif days_since > service_cycle * 0.8:
            followup_type = "proactive_reminder"
        elif client_ltv > 50000:  # High-value client (₦50k+ total)
            followup_type = "loyalty_offer"
        elif days_since < 7 and client_status == "active":
            followup_type = "check_in"
        elif days_since > service_cycle * 2:
            followup_type = "win_back"

        if not followup_type:
            continue

        # ── Phase 3: AI generates personalized follow-up ──
        followup_prompt = f"""You are ERGIO's client retention AI. Write a personalized follow-up message for a Nigerian business client.

BUSINESS:
- Name: {business_name}
- Type: {business_type}
- City: {city}

CLIENT:
- Name: {client_name}
- Status: {client_status}
- Days since last interaction: {days_since}
- Lifetime value: ₦{client_ltv:,}
- Source: {client_source}

FOLLOW-UP TYPE: {followup_type}
(Proactive reminder = remind them it's time for the service again
 Re-engagement = they've been away too long, bring them back
 Loyalty offer = high-value client, offer something special
 Check-in = new client, make sure they're happy
 Win-back = they've been gone very long, make a compelling offer)

Write messages for 3 channels. Nigerian style, warm, not pushy.

Return JSON:
{{
    "followup_type": "{followup_type}",
    "whatsapp": "WhatsApp message (casual, warm)",
    "email_subject": "Email subject",
    "email_body": "Email body (professional but warm)",
    "sms": "Short SMS version",
    "offer_suggestion": "any special offer or discount to include (or null)",
    "best_channel": "whatsapp|email|sms",
    "reasoning": "why this timing and approach"
}}"""

        try:
            msg = ai_smart(followup_prompt)
            msg["client_name"] = client_name
            msg["client_email"] = client_email
            msg["client_phone"] = client_phone
            msg["days_since"] = days_since
            msg["ltv"] = client_ltv
            msg["followup_type"] = followup_type
            follow_ups.append(msg)

            log.info(f"  → {client_name}: {followup_type} ({days_since} days since last contact)")

            # ── Phase 4: Send email if it's the best channel ──
            if msg.get("best_channel") == "email" and client_email and settings.RESEND_API_KEY:
                try:
                    sent = await send_followup_email(
                        to=client_email,
                        subject=msg.get("email_subject", f"Hi {client_name}!"),
                        body=msg.get("email_body", ""),
                    )
                    if sent:
                        msg["sent"] = True
                        await insert_outreach_log(
                            business_id=business_id,
                            channel="email",
                            message=msg.get("email_body", ""),
                            status="sent",
                        )
                except Exception as e:
                    log.debug(f"Follow-up email send failed: {e}")

        except Exception as e:
            log.debug(f"Follow-up generation failed for {client_name}: {e}")

    # ── Phase 5: Generate retainer offer for high-value clients ──
    high_value = [c for c in clients if (c.get("ltv", 0) or 0) > 50000]
    if high_value:
        retainer_prompt = f"""You are ERGIO's retainer strategy AI. Design a retainer offer for {business_name} ({business_type}) in {city}.

High-value clients: {len(high_value)}
Top client LTV: ₦{max((c.get('ltv',0) or 0) for c in high_value):,}

Return JSON:
{{
    "retainer_name": "catchy name for the retainer package",
    "monthly_price": "₦amount (fair for Nigerian market)",
    "what_included": ["list of what's included"],
    "pitch_message": "short pitch message for WhatsApp",
    "why_it_works": "why this retainer makes sense for this business type"
}}"""
        try:
            retention_offers = [ai_smart(retainer_prompt)]
        except Exception as e:
            log.debug(f"Retainer generation failed: {e}")

    # ── Phase 6: Update client statuses in DB ──
    if is_db_ready():
        for fu in follow_ups:
            # Mark dormant clients as being re-engaged
            try:
                sb = get_supabase()
                if fu.get("followup_type") in ("re_engagement", "win_back"):
                    # Find client by name and update
                    sb.table("clients").update({
                        "status": "re_engaging",
                        "notes": f"Auto follow-up triggered: {fu.get('reasoning', '')}",
                    }).eq("business_id", business_id).ilike("name", f"%{fu['client_name']}%").execute()
            except Exception as e:
                log.debug(f"Client status update failed: {e}")

    result = {
        "engine": "repeat_client",
        "business_name": business_name,
        "clients_analyzed": len(clients),
        "follow_ups_generated": len(follow_ups),
        "follow_ups": [
            {
                "client_name": f["client_name"],
                "followup_type": f["followup_type"],
                "days_since_last": f["days_since"],
                "ltv": f["ltv"],
                "whatsapp": f.get("whatsapp", ""),
                "email_subject": f.get("email_subject", ""),
                "email_body": f.get("email_body", ""),
                "sms": f.get("sms", ""),
                "best_channel": f.get("best_channel", "whatsapp"),
                "offer": f.get("offer_suggestion"),
                "reasoning": f.get("reasoning", ""),
            }
            for f in follow_ups
        ],
        "retention_offers": retention_offers,
    }

    log.info(f"✅ Engine 04 done: {len(follow_ups)} follow-ups generated")
    return result

def estimate_service_cycle(business_type: str) -> int:
    """Estimate how many days between repeat bookings for this business type."""
    bt = business_type.lower()
    for key, cycle in SERVICE_CYCLES.items():
        if key in bt:
            return cycle
    return 30  # Default monthly cycle

async def send_followup_email(to: str, subject: str, body: str) -> bool:
    """Send follow-up email via Resend."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.FROM_EMAIL,
                    "to": [to],
                    "subject": subject,
                    "text": body,
                },
            )
            return resp.status_code == 200
    except:
        return False
