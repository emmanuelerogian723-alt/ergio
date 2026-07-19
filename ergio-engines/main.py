"""
ERGIO Engines — FastAPI Server
Exposes all four engines as REST API endpoints for the ERGIO frontend to call.
Deploy this on Render as a separate service.
"""

import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, Any
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import settings
from utils.logger import log
from utils.ai import ai_complete, ai_json, ai_fast, ai_smart
from utils.search import searxng_search, searxng_multi_query
from utils.scraper import scrape_page_async, scrape_multiple, fetch_page
from engines.engine_01_local_discovery import run_discovery_engine
from engines.engine_02_demand_matching import run_demand_matching
from engines.engine_03_outreach import run_outreach_engine, generate_social_content
from engines.engine_04_repeat_client import run_repeat_engine
from engines.orchestrator import run_all_engines, run_scheduled_scan
from db.supabase_client import is_db_ready, get_businesses

# ── Scheduler ──
scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    log.info("🚀 ERGIO Engines starting up...")

    # Schedule recurring engine runs if Supabase is configured
    if is_db_ready():
        scheduler.add_job(
            run_scheduled_scan,
            "interval",
            hours=settings.ENGINE_DISCOVERY_INTERVAL_HOURS,
            id="discovery_scan",
            replace_existing=True,
        )
        scheduler.add_job(
            lambda: run_scheduled_scan(),
            "interval",
            minutes=settings.ENGINE_MATCHING_INTERVAL_MINUTES,
            id="matching_scan",
            replace_existing=True,
        )
        log.info("Scheduled engine scans configured")
    else:
        log.warning("Supabase not configured — scheduled scans disabled")

    yield

    # Shutdown
    scheduler.shutdown(wait=False)
    log.info("ERGIO Engines shutting down...")

app = FastAPI(
    title="ERGIO Engines",
    description="Autonomous client acquisition system — crawling, scraping, lead generation, and 4 engines",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ──
class EngineRequest(BaseModel):
    business_type: Optional[str] = "general business"
    city: Optional[str] = "Lagos"
    business_id: Optional[str] = None
    business_name: Optional[str] = None
    services: Optional[list] = []
    lead_ids: Optional[list] = None
    max_outreach: Optional[int] = 10

# ════════════════════════════════════════
# HEALTH & STATUS
# ════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "name": "ERGIO Engines",
        "version": "1.0.0",
        "status": "running",
        "engines": [
            "01_local_discovery",
            "02_demand_matching",
            "03_ai_outreach",
            "04_repeat_client",
        ],
        "endpoints": {
            "GET /": "This info",
            "GET /health": "Health check",
            "POST /engines/discovery": "Engine 01 — Local Discovery SEO",
            "POST /engines/matching": "Engine 02 — Demand Matching",
            "POST /engines/outreach": "Engine 03 — AI Outreach",
            "POST /engines/repeat": "Engine 04 — Repeat Client",
            "POST /engines/run-all": "Run all four engines",
            "POST /scrape": "Scrape a single URL",
            "POST /crawl": "Crawl multiple URLs",
            "POST /search": "SearXNG meta search",
            "POST /ai": "Direct Groq AI call",
            "POST /social-content": "Generate social media content kit",
            "GET /businesses": "List active businesses from Supabase",
        },
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "groq": bool(settings.GROQ_API_KEY),
        "supabase": is_db_ready(),
        "searxng": bool(settings.SEARXNG_URL),
        "playwright": True,
    }

# ════════════════════════════════════════
# ENGINE 01 — LOCAL DISCOVERY
# ════════════════════════════════════════

@app.post("/engines/discovery")
async def engine_discovery(req: EngineRequest):
    """Run Local Discovery engine — finds leads via SEO, directories, and web crawling."""
    result = await run_discovery_engine(
        business_type=req.business_type,
        city=req.city,
        business_id=req.business_id,
        business_name=req.business_name,
    )
    return result

# ════════════════════════════════════════
# ENGINE 02 — DEMAND MATCHING
# ════════════════════════════════════════

@app.post("/engines/matching")
async def engine_matching(req: EngineRequest):
    """Run Demand Matching engine — finds real-time demand signals like Bolt for skills."""
    result = await run_demand_matching(
        business_type=req.business_type,
        city=req.city,
        business_id=req.business_id,
        business_name=req.business_name,
        services=req.services,
    )
    return result

# ════════════════════════════════════════
# ENGINE 03 — AI OUTREACH
# ════════════════════════════════════════

@app.post("/engines/outreach")
async def engine_outreach(req: EngineRequest):
    """Run AI Outreach engine — generates personalized messages for leads."""
    if not req.business_id:
        raise HTTPException(status_code=400, detail="business_id required")
    result = await run_outreach_engine(
        business_id=req.business_id,
        business_name=req.business_name or req.business_type,
        business_type=req.business_type,
        city=req.city,
        lead_ids=req.lead_ids,
        max_outreach=req.max_outreach,
    )
    return result

# ════════════════════════════════════════
# ENGINE 04 — REPEAT CLIENT
# ════════════════════════════════════════

@app.post("/engines/repeat")
async def engine_repeat(req: EngineRequest):
    """Run Repeat Client engine — re-engages past clients with personalized follow-ups."""
    if not req.business_id:
        raise HTTPException(status_code=400, detail="business_id required")
    result = await run_repeat_engine(
        business_id=req.business_id,
        business_name=req.business_name or req.business_type,
        business_type=req.business_type,
        city=req.city,
    )
    return result

# ════════════════════════════════════════
# RUN ALL ENGINES
# ════════════════════════════════════════

@app.post("/engines/run-all")
async def run_all(req: EngineRequest):
    """Run all four engines at once. Returns combined results."""
    result = await run_all_engines(
        business_id=req.business_id,
        business_type=req.business_type,
        city=req.city,
        business_name=req.business_name,
        services=req.services,
    )
    return result

# ════════════════════════════════════════
# SCRAPING & CRAWLING
# ════════════════════════════════════════

@app.post("/scrape")
async def scrape_url(request: Request):
    """Scrape a single URL — extracts emails, phones, socials, and content."""
    body = await request.json()
    url = body.get("url")
    use_browser = body.get("use_browser", False)

    if not url:
        raise HTTPException(status_code=400, detail="url required")

    result = await scrape_page_async(url, use_browser=use_browser)
    return result

@app.post("/crawl")
async def crawl_urls(request: Request):
    """Scrape multiple URLs concurrently."""
    body = await request.json()
    urls = body.get("urls", [])

    if not urls:
        raise HTTPException(status_code=400, detail="urls array required")
    if len(urls) > 50:
        raise HTTPException(status_code=400, detail="max 50 URLs per crawl")

    results = await scrape_multiple(urls)
    return {"pages_crawled": len(results), "results": results}

# ════════════════════════════════════════
# SEARCH
# ════════════════════════════════════════

@app.post("/search")
async def search(request: Request):
    """SearXNG meta search across 70+ engines."""
    body = await request.json()
    query = body.get("query")
    count = body.get("count", 10)
    category = body.get("category", "general")

    if not query:
        raise HTTPException(status_code=400, detail="query required")

    results = await searxng_search(query, count=count, category=category)
    return {"query": query, "results": results}

# ════════════════════════════════════════
# AI DIRECT
# ════════════════════════════════════════

@app.post("/ai")
async def ai_call(request: Request):
    """Direct Groq AI call."""
    body = await request.json()
    prompt = body.get("prompt")
    system = body.get("system", "Return only valid JSON.")
    model = body.get("model")
    temperature = body.get("temperature", 0.7)
    json_mode = body.get("json_mode", True)

    if not prompt:
        raise HTTPException(status_code=400, detail="prompt required")

    try:
        if json_mode:
            return ai_json(prompt, system, model, temperature)
        else:
            text = ai_complete(prompt, system, model, temperature)
            return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ════════════════════════════════════════
# SOCIAL CONTENT
# ════════════════════════════════════════

@app.post("/social-content")
async def social_content(request: Request):
    """Generate a week of social media content for a business."""
    body = await request.json()
    result = await generate_social_content(
        business_name=body.get("business_name", ""),
        business_type=body.get("business_type", ""),
        city=body.get("city", "Lagos"),
        services=body.get("services", []),
    )
    return result

# ════════════════════════════════════════
# BUSINESSES (from Supabase)
# ════════════════════════════════════════

@app.get("/businesses")
async def list_businesses():
    """List all active businesses from Supabase."""
    businesses = await get_businesses()
    return {"count": len(businesses), "businesses": businesses}

# ════════════════════════════════════════
# SCHEDULED SCAN (manual trigger)
# ════════════════════════════════════════

@app.post("/scan/all")
async def trigger_scan_all():
    """Manually trigger a scheduled scan of all businesses."""
    result = await run_scheduled_scan()
    return result

# ── Startup ──
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
        log_level="info",
    )
