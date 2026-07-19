"""
ERGIO Engines — Supabase Client
Connects to the same Supabase instance as the ERGIO frontend
"""

from typing import Optional
from supabase import create_client, Client
from config import settings
from utils.logger import log

_sb: Optional[Client] = None

def get_supabase() -> Client:
    global _sb
    if _sb is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            log.warning("Supabase not configured — DB operations will be skipped")
            raise RuntimeError("Supabase not configured")
        _sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _sb

def is_db_ready() -> bool:
    """Check if Supabase is configured without raising."""
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY)

# ── Convenience CRUD ──

async def insert_leads(leads: list[dict], business_id: str = None):
    """Insert leads into the leads table."""
    if not is_db_ready() or not leads:
        return
    try:
        sb = get_supabase()
        records = []
        for lead in leads:
            records.append({
                "business_id": business_id or lead.get("business_id"),
                "source": lead.get("source", "ergio_engines"),
                "source_url": lead.get("source_url", ""),
                "name": lead.get("name", ""),
                "email": lead.get("email", ""),
                "phone": lead.get("phone", ""),
                "platform": lead.get("platform", "web"),
                "message": lead.get("message", ""),
                "intent": lead.get("intent", "browsing"),
                "location": lead.get("location", "Nigeria"),
                "score": lead.get("score", 50),
                "status": "new",
            })
        sb.table("leads").insert(records).execute()
        log.info(f"Saved {len(records)} leads to Supabase")
    except Exception as e:
        log.error(f"DB insert leads failed: {e}")

async def get_businesses():
    """Get all businesses from Supabase for engine processing."""
    if not is_db_ready():
        return []
    try:
        sb = get_supabase()
        resp = sb.table("businesses").select("*").eq("status", "active").execute()
        return resp.data or []
    except Exception as e:
        log.error(f"DB get businesses failed: {e}")
        return []

async def insert_outreach_log(business_id: str, lead_id: str = None, channel: str = "email",
                               message: str = "", status: str = "sent"):
    if not is_db_ready():
        return
    try:
        sb = get_supabase()
        sb.table("outreach_logs").insert({
            "business_id": business_id,
            "lead_id": lead_id,
            "channel": channel,
            "message": message,
            "status": status,
        }).execute()
    except Exception as e:
        log.error(f"DB outreach log failed: {e}")

async def get_clients(business_id: str):
    """Get clients for a business (for repeat client engine)."""
    if not is_db_ready():
        return []
    try:
        sb = get_supabase()
        resp = sb.table("clients").select("*").eq("business_id", business_id).execute()
        return resp.data or []
    except Exception as e:
        log.error(f"DB get clients failed: {e}")
        return []
