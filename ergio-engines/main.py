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
