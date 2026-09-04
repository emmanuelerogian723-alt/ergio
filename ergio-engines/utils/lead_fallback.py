"""
ERGIO Engines — Shared AI Fallback for Lead Generation
Used when live web search/scrape pipelines exceed their time budget,
so callers (Conductor, dashboard buttons) never hang waiting on a slow/dead
external search backend.
"""
from utils.ai import ai_fast
from db.supabase_client import insert_leads
from utils.logger import log


async def ai_fallback_leads(business_type: str, city: str, business_id: str = None, engine_name: str = "local_discovery") -> dict:
    """Generate realistic candidate leads via AI when live web search/scrape is too slow or unavailable."""
    fallback_prompt = f"""Generate 6 realistic (fictional but plausible) Nigerian leads who might need a "{business_type}" business in {city}, Nigeria.
Return JSON: {{"leads": [{{"name": "...", "phone": "+234...", "email": "...", "need": "...", "score": 60-90}}]}}"""
    try:
        result = ai_fast(fallback_prompt)
        raw_leads = result.get("leads", [])
    except Exception as e:
        log.error(f"AI fallback lead generation failed: {e}")
        raw_leads = []

    leads = [{
        "source": "ai_fallback",
        "source_url": "",
        "name": l.get("name", ""),
        "email": l.get("email", ""),
        "phone": l.get("phone", ""),
        "platform": "ai_generated",
        "message": l.get("need", ""),
        "intent": "buying",
        "location": city,
        "score": l.get("score", 65),
        "reason": "AI-generated candidate lead (live search was slow/unavailable)",
    } for l in raw_leads]

    if leads:
        await insert_leads(leads, business_id)

    return {
        "engine": engine_name,
        "business_type": business_type,
        "city": city,
        "search_results_total": 0,
        "pages_scraped": 0,
        "leads_found": len(leads),
        "matches_found": len(leads),
        "leads": leads,
        "matches": leads,
        "seo_package": {},
        "directories_found": [],
        "demand_signals": [],
        "note": "Generated via AI fallback — live web search was too slow. Try again shortly for real-time results.",
    }
