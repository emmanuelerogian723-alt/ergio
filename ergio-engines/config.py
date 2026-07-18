"""
ERGIO Engines — Shared Configuration
Loads from environment variables with smart defaults
"""

import os
from dotenv import load_dotenv

load_dotenv()

def _list(val, default=None):
    """Parse a comma-separated env value into a list."""
    if not val:
        return default or []
    return [x.strip() for x in val.split(",") if x.strip()]

def _int(val, default=0):
    try:
        return int(val) if val else default
    except (ValueError, TypeError):
        return default

class Settings:
    # ── Server ──
    PORT: int = _int(os.getenv("PORT"), 8000)
    HOST: str = os.getenv("HOST", "0.0.0.0")
    CORS_ORIGINS: list = _list(os.getenv("CORS_ORIGINS"), ["*"])

    # ── Groq AI ──
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL_FAST: str = os.getenv("GROQ_MODEL_FAST", "llama-3.1-8b-instant")
    GROQ_MODEL_SMART: str = os.getenv("GROQ_MODEL_SMART", "llama-3.3-70b-versatile")

    # ── Supabase ──
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

    # ── Scraping ──
    SEARXNG_URL: str = os.getenv("SEARXNG_URL", "https://search.sapti.me")
    HEADLESS: bool = os.getenv("HEADLESS", "true").lower() == "true"
    BROWSER_TIMEOUT: int = _int(os.getenv("BROWSER_TIMEOUT"), 30000)
    MAX_CONCURRENT_CRAWLS: int = _int(os.getenv("MAX_CONCURRENT_CRAWLS"), 5)
    MAX_PAGES_PER_CRAWL: int = _int(os.getenv("MAX_PAGES_PER_CRAWL"), 20)

    # ── Lead Generation ──
    MAX_LEADS_PER_SCAN: int = _int(os.getenv("MAX_LEADS_PER_SCAN"), 25)
    LEAD_SCORE_THRESHOLD: int = _int(os.getenv("LEAD_SCORE_THRESHOLD"), 40)
    DEFAULT_CITIES: list = _list(os.getenv("DEFAULT_CITIES"), ["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan"])

    # ── Scheduler ──
    ENGINE_DISCOVERY_INTERVAL_HOURS: int = _int(os.getenv("ENGINE_DISCOVERY_INTERVAL_HOURS"), 6)
    ENGINE_MATCHING_INTERVAL_MINUTES: int = _int(os.getenv("ENGINE_MATCHING_INTERVAL_MINUTES"), 30)
    ENGINE_OUTREACH_INTERVAL_HOURS: int = _int(os.getenv("ENGINE_OUTREACH_INTERVAL_HOURS"), 2)
    ENGINE_REPEAT_INTERVAL_HOURS: int = _int(os.getenv("ENGINE_REPEAT_INTERVAL_HOURS"), 12)

    # ── Email ──
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "hello@ergio.app")

    # ── Logging ──
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

settings = Settings()
