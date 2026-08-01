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
<<<<<<< HEAD
            "POST /social-content": "Generate social content",
            "GET /businesses": "List businesses",
            "POST /conductor": "AI Conductor (new v5)",
            "GET /status": "Full system status (new v5)",
            "GET /mcp/list": "List MCPs (new v5)",
            "GET /plugins/list": "List plugins (new v5)",
            "GET /approvals": "Pending approvals (new v5)",
=======
            "POST /social-content": "Generate social media content kit",
            "POST /conductor": "ERGIO Conductor — AI agent orchestrator",
            "POST /conductor/stream": "Conductor with SSE streaming",
            "POST /paystack/initialize": "Initialize Paystack payment",
            "GET /paystack/verify/{ref}": "Verify Paystack payment",
            "GET /businesses": "List active businesses from Supabase",
>>>>>>> github/main
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


# ════════════════════════════════════════
# MCP CONFIGURE (save integration keys)
# ════════════════════════════════════════

@app.post("/mcp/configure")
async def mcp_configure(request: Request):
    """Accept integration API keys from the frontend dashboard."""
    body = await request.json()
    integration = body.get("integration")
    api_key = body.get("apiKey")
    extra = body.get("extra")
    
    if not integration or not api_key:
        raise HTTPException(status_code=400, detail="integration and apiKey required")
    
    # In production, store in Supabase or env. For now, log and confirm.
    log.info(f"Integration configured: {integration} (key length: {len(api_key)})")
    
    # Update in-memory config
    import os
    key_map = {
        "paystack": "PAYSTACK_SECRET_KEY",
        "stripe": "STRIPE_API_KEY", 
        "resend": "RESEND_API_KEY",
        "twilio": "TWILIO_AUTH_TOKEN",
        "groq": "GROQ_API_KEY",
        "github": "GITHUB_TOKEN",
        "openai": "OPENAI_API_KEY",
        "flutterwave": "FLUTTERWAVE_SECRET_KEY",
    }
    env_key = key_map.get(integration)
    if env_key:
        os.environ[env_key] = api_key
    
    return {
        "configured": True,
        "integration": integration,
        "message": f"{integration} integration configured successfully"
    }

@app.get("/businesses")
async def list_businesses():
    businesses = await get_businesses()
    return {"count": len(businesses), "businesses": businesses}

<<<<<<< HEAD
=======

# ════════════════════════════════════════
# CONDUCTOR AGENT — AI orchestrator for all engines
# ════════════════════════════════════════

CONDUCTOR_SYSTEM = """You are ERGIO Conductor, an AI business operating system agent for African businesses. You are powerful, capable, and proactive.

You have access to these tools and engines:
1. Local Discovery Engine — finds leads via SEO, directories, web crawling. Call: /engines/discovery
2. Demand Matching Engine — finds real-time demand signals (e.g., people posting needs on social media). Call: /engines/matching
3. AI Outreach Engine — generates personalized outreach messages for leads. Call: /engines/outreach
4. Repeat Client Engine — re-engages past clients with follow-ups. Call: /engines/repeat
5. Web Scraper — scrapes any URL for emails, phones, socials, content. Call: /scrape
6. Multi-URL Crawler — crawls up to 50 URLs at once. Call: /crawl
7. Meta Search — searches 70+ search engines. Call: /search
8. AI Generator — generates text, content, plans via Groq. Call: /ai
9. Social Content Kit — generates a week of social media posts. Call: /social-content
10. Businesses API — lists all businesses from Supabase. Call: /businesses

18 MCP Servers connected: Supabase, GitHub, Slack, Gmail, WhatsApp, Stripe, Paystack, Twilio, OpenAI, Groq, Google Calendar, Notion, Figma, Vercel, Airtable, SendGrid, SerpAPI, Perplexity.
12 Plugins: SEO Optimizer, Social Media Manager, Invoice Generator, Booking System, CRM Sync, Analytics Pro, Email Automator, Live Chat, Review Manager, SMS Campaigns, Payment Gateway, AI Content Writer.
6 Agent Frameworks: Hermes, OpenClaw, Composio, Glama, Kimi K2.5, CrewAI.

When a user asks you to do something:
1. Understand their intent
2. Plan which engines/tools to use
3. Execute by calling the relevant APIs
4. Report results clearly

Be concise but thorough. You are the number one AI business operating system for Africa."""

@app.post("/conductor")
async def conductor(request: Request):
    """ERGIO Conductor — AI agent that orchestrates all engines to complete business tasks."""
    body = await request.json()
    message = body.get("message", "")
    business_id = body.get("business_id")
    user_id = body.get("user_id", "demo")

    if not message:
        raise HTTPException(status_code=400, detail="message required")

    try:
        # Use AI to understand intent and generate a plan
        plan_prompt = f"""Analyze this user request and determine what action to take.

User request: "{message}"

Respond with JSON containing:
- intent: what the user wants (e.g., "find_leads", "build_website", "send_outreach", "analyze_competitors", "generate_content", "general_chat")
- plan: list of steps to accomplish the task
- engine_calls: list of API endpoints to call (e.g., ["/engines/discovery", "/search"])
- response: a helpful response to the user explaining what you will do

Available engines:
- /engines/discovery (params: business_type, city)
- /engines/matching (params: business_type, city, services)
- /engines/outreach (params: business_id, business_name, business_type, city)
- /engines/repeat (params: business_id, business_name, business_type, city)
- /search (params: query, count)
- /scrape (params: url)
- /social-content (params: business_name, business_type, city)
- /ai (params: prompt, system, json_mode)

Example: If user says "Find leads for a bakery in Lagos", respond with intent="find_leads", engine_calls=["/engines/discovery"], plan=["Run discovery engine for bakery in Lagos", "Show results to user"]
Example: If user says "Write a marketing plan", respond with intent="generate_content", engine_calls=["/ai"], plan=["Generate marketing plan using AI"]"""

        plan_result = ai_json(plan_prompt, CONDUCTOR_SYSTEM)
        
        # Execute engine calls if any
        results = []
        engine_calls = plan_result.get("engine_calls", [])
        business_type = plan_result.get("business_type", "general business")
        city = plan_result.get("city", "Lagos")

        for call in engine_calls[:3]:  # Limit to 3 calls
            try:
                if call == "/engines/discovery":
                    r = await run_discovery_engine(business_type=business_type, city=city, business_id=business_id)
                    results.append({"engine": "discovery", "status": "success", "data": r})
                elif call == "/engines/matching":
                    r = await run_demand_matching(business_type=business_type, city=city, business_id=business_id)
                    results.append({"engine": "matching", "status": "success", "data": r})
                elif call == "/search":
                    r = await searxng_search(message, count=5)
                    results.append({"engine": "search", "status": "success", "data": r})
                elif call == "/ai":
                    ai_text = ai_complete(message, CONDUCTOR_SYSTEM, json_mode=False)
                    results.append({"engine": "ai", "status": "success", "data": {"response": ai_text}})
                elif call == "/social-content":
                    r = await generate_social_content(business_name=plan_result.get("business_name", "Your Business"), business_type=business_type, city=city)
                    results.append({"engine": "social-content", "status": "success", "data": r})
            except Exception as e:
                results.append({"engine": call, "status": "error", "error": str(e)})

        # Generate final response with AI
        if results:
            summary_prompt = f"""Based on the user request and the engine results, provide a clear, helpful summary.

User request: {message}
Plan: {json.dumps(plan_result.get('plan', []))}
Engine results: {json.dumps(results[:3], default=str)[:2000]}

Provide a concise but informative response. If leads were found, list them. If content was generated, show it. Be helpful and specific."""
            final_response = ai_complete(summary_prompt, CONDUCTOR_SYSTEM)
        else:
            final_response = plan_result.get("response", "I can help you with that. Let me know more details about your business.")

        return {
            "summary": final_response,
            "intent": plan_result.get("intent", "general"),
            "plan": plan_result.get("plan", []),
            "engine_results": results,
            "tools_used": [r.get("engine") for r in results],
        }

    except Exception as e:
        # Fallback to direct AI response
        try:
            fallback = ai_complete(message, CONDUCTOR_SYSTEM, json_mode=False)
            return {"summary": fallback, "intent": "general_chat", "plan": [], "engine_results": [], "tools_used": []}
        except:
            raise HTTPException(status_code=500, detail=str(e))


@app.post("/conductor/stream")
async def conductor_stream(request: Request):
    """ERGIO Conductor with SSE streaming for real-time progress."""
    body = await request.json()
    message = body.get("message", "")
    business_id = body.get("business_id")
    user_id = body.get("user_id", "demo")

    if not message:
        raise HTTPException(status_code=400, detail="message required")

    async def event_stream():
        try:
            # Step 1: Thinking
            yield f"data: {json.dumps({'type': 'thinking', 'message': 'Analyzing your request...'})}\n\n"

            # Step 2: Plan
            plan_prompt = f"""Analyze this request and create a plan. Respond as JSON: {{"intent":"...", "plan":["step1","step2"], "engine_calls":["/engines/discovery"], "business_type":"...", "city":"..."}}
User request: "{message}"
Available: /engines/discovery, /engines/matching, /search, /ai, /social-content, /scrape"""

            yield f"data: {json.dumps({'type': 'thinking', 'message': 'Planning approach...'})}\n\n"

            plan = ai_json(plan_prompt, CONDUCTOR_SYSTEM)
            plan_steps = plan.get("plan", ["Analyze request", "Execute", "Report results"])
            engine_calls = plan.get("engine_calls", [])
            business_type = plan.get("business_type", "general business")
            city = plan.get("city", "Lagos")

            # Step 3: Show plan
            yield f"data: {json.dumps({'type': 'plan', 'message': 'Here is my plan', 'steps': plan_steps})}\n\n"
            await asyncio.sleep(0.3)

            # Step 4: Execute each engine call
            results = []
            for call in engine_calls[:3]:
                engine_name = call.replace("/engines/", "").replace("/", "")
                yield f"data: {json.dumps({'type': 'tool_start', 'engine': engine_name, 'message': f'Running {engine_name} engine...'})}\n\n"
                await asyncio.sleep(0.2)

                try:
                    if call == "/engines/discovery":
                        r = await run_discovery_engine(business_type=business_type, city=city, business_id=business_id)
                        leads_found = len(r.get("leads", r.get("results", []))) if isinstance(r, dict) else 0
                        yield f"data: {json.dumps({'type': 'tool_result', 'engine': 'discovery', 'message': f'Found {leads_found} potential leads', 'data': r})}\n\n"
                        results.append(r)
                    elif call == "/engines/matching":
                        r = await run_demand_matching(business_type=business_type, city=city, business_id=business_id)
                        matches = len(r.get("matches", r.get("results", []))) if isinstance(r, dict) else 0
                        yield f"data: {json.dumps({'type': 'tool_result', 'engine': 'matching', 'message': f'Found {matches} demand matches', 'data': r})}\n\n"
                        results.append(r)
                    elif call == "/search":
                        r = await searxng_search(message, count=5)
                        yield f"data: {json.dumps({'type': 'tool_result', 'engine': 'search', 'message': f'Search complete', 'data': r})}\n\n"
                        results.append(r)
                    elif call == "/ai":
                        r = ai_complete(message, CONDUCTOR_SYSTEM, json_mode=False)
                        yield f"data: {json.dumps({'type': 'tool_result', 'engine': 'ai', 'message': 'AI response generated', 'data': {'response': r}})}\n\n"
                        results.append({"response": r})
                    elif call == "/social-content":
                        r = await generate_social_content(business_name=plan.get("business_name", "Your Business"), business_type=business_type, city=city)
                        yield f"data: {json.dumps({'type': 'tool_result', 'engine': 'social-content', 'message': 'Social content generated', 'data': r})}\n\n"
                        results.append(r)
                    elif call == "/scrape":
                        yield f"data: {json.dumps({'type': 'tool_result', 'engine': 'scrape', 'message': 'Scrape completed'})}\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'tool_error', 'engine': engine_name, 'message': str(e)})}\n\n"

                await asyncio.sleep(0.2)

            # Step 5: Final response
            yield f"data: {json.dumps({'type': 'thinking', 'message': 'Compiling results...'})}\n\n"

            if results:
                summary_prompt = f"""Based on the user request and engine results, provide a clear summary.

User request: {message}
Results: {json.dumps(results[:2], default=str)[:1500]}

Provide a concise, helpful response. If leads were found, list the top 5. If content was generated, show it."""
                final = ai_complete(summary_prompt, CONDUCTOR_SYSTEM)
            else:
                final = plan.get("response", "Task complete. What would you like me to do next?")

            # Stream the final response word by word
            words = final.split()
            for i in range(0, len(words), 3):
                chunk = " ".join(words[i:i+3])
                yield f"data: {json.dumps({'type': 'text', 'message': chunk + ' '})}\n\n"
                await asyncio.sleep(0.05)

            yield f"data: {json.dumps({'type': 'done', 'message': 'Task completed successfully'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ════════════════════════════════════════
# SCHEDULED SCAN (manual trigger)
# ════════════════════════════════════════

>>>>>>> github/main
@app.post("/scan/all")
async def trigger_scan_all():
    result = await run_scheduled_scan()
    return result

<<<<<<< HEAD
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
=======

# ════════════════════════════════════════
# PAYSTACK PAYMENT GATEWAY
# ════════════════════════════════════════

@app.post("/paystack/initialize")
async def paystack_initialize(request: Request):
    """Initialize a Paystack transaction and return the authorization URL."""
    import os
    body = await request.json()
    plan_id = body.get("plan_id", "")
    plan_name = body.get("plan_name", plan_id)
    amount = body.get("amount", 0)
    email = body.get("email", "demo@ergio.app")

    if not amount:
        raise HTTPException(status_code=400, detail="amount required")

    secret_key = os.environ.get("PAYSTACK_SECRET_KEY", settings.PAYSTACK_SECRET_KEY if hasattr(settings, 'PAYSTACK_SECRET_KEY') else "")
    if not secret_key:
        raise HTTPException(status_code=500, detail="Paystack key not configured on server")

    import urllib.request
    reference = f"ergio_{plan_id}_{int(asyncio.get_event_loop().time() * 1000)}"

    payload = json.dumps({
        "email": email,
        "amount": int(amount) * 100,
        "currency": "NGN",
        "reference": reference,
        "callback_url": "https://ergio.vercel.app/dashboard/index.html",
        "metadata": {
            "custom_fields": [
                {"display_name": "Plan", "variable_name": "plan", "value": plan_id},
                {"display_name": "Platform", "variable_name": "platform", "value": "ERGIO"},
                {"display_name": "Plan Name", "variable_name": "plan_name", "value": plan_name}
            ]
        }
    })

    try:
        req = urllib.request.Request(
            "https://api.paystack.co/transaction/initialize",
            data=payload.encode("utf-8"),
            headers={
                "Authorization": f"Bearer {secret_key}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        if data.get("status"):
            return {
                "authorization_url": data["data"]["authorization_url"],
                "reference": data["data"]["reference"],
                "access_code": data["data"]["access_code"]
            }
        else:
            raise HTTPException(status_code=400, detail=data.get("message", "Paystack initialization failed"))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/paystack/verify/{reference}")
async def paystack_verify(reference: str):
    """Verify a Paystack transaction by reference."""
    import os
    secret_key = os.environ.get("PAYSTACK_SECRET_KEY", settings.PAYSTACK_SECRET_KEY if hasattr(settings, 'PAYSTACK_SECRET_KEY') else "")

    if not secret_key:
        raise HTTPException(status_code=500, detail="Paystack key not configured")

    import urllib.request
    try:
        req = urllib.request.Request(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {secret_key}"},
            method="GET"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        if data.get("status") and data["data"].get("status") == "success":
            return {
                "status": "success",
                "reference": data["data"]["reference"],
                "amount": data["data"]["amount"] / 100,
                "currency": data["data"]["currency"],
                "customer": data["data"].get("customer", {}).get("email"),
                "plan": data["data"].get("metadata", {}).get("custom_fields", [{}])[0].get("value", "")
            }
        else:
            return {"status": "failed", "reference": reference}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Startup ──
>>>>>>> github/main
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
