"""
ERGIO Engine System — FastAPI Server
Main entry point. Deploy on Render.

Exposes:
- POST /conductor        → Process any request through the Conductor
- POST /build            → Build a business website (streamed via SSE)
- POST /approve/{id}     → Approve a pending action
- POST /reject/{id}      → Reject a pending action
- GET  /approvals        → List pending approvals
- GET  /status           → System status (engines, MCPs, plugins, circuits)
- GET  /mcp/list         → List available MCPs
- GET  /plugins/list     → List available plugins
- POST /schedule         → Schedule a recurring task
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

from utils.logger import log
from conductor import conductor
from event_bus import event_bus
from circuit_breaker import breaker


# ── Scheduler ──
scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("🚀 ERGIO Engine System starting up...")
    
    # Connect event bus
    await event_bus.connect()
    
    # Schedule recurring tasks
    scheduler.add_job(scheduled_scan, "cron", hour=9, minute=0, id="daily_scan")
    scheduler.start()
    log.info("⏰ Scheduler started — daily scan at 9:00 AM")
    
    yield
    
    scheduler.shutdown()
    await event_bus.close()
    log.info("🛑 ERGIO Engine System shut down")


# ── App ──
app = FastAPI(
    title="ERGIO Engine System",
    description="AI Business Operating System — Conductor + Engines + MCPs + Plugins",
    version="5.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ergio.vercel.app", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ──
class ConductorRequest(BaseModel):
    request: str
    business_id: Optional[str] = None
    user_id: Optional[str] = None

class BuildRequest(BaseModel):
    prompt: str
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    city: Optional[str] = "Lagos"
    user_id: Optional[str] = None

class ApprovalRequest(BaseModel):
    approval_id: str
    user_id: Optional[str] = None
    reason: Optional[str] = None


# ── Routes ──

@app.post("/conductor")
async def process_request(req: ConductorRequest):
    """Send any request to the Conductor. It thinks, decomposes, executes, reports."""
    try:
        result = await conductor.process(req.request, req.business_id, req.user_id)
        return result
    except Exception as e:
        log.error(f"❌ Conductor error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/build")
async def build_business(req: BuildRequest):
    """Build a business website with real-time progress via SSE."""
    async def stream():
        steps = [
            ("step_1", "Understanding your business..."),
            ("step_2", "Generating brand identity..."),
            ("step_3", "Creating website content..."),
            ("step_4", "Generating images..."),
            ("step_5", "Building website HTML..."),
            ("step_6", "Setting up Lead Engine..."),
            ("step_7", "Setting up Booking Engine..."),
            ("step_8", "Setting up Invoice Engine..."),
            ("step_9", "Setting up Payment Engine..."),
            ("step_10", "Deploying your business..."),
        ]
        
        for step_id, message in steps:
            yield f"data: {json.dumps({'type': 'progress', 'step': step_id, 'message': message})}\n\n"
            await asyncio.sleep(0.5)
        
        # Actually build the website
        result = await conductor.process(
            f"Build a website for a {req.business_type or 'business'} called {req.business_name or 'Your Business'} in {req.city}. Description: {req.prompt}",
            business_id=None,
            user_id=req.user_id,
        )
        
        yield f"data: {json.dumps({'type': 'complete', 'result': result})}\n\n"
    
    return StreamingResponse(stream(), media_type="text/event-stream")


@app.post("/approve")
async def approve_action(req: ApprovalRequest):
    """Approve a pending action."""
    try:
        result = await conductor.approval_gateway.approve(req.approval_id, req.user_id)
        return {"status": "approved", "result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/reject")
async def reject_action(req: ApprovalRequest):
    """Reject a pending action."""
    try:
        await conductor.approval_gateway.reject(req.approval_id, req.reason, req.user_id)
        return {"status": "rejected"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/approvals")
async def list_approvals(business_id: str = None):
    """List pending approvals."""
    pending = await conductor.approval_gateway.list_pending(business_id)
    return {"pending": pending, "count": len(pending)}


@app.get("/status")
async def system_status():
    """Full system status — engines, MCPs, plugins, circuit breakers."""
    return {
        "status": "operational",
        "engines": list(conductor.engines.keys()),
        "mcps": conductor.mcp.list_available(),
        "plugins": conductor.plugin_sandbox.list_available(),
        "circuit_breakers": breaker.get_status(),
        "event_bus": "connected" if event_bus._connected else "in-memory",
    }


@app.get("/mcp/list")
async def list_mcps():
    """List all available MCP integrations."""
    return conductor.mcp.list_available()


@app.get("/plugins/list")
async def list_plugins():
    """List all available plugins."""
    return conductor.plugin_sandbox.list_available()


@app.post("/mcp/{mcp_name}/{capability}")
async def call_mcp_direct(mcp_name: str, capability: str, request: Request):
    """Call any MCP directly (for advanced users)."""
    body = await request.json()
    try:
        result = await conductor.mcp.call(mcp_name, capability, body)
        return {"status": "completed", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/plugins/{plugin_name}/{capability}")
async def call_plugin_direct(plugin_name: str, capability: str, request: Request):
    """Call any plugin directly (for advanced users)."""
    body = await request.json()
    business_id = body.pop("business_id", None)
    try:
        result = await conductor.plugin_sandbox.execute(plugin_name, capability, body, business_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Scheduled Tasks ──
async def scheduled_scan():
    """Daily automated scan for all businesses."""
    log.info("🔄 Running scheduled daily scan...")
    from db.supabase_client import get_businesses, is_db_ready
    
    if not is_db_ready():
        log.warn("DB not ready, skipping scheduled scan")
        return
    
    businesses = get_businesses()
    for biz in businesses:
        try:
            await conductor.process(
                f"Find new leads for {biz.get('name', 'unknown')} ({biz.get('type', '')}) in {biz.get('city', 'Lagos')}",
                business_id=biz.get("id"),
            )
            await asyncio.sleep(2)  # rate limit between businesses
        except Exception as e:
            log.error(f"❌ Scheduled scan failed for {biz.get('name')}: {e}")


@app.get("/")
async def root():
    return {
        "name": "ERGIO Engine System",
        "version": "5.0.0",
        "status": "operational",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(__import__("os").getenv("PORT", 8000)))
