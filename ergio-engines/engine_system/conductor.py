"""
ERGIO CONDUCTOR — The Brain
Orchestrates all engines, MCPs, and plugins.
Receives user request → Understands → Decomposes → Checks permissions → Executes → Verifies → Reports.
"""
import json
import asyncio
from typing import Any, Optional
from utils.logger import log
from utils.ai import ai_fast, ai_json, ai_smart
from engine_system.conductor_prompt import CONDUCTOR_SYSTEM_PROMPT
from engine_system.circuit_breaker import with_retry, breaker
from engine_system.mcp_client import mcp
from engine_system.plugin_sandbox import PluginSandbox
from engine_system.approval_gateway import ApprovalGateway
from engine_system.event_bus import event_bus


class Conductor:
    """
    The ERGIO Conductor. The brain.
    
    Flow:
    1. User sends request
    2. Conductor uses Groq fast model to UNDERSTAND + DECOMPOSE
    3. Classifies each sub-task: autonomous vs needs approval
    4. Executes autonomous tasks in parallel
    5. Queues approval tasks in Supabase
    6. Verifies results
    7. Returns structured JSON response
    """
    
    def __init__(self):
        self.mcp = mcp
        self.approval_gateway = ApprovalGateway()
        self.plugin_sandbox = PluginSandbox(approval_gateway=self.approval_gateway)
        self.engines = {
            "website_engine": self._engine_website,
            "lead_engine": self._engine_lead,
            "booking_engine": self._engine_booking,
            "invoice_engine": self._engine_invoice,
            "payment_engine": self._engine_payment,
            "content_engine": self._engine_content,
            "voice_engine": self._engine_voice,
            "analytics_engine": self._engine_analytics,
            "reputation_engine": self._engine_reputation,
            "workflow_engine": self._engine_workflow,
        }
    
    async def process(self, request: str, business_id: str = None, user_id: str = None) -> dict:
        """
        Main entry point. Process a user request through the full pipeline.
        """
        log.info(f"🎭 Conductor processing: {request[:100]}...")
        
        # Step 1: UNDERSTAND + Step 2: DECOMPOSE
        plan = await self._decompose(request, business_id)
        log.info(f"📋 Plan: {len(plan['sub_tasks'])} sub-tasks")
        
        # Step 3: CHECK PERMISSIONS (classify each task)
        for task in plan["sub_tasks"]:
            task["requires_approval"] = self._needs_approval(task["action"])
        
        # Step 4: EXECUTE
        results = await self._execute_plan(plan["sub_tasks"], business_id)
        
        # Step 5: VERIFY
        verified = self._verify_results(results)
        
        # Step 6: REPORT
        report = self._build_report(verified, plan, request)
        log.info(f"✅ Conductor finished: {report['summary'][:80]}...")
        return report
    
    async def _decompose(self, request: str, business_id: str = None) -> dict:
        """Use Groq to understand and decompose the request into sub-tasks."""
        prompt = f"""Analyze this user request and break it into sub-tasks.

Request: "{request}"

Available engines: {list(self.engines.keys())}
Available MCPs: {list(self.mcp.registry.keys())}

Return JSON with sub_tasks array. Each sub-task has:
- id: unique task id
- engine: which engine handles it
- action: what to do
- params: parameters needed
- depends_on: list of task ids that must complete first (empty if independent)

Return ONLY valid JSON."""

        try:
            result = await with_retry(
                ai_json,
                prompt,
                CONDUCTOR_SYSTEM_PROMPT,
                service_name="groq_decompose",
                max_retries=3,
                timeout=30.0,
            )
            return result
        except Exception as e:
            log.error(f"❌ Decomposition failed: {e}")
            # Fallback: simple single-task plan
            return {
                "sub_tasks": [{
                    "id": "task_1",
                    "engine": "lead_engine",
                    "action": "search_leads",
                    "params": {"query": request},
                    "depends_on": [],
                }]
            }
    
    def _needs_approval(self, action: str) -> bool:
        """Check if an action requires human approval."""
        from engine_system.approval_gateway import APPROVAL_REQUIRED_ACTIONS
        return action in APPROVAL_REQUIRED_ACTIONS
    
    async def _execute_plan(self, sub_tasks: list, business_id: str) -> list:
        """Execute all sub-tasks, respecting dependencies."""
        results = []
        completed = {}  # task_id -> result
        
        # Topological sort — execute tasks with no dependencies first
        remaining = list(sub_tasks)
        
        while remaining:
            # Find tasks whose dependencies are all met
            ready = []
            still_waiting = []
            for task in remaining:
                deps = task.get("depends_on", [])
                if all(d in completed for d in deps):
                    ready.append(task)
                else:
                    still_waiting.append(task)
            
            if not ready:
                # Deadlock or circular dependency — execute remaining in order
                ready = still_waiting
                still_waiting = []
            
            # Execute ready tasks in parallel
            tasks_coro = []
            for task in ready:
                tasks_coro.append(self._execute_single_task(task, business_id))
            
            batch_results = await asyncio.gather(*tasks_coro, return_exceptions=True)
            for task, result in zip(ready, batch_results):
                if isinstance(result, Exception):
                    log.error(f"❌ Task {task['id']} failed: {result}")
                    result = {"status": "failed", "error": str(result)}
                results.append({
                    "id": task["id"],
                    "engine": task["engine"],
                    "action": task["action"],
                    "status": result.get("status", "failed"),
                    "result": result,
                    "requires_approval": task.get("requires_approval", False),
                })
                completed[task["id"]] = result
            
            remaining = still_waiting
        
        return results
    
    async def _execute_single_task(self, task: dict, business_id: str) -> dict:
        """Execute a single sub-task by routing to the right engine/MCP/plugin."""
        engine_name = task.get("engine", "")
        action = task.get("action", "")
        params = task.get("params", {})
        
        # If task requires approval, queue it
        if task.get("requires_approval"):
            approval_id = await self.approval_gateway.queue(
                plugin_name=engine_name,
                capability=action,
                params=params,
                business_id=business_id,
                engine=engine_name,
            )
            return {"status": "pending_approval", "approval_id": approval_id, "action": action}
        
        # Route to engine
        engine_handler = self.engines.get(engine_name)
        if engine_handler:
            return await with_retry(
                engine_handler,
                action,
                params,
                business_id,
                service_name=f"engine_{engine_name}",
                max_retries=3,
                timeout=60.0,
            )
        
        # If not a known engine, try MCP directly
        mcp_name = task.get("mcp")
        if mcp_name:
            result = await self.mcp.call(mcp_name, action, params)
            return {"status": "completed", "result": result}
        
        return {"status": "failed", "error": f"No handler for engine '{engine_name}' and action '{action}'"}
    
    def _verify_results(self, results: list) -> list:
        """Verify each result and flag issues."""
        for r in results:
            if r["status"] == "completed":
                result_data = r.get("result", {})
                if isinstance(result_data, dict) and result_data.get("error"):
                    r["status"] = "failed"
                    r["error"] = result_data["error"]
            elif r["status"] == "failed":
                # Check if circuit breaker is open for this engine
                engine = r.get("engine", "unknown")
                if not breaker.is_available(f"engine_{engine}"):
                    r["note"] = "Circuit breaker open. Service temporarily disabled."
        return results
    
    def _build_report(self, verified: list, plan: dict, original_request: str) -> dict:
        """Build the final structured report."""
        completed = [r for r in verified if r["status"] == "completed"]
        failed = [r for r in verified if r["status"] == "failed"]
        pending = [r for r in verified if r["status"] == "pending_approval"]
        
        summary_parts = []
        if completed:
            summary_parts.append(f"{len(completed)} task(s) completed")
        if failed:
            summary_parts.append(f"{len(failed)} task(s) failed")
        if pending:
            summary_parts.append(f"{len(pending)} action(s) awaiting approval")
        
        return {
            "summary": "; ".join(summary_parts) or "No tasks executed",
            "sub_tasks": verified,
            "pending_approvals": [
                {
                    "id": r.get("result", {}).get("approval_id", ""),
                    "action": r["action"],
                    "engine": r["engine"],
                }
                for r in pending
            ],
            "circuit_breaker_status": breaker.get_status(),
            "next_steps": self._suggest_next_steps(verified, original_request),
        }
    
    def _suggest_next_steps(self, results: list, original_request: str) -> list:
        """Suggest next steps based on what was accomplished."""
        steps = []
        has_pending = any(r["status"] == "pending_approval" for r in results)
        has_failed = any(r["status"] == "failed" for r in results)
        has_completed = any(r["status"] == "completed" for r in results)
        
        if has_pending:
            steps.append("Review pending approvals in your dashboard")
        if has_failed:
            steps.append("Check failed tasks — some services may be temporarily unavailable")
        if has_completed and not has_pending:
            steps.append("All tasks complete. Want to schedule a follow-up scan?")
        return steps or ["No further action needed at this time"]
    
    # ── ENGINE HANDLERS ──
    # Each engine is a method that the Conductor delegates to.
    # These wrap the existing 4 engines + add 6 new ones.
    
    async def _engine_website(self, action: str, params: dict, business_id: str) -> dict:
        """Website Engine — generates business websites."""
        from engines.engine_01_local_discovery import run_discovery_engine
        
        if action == "build_website":
            # Use Groq to generate website HTML
            prompt = params.get("prompt", "business website")
            biz_name = params.get("business_name", "Your Business")
            biz_type = params.get("business_type", "general")
            
            system = "You are ERGIO's Website Engine. Generate a complete, modern, responsive single-page business website in HTML with inline CSS. Use dark glassmorphism design with indigo-purple gradients. Include: hero section with business name, services section, about section, contact form, WhatsApp button, footer. Return only the HTML."
            
            html = await ai_smart(
                f"Business: {biz_name}\nType: {biz_type}\nDescription: {prompt}\nCity: {params.get('city', 'Lagos')}\n\nGenerate a complete website.",
                system,
                max_tokens=4000,
                temperature=0.7,
            )
            
            # Save to Supabase
            from db.supabase_client import get_supabase, is_db_ready
            if is_db_ready():
                sb = get_supabase()
                sb.table("businesses").update({
                    "website_html": html,
                    "status": "built",
                }).eq("id", business_id).execute()
            
            return {"status": "completed", "result": {"html": html[:500] + "...", "url": f"/b/{business_id}"}}
        
        elif action == "generate_brand":
            biz_name = params.get("business_name", "")
            logo_url = f"https://image.pollinations.ai/prompt/{__import__('urllib').parse.quote('minimalist logo for ' + biz_name + ', flat design, clean, modern, white background')}&width=200&height=200&nologo=true"
            
            colors = await ai_json(
                f"Generate a color palette for a business called '{biz_name}' ({params.get('business_type', '')}). Return JSON: {{primary, secondary, accent, background}} with hex colors.",
                "Return only valid JSON with hex color values.",
            )
            
            return {"status": "completed", "result": {"logo_url": logo_url, "colors": colors}}
        
        elif action == "generate_seo":
            biz_type = params.get("business_type", "")
            city = params.get("city", "Lagos")
            
            seo = await ai_json(
                f"Generate SEO package for a {biz_type} in {city}, Nigeria. Return JSON: {{title, description, keywords: [], og_title, og_description, schema_json}}",
                "Return only valid JSON.",
            )
            return {"status": "completed", "result": seo}
        
        return {"status": "failed", "error": f"Unknown website action: {action}"}
    
    async def _engine_lead(self, action: str, params: dict, business_id: str) -> dict:
        """Lead Engine — captures, scores, and enriches leads."""
        if action == "search_leads":
            from engines.engine_01_local_discovery import run_discovery_engine
            result = await run_discovery_engine(
                business_type=params.get("business_type", ""),
                city=params.get("city", "Lagos"),
                business_id=business_id,
                business_name=params.get("business_name", ""),
            )
            return {"status": "completed", "result": result}
        
        elif action == "score_leads":
            # Score leads using Groq
            leads = params.get("leads", [])
            scores = []
            for lead in leads[:50]:  # batch limit
                score = await ai_json(
                    f"Score this lead 0-100 based on: {json.dumps(lead)}\nReturn JSON: {{score: int, reason: str, qualified: bool}}",
                    "Score leads. Higher score = hotter lead. Return only JSON.",
                )
                scores.append({"lead": lead, "score": score.get("score", 50), "qualified": score.get("qualified", False)})
            return {"status": "completed", "result": {"scored": len(scores), "leads": scores}}
        
        elif action == "enrich_leads":
            # Use Clay MCP to enrich leads
            result = await self.mcp.call("clay", "build_lead_list", {
                "industry": params.get("business_type", ""),
                "location": params.get("city", "Lagos, Nigeria"),
                "limit": params.get("limit", 20),
            })
            return {"status": "completed", "result": result}
        
        return {"status": "failed", "error": f"Unknown lead action: {action}"}
    
    async def _engine_booking(self, action: str, params: dict, business_id: str) -> dict:
        """Booking Engine — manages appointments and reminders."""
        if action == "get_slots":
            result = await self.mcp.call("cal_com", "get_slots", {
                "event_type_id": params.get("event_type_id", 1),
                "start_time": params.get("start_time"),
                "end_time": params.get("end_time"),
            })
            return {"status": "completed", "result": result}
        
        elif action == "book_appointment":
            result = await self.mcp.call("cal_com", "create_booking", {
                "event_type_id": params.get("event_type_id", 1),
                "start_time": params.get("start_time"),
                "name": params.get("client_name"),
                "email": params.get("client_email"),
                "phone": params.get("client_phone"),
            })
            # Publish event
            await event_bus.publish("booking_created", {
                "business_id": business_id,
                "booking": result,
            })
            return {"status": "completed", "result": result}
        
        return {"status": "failed", "error": f"Unknown booking action: {action}"}
    
    async def _engine_invoice(self, action: str, params: dict, business_id: str) -> dict:
        """Invoice Engine — generates and tracks invoices."""
        if action == "generate_invoice":
            # Generate invoice content with AI
            invoice = await ai_json(
                f"Create an invoice for: {params.get('client_name', 'Client')}\nService: {params.get('service', '')}\nAmount: ₦{params.get('amount', 0)}\nDue date: {params.get('due_date', '')}\nReturn JSON: {{invoice_number, items: [], subtotal, tax, total, notes}}",
                "Generate a professional invoice. Return only JSON.",
            )
            
            # Save to Supabase
            from db.supabase_client import get_supabase, is_db_ready
            if is_db_ready():
                sb = get_supabase()
                sb.table("invoices").insert({
                    "business_id": business_id,
                    "client_name": params.get("client_name"),
                    "client_email": params.get("client_email"),
                    "amount": params.get("amount"),
                    "service": params.get("service"),
                    "status": "pending",
                    "invoice_data": json.dumps(invoice),
                }).execute()
            
            return {"status": "completed", "result": invoice}
        
        elif action == "track_invoices":
            from db.supabase_client import get_supabase, is_db_ready
            if is_db_ready():
                sb = get_supabase()
                resp = sb.table("invoices").select("*").eq("business_id", business_id).execute()
                return {"status": "completed", "result": {"invoices": resp.data}}
            return {"status": "completed", "result": {"invoices": []}}
        
        return {"status": "failed", "error": f"Unknown invoice action: {action}"}
    
    async def _engine_payment(self, action: str, params: dict, business_id: str) -> dict:
        """Payment Engine — collects and tracks payments."""
        if action == "create_payment_link":
            gateway = params.get("gateway", "paystack")
            
            if gateway == "paystack":
                # Paystack direct API
                import os, httpx
                key = os.getenv("PAYSTACK_SECRET_KEY", "")
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        "https://api.paystack.co/transaction/initialize",
                        headers={"Authorization": f"Bearer {key}"},
                        json={
                            "email": params.get("email"),
                            "amount": int(params.get("amount", 0) * 100),  # kobo
                            "currency": "NGN",
                            "callback_url": params.get("callback_url", "https://ergio.vercel.app/payment/callback"),
                        },
                        timeout=30.0,
                    )
                    resp.raise_for_status()
                    result = resp.json()
                return {"status": "completed", "result": result}
            
            elif gateway == "stripe":
                result = await self.mcp.call("stripe", "create_payment_link", params)
                return {"status": "completed", "result": result}
            
            elif gateway == "flutterwave":
                result = await self.plugin_sandbox.execute("flutterwave", "create_payment_link", params, business_id)
                return result
        
        elif action == "track_revenue":
            from db.supabase_client import get_supabase, is_db_ready
            if is_db_ready():
                sb = get_supabase()
                resp = sb.table("payments").select("amount, currency, status, created_at").eq("business_id", business_id).eq("status", "success").execute()
                total = sum(r.get("amount", 0) for r in resp.data)
                return {"status": "completed", "result": {"total_revenue": total, "count": len(resp.data), "payments": resp.data}}
            return {"status": "completed", "result": {"total_revenue": 0, "count": 0}}
        
        return {"status": "failed", "error": f"Unknown payment action: {action}"}
    
    async def _engine_content(self, action: str, params: dict, business_id: str) -> dict:
        """Content Engine — generates marketing content and video ads."""
        if action == "generate_content":
            content = await ai_smart(
                f"Generate marketing content for a {params.get('business_type', '')} called '{params.get('business_name', '')}'. "
                f"Platform: {params.get('platform', 'instagram')}. "
                f"Tone: professional but friendly. Nigerian context. "
                f"Generate: 1 caption with hashtags, 1 short video script idea, 3 story ideas.",
                "You are ERGIO's Content Engine. Generate engaging marketing content.",
                max_tokens=2000,
            )
            return {"status": "completed", "result": {"content": content}}
        
        elif action == "generate_video_ad":
            # Use Higgsfield MCP to generate a video ad
            result = await self.mcp.call("higgsfield", "generate_video", {
                "prompt": params.get("prompt", f"Professional ad video for {params.get('business_name', 'a business')}"),
                "model": params.get("model", "kling-3"),
                "duration": params.get("duration", 5),
                "aspect_ratio": params.get("aspect_ratio", "9:16"),
            })
            return {"status": "completed", "result": result}
        
        elif action == "generate_product_photo":
            result = await self.mcp.call("higgsfield", "generate_image", {
                "prompt": params.get("prompt", f"Professional product photo for {params.get('product_name', 'product')}"),
                "width": 1024,
                "height": 1024,
            })
            return {"status": "completed", "result": result}
        
        return {"status": "failed", "error": f"Unknown content action: {action}"}
    
    async def _engine_voice(self, action: str, params: dict, business_id: str) -> dict:
        """Voice Engine — AI voice receptionist using ElevenLabs."""
        if action == "text_to_speech":
            result = await self.mcp.call("elevenlabs", "text_to_speech", {
                "text": params.get("text", ""),
                "voice_id": params.get("voice_id", "21m00Tcm4TlvDq8ikWAM"),  # default voice
                "model_id": params.get("model", "eleven_turbo_v2"),
            })
            return {"status": "completed", "result": result}
        
        elif action == "answer_call":
            # Generate AI response for incoming call
            response_text = await ai_smart(
                f"A customer is calling a {params.get('business_type', '')} called '{params.get('business_name', '')}'. "
                f"Their question: {params.get('question', '')}. "
                f"Generate a helpful, professional response. Nigerian English. Keep it under 30 seconds of speech.",
                "You are ERGIO's Voice Engine answering a business call. Be concise and professional.",
                max_tokens=500,
            )
            # Convert to speech
            audio = await self.mcp.call("elevenlabs", "text_to_speech", {
                "text": response_text,
                "voice_id": params.get("voice_id", "21m00Tcm4TlvDq8ikWAM"),
            })
            return {"status": "completed", "result": {"text": response_text, "audio": audio}}
        
        return {"status": "failed", "error": f"Unknown voice action: {action}"}
    
    async def _engine_analytics(self, action: str, params: dict, business_id: str) -> dict:
        """Analytics Engine — revenue, leads, insights, forecasting."""
        if action == "get_dashboard":
            from db.supabase_client import get_supabase, is_db_ready
            if not is_db_ready():
                return {"status": "completed", "result": {"message": "No data yet"}}
            
            sb = get_supabase()
            # Parallel queries
            businesses = sb.table("businesses").select("*").eq("owner_id", params.get("user_id", "")).execute()
            leads = sb.table("leads").select("*").eq("business_id", business_id).execute() if business_id else {"data": []}
            invoices = sb.table("invoices").select("*").eq("business_id", business_id).execute() if business_id else {"data": []}
            payments = sb.table("payments").select("*").eq("business_id", business_id).execute() if business_id else {"data": []}
            
            return {
                "status": "completed",
                "result": {
                    "businesses": len(businesses.data),
                    "leads": len(leads.data) if isinstance(leads, dict) else len(leads),
                    "invoices": len(invoices.data) if isinstance(invoices, dict) else len(invoices),
                    "revenue": sum(p.get("amount", 0) for p in (payments.data if isinstance(payments, dict) else payments)),
                }
            }
        
        elif action == "weekly_insights":
            insights = await ai_smart(
                f"Generate a weekly business insights report. Business type: {params.get('business_type', '')}. "
                f"Leads this week: {params.get('leads_count', 0)}. Revenue: ₦{params.get('revenue', 0)}. "
                f"Top performing channel: {params.get('top_channel', 'WhatsApp')}. "
                f"Generate 3 actionable insights to grow the business.",
                "You are ERGIO's Analytics Engine. Be concise and data-driven.",
                max_tokens=1000,
            )
            return {"status": "completed", "result": {"insights": insights}}
        
        return {"status": "failed", "error": f"Unknown analytics action: {action}"}
    
    async def _engine_reputation(self, action: str, params: dict, business_id: str) -> dict:
        """Reputation Engine — review management."""
        if action == "request_review":
            # After service completion, send review request
            message = await ai_fast(
                f"Write a WhatsApp message asking for a review after a {params.get('service', '')} service. Business: {params.get('business_name', '')}. Keep it short and friendly. Nigerian English.",
                "You are ERGIO's Reputation Engine. Write a short WhatsApp review request.",
            )
            return {"status": "completed", "result": {"message": message, "channel": "whatsapp"}}
        
        elif action == "respond_to_review":
            # Draft a response to a review (needs approval)
            response = await ai_smart(
                f"Draft a response to this review:\nReview: {params.get('review_text', '')}\nRating: {params.get('rating', 5)}/5\nBusiness: {params.get('business_name', '')}\n\nWrite a professional response. If positive: thank them. If negative: apologize and offer to fix. Nigerian English.",
                "You are ERGIO's Reputation Engine. Write professional review responses.",
                max_tokens=500,
            )
            return {"status": "completed", "result": {"draft_response": response}}
        
        return {"status": "failed", "error": f"Unknown reputation action: {action}"}
    
    async def _engine_workflow(self, action: str, params: dict, business_id: str) -> dict:
        """Workflow Engine — visual automation builder."""
        if action == "trigger_workflow":
            # Trigger n8n workflow
            result = await self.mcp.call("n8n", "trigger_workflow", {
                "workflow_id": params.get("workflow_id"),
                "data": params.get("data", {}),
            })
            return {"status": "completed", "result": result}
        
        elif action == "create_recipe":
            # Pre-built workflow recipe
            recipes = {
                "new_lead_whatsapp": {
                    "trigger": "lead_captured",
                    "steps": ["score_lead", "if_score_above_80", "send_whatsapp_alert"],
                },
                "new_booking_invoice": {
                    "trigger": "booking_created",
                    "steps": ["generate_invoice", "send_invoice_email", "track_payment"],
                },
                "post_sale_review": {
                    "trigger": "payment_success",
                    "steps": ["wait_24_hours", "send_review_request", "track_review"],
                },
                "weekly_content": {
                    "trigger": "every_monday_9am",
                    "steps": ["generate_content", "queue_social_posts", "notify_dashboard"],
                },
            }
            recipe_name = params.get("recipe", "")
            recipe = recipes.get(recipe_name)
            if recipe:
                return {"status": "completed", "result": {"recipe": recipe_name, "workflow": recipe}}
            return {"status": "failed", "error": f"Unknown recipe: {recipe_name}. Available: {list(recipes.keys())}"}
        
        return {"status": "failed", "error": f"Unknown workflow action: {action}"}


# Global conductor instance
conductor = Conductor()
