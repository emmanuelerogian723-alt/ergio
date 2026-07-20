"""
ERGIO Engines — FastAPI Server (v5.0 Render-Ready)
Deploy on Render free tier. Uses $PORT env var. Handles cold starts.
"""
import asyncio
import json
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler

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

from config import settings

# ── Scheduler ──
scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("🚀 ERGIO Engines v5.0 starting up...")
    
    # Connect event bus (graceful — works without Redis)
    try:
        from event_bus import event_bus
        await event_bus.connect()
    except Exception as e:
        log.warn(f"Event bus not available: {e}")
    
    # Schedule recurring engine runs
    if is_db_ready():
        scheduler.add_job(
            run_scheduled_scan,
            "interval",
            hours=settings.ENGINE_DISCOVERY_INTERVAL_HOURS,
            id="discovery_scan",
            replace_existing=True,
        )
        scheduler.add_job(
            run_scheduled_scan,
            "interval",
            minutes=settings.ENGINE_MATCHING_INTERVAL_MINUTES,
            id="matching_scan",
            replace_existing=True,
        )
        log.info("Scheduled engine scans configured")
    else:
        log.warning("Supabase not configured — scheduled scans disabled")
    
    # ── Self-Ping: Keep Render awake ──
    # On Render free tier, the server sleeps after 15 min of inactivity.
    # We ping our own /health endpoint every 10 minutes to prevent that.
    # If RENDER_EXTERNAL_URL is set (Render provides this), ping that instead.
    render_url = os.getenv("RENDER_EXTERNAL_URL", "")
    if render_url:
        render_url = render_url.rstrip("/") + "/health"
    else:
        render_url = f"http://localhost:{os.getenv('PORT', '8000')}/health"
    
    async def self_ping():
        from engine_system.ping_engine import ping_engine as _pe
        _pe.set_url(render_url)
        await _pe.start_keepalive()
    
    asyncio.create_task(self_ping())
    log.info(f"⏰ Self-ping started — pinging {render_url} every 10 min (prevents Render sleep)")
    
    yield
    
    scheduler.shutdown(wait=False)
    # Stop ping engine
    try:
        from engine_system.ping_engine import ping_engine as _pe
        _pe.stop_keepalive()
    except:
        pass
    log.info("🛑 ERGIO Engines shutting down...")

app = FastAPI(
    title="ERGIO Engines",
    description="AI Business Operating System — 10 engines, 15 MCPs, 20 plugins",
    version="5.0.0",
    lifespan=lifespan,
)

# ── CORS (Render needs explicit origins) ──
cors_origins = os.getenv("CORS_ORIGINS", "https://ergio.vercel.app").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins + ["http://localhost:3000", "http://localhost:5173"],
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

class ConductorRequest(BaseModel):
    request: str
    business_id: Optional[str] = None
    user_id: Optional[str] = None

# ════════════════════════════════════════
# HEALTH & STATUS
# ════════════════════════════════════════
@app.get("/")
async def root():
    return {
        "name": "ERGIO Engines",
        "version": "5.0.0",
        "status": "running",
        "engines": [
            "01_local_discovery", "02_demand_matching",
            "03_ai_outreach", "04_repeat_client",
        ],
        "endpoints": {
            "GET /": "This info",
            "GET /health": "Health check",
            "POST /engines/discovery": "Engine 01 — Local Discovery",
            "POST /engines/matching": "Engine 02 — Demand Matching",
            "POST /engines/outreach": "Engine 03 — AI Outreach",
            "POST /engines/repeat": "Engine 04 — Repeat Client",
            "POST /engines/run-all": "Run all engines",
            "POST /scrape": "Scrape URL",
            "POST /crawl": "Crawl multiple URLs",
            "POST /search": "SearXNG search",
            "POST /ai": "Direct Groq AI call",
            "POST /social-content": "Generate social content",
            "GET /businesses": "List businesses",
            "POST /conductor": "AI Conductor (new v5)",
            "GET /status": "Full system status (new v5)",
            "GET /mcp/list": "List MCPs (new v5)",
            "GET /plugins/list": "List plugins (new v5)",
            "GET /approvals": "Pending approvals (new v5)",
        },
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "groq": bool(settings.GROQ_API_KEY),
        "supabase": is_db_ready(),
        "searxng": bool(getattr(settings, 'SEARXNG_URL', '')),
        "playwright": True,
    }

# ════════════════════════════════════════
# ORIGINAL 4 ENGINES (preserved)
# ════════════════════════════════════════
@app.post("/engines/discovery")
async def engine_discovery(req: EngineRequest):
    result = await run_discovery_engine(
        business_type=req.business_type, city=req.city,
        business_id=req.business_id, business_name=req.business_name,
    )
    return result

@app.post("/engines/matching")
async def engine_matching(req: EngineRequest):
    result = await run_demand_matching(
        business_type=req.business_type, city=req.city,
        business_id=req.business_id, business_name=req.business_name,
        services=req.services,
    )
    return result

@app.post("/engines/outreach")
async def engine_outreach(req: EngineRequest):
    if not req.business_id:
        raise HTTPException(status_code=400, detail="business_id required")
    result = await run_outreach_engine(
        business_id=req.business_id,
        business_name=req.business_name or req.business_type,
        business_type=req.business_type, city=req.city,
        lead_ids=req.lead_ids, max_outreach=req.max_outreach,
    )
    return result

@app.post("/engines/repeat")
async def engine_repeat(req: EngineRequest):
    if not req.business_id:
        raise HTTPException(status_code=400, detail="business_id required")
    result = await run_repeat_engine(
        business_id=req.business_id,
        business_name=req.business_name or req.business_type,
        business_type=req.business_type, city=req.city,
    )
    return result

@app.post("/engines/run-all")
async def run_all(req: EngineRequest):
    result = await run_all_engines(
        business_id=req.business_id, business_type=req.business_type,
        city=req.city, business_name=req.business_name, services=req.services,
    )
    return result

# ════════════════════════════════════════
# SCRAPING & SEARCH (preserved)
# ════════════════════════════════════════
@app.post("/scrape")
async def scrape_url(request: Request):
    body = await request.json()
    url = body.get("url")
    use_browser = body.get("use_browser", False)
    if not url:
        raise HTTPException(status_code=400, detail="url required")
    result = await scrape_page_async(url, use_browser=use_browser)
    return result

@app.post("/crawl")
async def crawl_urls(request: Request):
    body = await request.json()
    urls = body.get("urls", [])
    if not urls:
        raise HTTPException(status_code=400, detail="urls array required")
    if len(urls) > 50:
        raise HTTPException(status_code=400, detail="max 50 URLs per crawl")
    results = await scrape_multiple(urls)
    return {"pages_crawled": len(results), "results": results}

@app.post("/search")
async def search(request: Request):
    body = await request.json()
    query = body.get("query")
    count = body.get("count", 10)
    category = body.get("category", "general")
    if not query:
        raise HTTPException(status_code=400, detail="query required")
    results = await searxng_search(query, count=count, category=category)
    return {"query": query, "results": results}

@app.post("/ai")
async def ai_call(request: Request):
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

@app.post("/social-content")
async def social_content(request: Request):
    body = await request.json()
    result = await generate_social_content(
        business_name=body.get("business_name", ""),
        business_type=body.get("business_type", ""),
        city=body.get("city", "Lagos"),
        services=body.get("services", []),
    )
    return result

@app.get("/businesses")
async def list_businesses():
    businesses = await get_businesses()
    return {"count": len(businesses), "businesses": businesses}

@app.post("/scan/all")
async def trigger_scan_all():
    result = await run_scheduled_scan()
    return result

# ════════════════════════════════════════
# NEW v5.0 — CONDUCTOR + MCP + PLUGINS
# ════════════════════════════════════════
try:
    from engine_system.conductor import conductor as conductor_instance
    from engine_system.circuit_breaker import breaker
    
    @app.post("/conductor")
    async def conductor_endpoint(req: ConductorRequest):
        try:
            result = await conductor_instance.process(req.request, req.business_id, req.user_id)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/status")
    async def system_status():
        return {
            "status": "operational",
            "engines": list(conductor_instance.engines.keys()),
            "mcps": conductor_instance.mcp.list_available(),
            "plugins": conductor_instance.plugin_sandbox.list_available(),
            "circuit_breakers": breaker.get_status(),
        }
    
    @app.get("/mcp/list")
    async def list_mcps():
        return conductor_instance.mcp.list_available()
    
    @app.get("/plugins/list")
    async def list_plugins():
        return conductor_instance.plugin_sandbox.list_available()
    
    @app.get("/approvals")
    async def list_approvals(business_id: str = None):
        pending = await conductor_instance.approval_gateway.list_pending(business_id)
        return {"pending": pending, "count": len(pending)}
    
    @app.post("/approve")
    async def approve_action(request: Request):
        body = await request.json()
        try:
            result = await conductor_instance.approval_gateway.approve(
                body.get("approval_id"), body.get("user_id")
            )
            return {"status": "approved", "result": result}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.post("/reject")
    async def reject_action(request: Request):
        body = await request.json()
        try:
            await conductor_instance.approval_gateway.reject(
                body.get("approval_id"), body.get("reason"), body.get("user_id")
            )
            return {"status": "rejected"}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    log.info("✅ v5.0 Conductor endpoints loaded")

    # ── Ping Engine (keep Render awake) ──
    from engine_system.ping_engine import ping_engine
    log.info("✅ Ping Engine loaded")
    
    @app.get("/ping/status")
    async def ping_status():
        """Get ping engine status and uptime stats."""
        return ping_engine.get_status()
    
    @app.post("/ping/set-url")
    async def set_ping_url(request: Request):
        """Set the URL to ping for keepalive."""
        body = await request.json()
        url = body.get("url", "")
        if not url:
            raise HTTPException(status_code=400, detail="url required")
        ping_engine.set_url(url)
        return {"status": "set", "url": url}
    
    @app.post("/ping/test")
    async def ping_test(request: Request):
        """Test ping a URL once."""
        body = await request.json()
        url = body.get("url", ping_engine.ping_url or "http://localhost:8000/health")
        result = await ping_engine.ping_once(url)
        return result
    
    @app.post("/ping/start")
    async def start_keepalive(request: Request):
        """Start the keepalive loop (pings every 10 min)."""
        body = await request.json() if request.method == "POST" else {}
        url = body.get("url", "") if body else ""
        if url:
            ping_engine.set_url(url)
        if not ping_engine.ping_url:
            # Self-ping (ping our own health endpoint)
            port = os.getenv("PORT", "8000")
            ping_engine.set_url(f"http://localhost:{port}/health")
        # Start in background
        asyncio.create_task(ping_engine.start_keepalive())
        return {"status": "started", "interval": f"{ping_engine.interval_seconds}s", "target": ping_engine.ping_url}
    
    @app.post("/ping/stop")
    async def stop_keepalive():
        """Stop the keepalive loop."""
        ping_engine.stop_keepalive()
        return {"status": "stopped"}
    
    @app.post("/ping/multi")
    async def ping_multi(request: Request):
        """Ping multiple URLs at once."""
        body = await request.json()
        urls = body.get("urls", [])
        if not urls:
            raise HTTPException(status_code=400, detail="urls array required")
        results = await ping_engine.ping_multiple(urls)
        return {"results": results, "total": len(results), "successful": sum(1 for r in results if r.get("success", False))}
    
    log.info("✅ Ping Engine endpoints loaded")

    # ── Memory System (3-Layer, Hermes-inspired) ──
    from engine_system.memory_system import memory as ergio_memory
    log.info("✅ Memory System loaded (3-layer)")
    
    @app.post("/memory/remember")
    async def memory_remember(request: Request):
        """Save a durable fact (Layer 1)."""
        body = await request.json()
        result = await ergio_memory.remember(
            fact=body.get("fact", ""),
            category=body.get("category", "general"),
            business_id=body.get("business_id"),
        )
        return result
    
    @app.get("/memory/recall")
    async def memory_recall(query: str, business_id: str = None):
        """Recall durable facts (Layer 1)."""
        results = await ergio_memory.recall(query, business_id, limit=10)
        return {"facts": results, "count": len(results)}
    
    @app.post("/memory/skill")
    async def memory_learn_skill(request: Request):
        """Learn a procedural skill (Layer 2)."""
        body = await request.json()
        result = await ergio_memory.learn_skill(
            name=body.get("name", ""),
            steps=body.get("steps", []),
            trigger=body.get("trigger", ""),
            verification=body.get("verification", ""),
        )
        return result
    
    @app.get("/memory/skill/{name}")
    async def memory_get_skill(name: str):
        """Retrieve a skill (Layer 2)."""
        return await ergio_memory.get_skill(name)
    
    @app.post("/memory/session")
    async def memory_save_session(request: Request):
        """Save a session for future recall (Layer 3)."""
        body = await request.json()
        result = await ergio_memory.save_session(
            session_id=body.get("session_id", ""),
            summary=body.get("summary", ""),
            business_id=body.get("business_id"),
            metadata=body.get("metadata"),
        )
        return result
    
    @app.get("/memory/search-sessions")
    async def memory_search_sessions(query: str, business_id: str = None):
        """Search past sessions (Layer 3)."""
        results = await ergio_memory.search_sessions(query, business_id, limit=5)
        return {"sessions": results, "count": len(results)}
    
    @app.get("/memory/status")
    async def memory_status():
        """Memory system status."""
        return {
            "layers": {
                "layer1": "Durable Facts (MEMORY.md equivalent)",
                "layer2": "Procedural Skills (reusable workflows)",
                "layer3": "Session Search (past conversation recall)",
            },
            "storage": "Supabase (when configured) + JSON file fallback",
            "status": "operational",
        }
    
    # ── AI Router (Multi-Model, 12+ providers) ──
    from engine_system.ai_router import ai_router
    log.info("✅ AI Router loaded (12 providers)")
    
    @app.get("/ai/providers")
    async def list_ai_providers():
        """List all AI providers and their configuration status."""
        providers = ai_router.list_providers()
        configured = sum(1 for p in providers.values() if p["configured"])
        return {
            "total": len(providers),
            "configured": configured,
            "primary": ai_router._default_provider,
            "fallback_chain": ai_router._fallback_chain,
            "providers": providers,
        }
    
    @app.post("/ai/complete")
    async def ai_complete_route(request: Request):
        """Route an AI completion to the best available model."""
        body = await request.json()
        result = await ai_router.complete(
            prompt=body.get("prompt", ""),
            system=body.get("system", "You are ERGIO, an AI business operating system."),
            task_type=body.get("task_type", "smart"),
            json_mode=body.get("json_mode", False),
            temperature=body.get("temperature", 0.7),
            provider=body.get("provider"),
            model=body.get("model"),
        )
        return {"text": result, "provider_used": "auto"}
    
    @app.post("/ai/complete-json")
    async def ai_complete_json_route(request: Request):
        """Route a JSON completion to the best available model."""
        body = await request.json()
        result = await ai_router.complete_json(
            prompt=body.get("prompt", ""),
            system=body.get("system", "Return only valid JSON."),
            task_type=body.get("task_type", "smart"),
            provider=body.get("provider"),
        )
        return result
    
    @app.post("/ai/race")
    async def ai_race_models(request: Request):
        """Race multiple AI models in parallel — return fastest valid response."""
        body = await request.json()
        result = await ai_router.race_models(
            prompt=body.get("prompt", ""),
            system=body.get("system", ""),
            task_type=body.get("task_type", "fast"),
            providers=body.get("providers"),
        )
        return result
    
    log.info("✅ Memory + AI Router endpoints loaded")




except ImportError as e:
    log.warn(f"⚠️ v5.0 engine_system not available: {e}")
    log.info("Running in legacy mode (4 engines only)")

# ── Startup ── Render uses $PORT env var ──
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info",
        timeout_keep_alive=65,  # Keep alive for Render proxy
    )
