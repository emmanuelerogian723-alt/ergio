"""
ERGIO Engine 03 — AI Outreach
Generates and sends personalized cold outreach messages to leads found by
Engines 01 & 02. Uses AI to write Nigerian-context-aware messages for
WhatsApp, email, and social media DMs.

What it does:
1. Takes leads from the leads table (scored by Engines 01/02)
2. Generates personalized outreach messages for each lead
3. Writes platform-specific messages: WhatsApp (casual), email (professional), Instagram DM (friendly)
4. Can queue messages for sending via Resend (email) or WhatsApp Business API
5. Tracks outreach status to avoid duplicate outreach
"""

import json
from typing import Optional
from utils.ai import ai_smart, ai_fast
from db.supabase_client import (
    insert_outreach_log, is_db_ready, get_supabase, get_businesses
)
from utils.logger import log
from config import settings
import httpx

async def run_outreach_engine(
    business_id: str,
    business_name: str,
    business_type: str,
    city: str = "Lagos",
    lead_ids: list = None,
    max_outreach: int = 10,
) -> dict:
    """
    Generate personalized outreach for leads.
    If lead_ids is None, picks the top unscored leads for this business.
    """
    log.info(f"✉️ Engine 03 [AI Outreach] starting for {business_name} ({business_type})")

    # ── Phase 1: Get leads to outreach ──
    leads = []
    if is_db_ready():
        try:
            sb = get_supabase()
            if lead_ids:
                resp = sb.table("leads").select("*").in_("id", lead_ids).execute()
                leads = resp.data or []
            else:
                # Get top leads that haven't been contacted yet
                resp = (sb.table("leads")
                    .select("*")
                    .eq("business_id", business_id)
                    .in_("status", ["new", "matched"])
                    .order("score", desc=True)
                    .limit(max_outreach)
                    .execute())
                leads = resp.data or []
        except Exception as e:
            log.error(f"DB get leads failed: {e}")

    if not leads:
        log.info("No leads to outreach. Run Engine 01/02 first.")
        return {"engine": "ai_outreach", "outreach_count": 0, "messages": []}

    log.info(f"Generating outreach for {len(leads)} leads...")

    # ── Phase 2: Generate personalized messages ──
    outreach_messages = []

    for lead in leads:
        lead_name = lead.get("name") or lead.get("title") or "there"
        lead_need = lead.get("message") or lead.get("need") or ""
        lead_platform = lead.get("platform", "whatsapp")
        lead_location = lead.get("location", city)
        lead_score = lead.get("score", 50)

        # Skip competitors and irrelevant leads
        intent = lead.get("intent", "browsing")
        if intent in ("competing", "irrelevant"):
            continue

        prompt = f"""You are ERGIO's outreach writer. Write personalized cold outreach messages from a Nigerian business to a potential client.

BUSINESS (sender):
- Name: {business_name}
- Type: {business_type}
- City: {city}

LEAD (recipient):
- Name: {lead_name}
- What they need: {lead_need}
- Platform where they were found: {lead_platform}
- Location: {lead_location}
- Lead score: {lead_score}/100

Write THREE versions of outreach:
1. WhatsApp message (casual, warm, Nigerian style — like a friend texting)
2. Email (professional but warm, with subject line)
3. Instagram/Facebook DM (short, friendly, emoji-friendly)

Rules:
- Reference what they specifically said they need
- Keep it under 100 words for WhatsApp/DM
- Don't be pushy — position as helping, not selling
- Mention the business name naturally
- Use Nigerian English where appropriate
- Include a clear call to action (reply, call, or click)

Return JSON:
{{
    "whatsapp": "the WhatsApp message",
    "email_subject": "email subject line",
    "email_body": "the email body",
    "social_dm": "the social media DM message",
    "best_channel": "whatsapp|email|social",
    "personalization_note": "what makes this outreach personalized"
}}"""

        try:
            msg_data = ai_smart(prompt)

            outreach = {
                "lead_id": lead.get("id"),
                "lead_name": lead_name,
                "lead_score": lead_score,
                "messages": msg_data,
                "best_channel": msg_data.get("best_channel", "whatsapp"),
                "sent": False,
            }
            outreach_messages.append(outreach)
            log.info(f"  → Outreach for {lead_name}: {msg_data.get('best_channel', 'whatsapp')}")

        except Exception as e:
            log.debug(f"Outreach generation failed for {lead_name}: {e}")

    # ── Phase 3: Send emails via Resend if configured ──
    sent_count = 0
    if settings.RESEND_API_KEY:
        for msg in outreach_messages:
            lead_email = None
            # Get lead email from DB
            if is_db_ready() and msg.get("lead_id"):
                try:
                    sb = get_supabase()
                    resp = sb.table("leads").select("email").eq("id", msg["lead_id"]).single().execute()
                    lead_email = resp.data.get("email") if resp.data else None
                except:
                    pass

            if lead_email and msg.get("best_channel") == "email":
                try:
                    sent = await send_email_resend(
                        to=lead_email,
                        subject=msg["messages"].get("email_subject", ""),
                        body=msg["messages"].get("email_body", ""),
                    )
                    if sent:
                        msg["sent"] = True
                        sent_count += 1
                        await insert_outreach_log(
                            business_id=business_id,
                            lead_id=msg["lead_id"],
                            channel="email",
                            message=msg["messages"].get("email_body", ""),
                            status="sent",
                        )
                except Exception as e:
                    log.warning(f"Email send failed to {lead_email}: {e}")

    # ── Phase 4: Save outreach messages to DB ──
    if is_db_ready():
        for msg in outreach_messages:
            try:
                sb = get_supabase()
                sb.table("outreach_messages").insert({
                    "business_id": business_id,
                    "lead_id": msg.get("lead_id"),
                    "whatsapp_message": msg["messages"].get("whatsapp", ""),
                    "email_subject": msg["messages"].get("email_subject", ""),
                    "email_body": msg["messages"].get("email_body", ""),
                    "social_dm": msg["messages"].get("social_dm", ""),
                    "best_channel": msg.get("best_channel", "whatsapp"),
                    "status": "sent" if msg.get("sent") else "drafted",
                }).execute()

                # Mark lead as contacted
                if msg.get("lead_id"):
                    sb.table("leads").update({"status": "contacted"}).eq("id", msg["lead_id"]).execute()
            except Exception as e:
                log.debug(f"DB save outreach failed: {e}")

    result = {
        "engine": "ai_outreach",
        "business_name": business_name,
        "leads_processed": len(leads),
        "outreach_generated": len(outreach_messages),
        "emails_sent": sent_count,
        "messages": [
            {
                "lead_name": m["lead_name"],
                "lead_score": m["lead_score"],
                "best_channel": m["best_channel"],
                "whatsapp": m["messages"].get("whatsapp", ""),
                "email_subject": m["messages"].get("email_subject", ""),
                "email_body": m["messages"].get("email_body", ""),
                "social_dm": m["messages"].get("social_dm", ""),
                "personalization_note": m["messages"].get("personalization_note", ""),
                "sent": m["sent"],
            }
            for m in outreach_messages
        ],
    }

    log.info(f"✅ Engine 03 done: {len(outreach_messages)} outreach messages, {sent_count} emails sent")
    return result

async def send_email_resend(to: str, subject: str, body: str) -> bool:
    """Send email via Resend API."""
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
    except Exception as e:
        log.error(f"Resend email failed: {e}")
        return False

async def generate_social_content(
    business_name: str,
    business_type: str,
    city: str,
    services: list = None,
) -> dict:
    """Bonus: Generate a week's worth of social media content."""
    prompt = f"""You are ERGIO's social media content generator for Nigerian businesses.

Business: {business_name}
Type: {business_type}
City: {city}
Services: {json.dumps(services[:5]) if services else ''}

Generate 7 days of social media posts (Instagram/Facebook/Twitter) for this Nigerian business.

Return JSON:
{{
    "posts": [
        {{
            "day": "Monday",
            "caption": "engaging Nigerian-style caption",
            "hashtags": ["#relevant #hashtags"],
            "post_type": "educational|promotional|behind_scenes|testimonial|tip|question|story",
            "best_time": "best posting time for Nigerian audience"
        }}
    ]
}}"""
    try:
        return ai_smart(prompt)
    except Exception as e:
        log.error(f"Social content generation failed: {e}")
        return {"posts": []}
