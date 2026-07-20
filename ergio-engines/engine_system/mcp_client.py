"""
ERGIO MCP Client v5.1
Connects to 25 MCP servers with real API implementations.
Handles auth, retries, circuit breaker, and fallbacks.
Each MCP is an external tool server that ERGIO calls to get real work done.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import httpx
import asyncio
import json
import base64
from typing import Any, Optional
from utils.logger import log
from engine_system.circuit_breaker import with_retry, breaker


# MCP Registry — 25 MCP servers
MCP_REGISTRY = {
    # ── Core (already in ERGIO) ──
    "stripe": {
        "url": "https://api.stripe.com/v1",
        "auth_type": "bearer",
        "key_env": "STRIPE_API_KEY",
        "capabilities": ["create_payment_link", "create_invoice", "list_customers", "create_customer", "retrieve_balance", "create_price", "create_product"],
    },
    "resend": {
        "url": "https://api.resend.com",
        "auth_type": "bearer",
        "key_env": "RESEND_API_KEY",
        "capabilities": ["send_email", "send_batch", "create_domain"],
    },
    "supabase": {
        "url": None,
        "auth_type": "sdk",
        "key_env": "SUPABASE_SERVICE_KEY",
        "capabilities": ["query", "insert", "update", "delete", "rpc", "storage_upload", "storage_url"],
    },
    "groq": {
        "url": "https://api.groq.com/openai/v1",
        "auth_type": "bearer",
        "key_env": "GROQ_API_KEY",
        "capabilities": ["chat_completion", "json_completion", "list_models"],
    },
    "google_maps": {
        "url": "https://maps.googleapis.com/maps/api",
        "auth_type": "query_param",
        "key_env": "GOOGLE_MAPS_API_KEY",
        "key_param": "key",
        "capabilities": ["geocode", "place_search", "place_details", "directions", "distance_matrix"],
    },
    "twilio": {
        "url": "https://api.twilio.com",
        "auth_type": "basic",
        "key_env": "TWILIO_AUTH_TOKEN",
        "key_user_env": "TWILIO_ACCOUNT_SID",
        "capabilities": ["send_whatsapp", "send_sms", "make_call", "list_messages"],
    },
    "cloudflare": {
        "url": "https://api.cloudflare.com/client/v4",
        "auth_type": "bearer",
        "key_env": "CLOUDFLARE_API_TOKEN",
        "capabilities": ["purge_cache", "create_dns_record", "list_zones", "create_worker", "get_analytics"],
    },
    # ── Creative & Media ──
    "higgsfield": {
        "url": "https://mcp.higgsfield.ai",
        "auth_type": "bearer",
        "key_env": "HIGGSFIELD_API_KEY",
        "capabilities": ["generate_video", "generate_image", "create_ad_variant", "generate_ugc", "generate_product_photo", "edit_video", "create_template"],
    },
    "elevenlabs": {
        "url": "https://api.elevenlabs.io/v1",
        "auth_type": "header",
        "key_env": "ELEVENLABS_API_KEY",
        "key_header": "xi-api-key",
        "capabilities": ["text_to_speech", "create_voice", "stream_voice", "list_voices", "voice_clone"],
    },
    # ── Lead & Sales ──
    "clay": {
        "url": "https://api.clay.com/v3",
        "auth_type": "bearer",
        "key_env": "CLAY_API_KEY",
        "capabilities": ["search_people", "enrich_company", "find_email", "find_phone", "build_lead_list", "enrich_person"],
    },
    "apify": {
        "url": "https://api.apify.com/v2",
        "auth_type": "bearer",
        "key_env": "APIFY_API_KEY",
        "capabilities": ["run_actor", "scrape_url", "get_dataset", "search_google", "scrape_google_maps"],
    },
    "instantly": {
        "url": "https://api.instantly.ai/v1",
        "auth_type": "bearer",
        "key_env": "INSTANTLY_API_KEY",
        "capabilities": ["create_campaign", "add_leads", "send_sequence", "get_replies", "pause_campaign", "get_analytics"],
    },
    # ── Scheduling & Communication ──
    "cal_com": {
        "url": "https://api.cal.com/v1",
        "auth_type": "bearer",
        "key_env": "CAL_COM_API_KEY",
        "capabilities": ["get_slots", "create_booking", "cancel_booking", "list_event_types", "create_event_type"],
    },
    "postmark": {
        "url": "https://api.postmarkapp.com",
        "auth_type": "header",
        "key_env": "POSTMARK_SERVER_TOKEN",
        "key_header": "X-Postmark-Server-Token",
        "capabilities": ["send_email", "send_batch", "get_delivery_stats", "create_template"],
    },
    # ── Workflow ──
    "n8n": {
        "url": None,
        "auth_type": "header",
        "key_env": "N8N_WEBHOOK_KEY",
        "key_header": "X-N8N-API-KEY",
        "capabilities": ["trigger_workflow", "list_workflows", "get_execution", "activate_workflow"],
    },
    # ════════════════════════════════════════
    # NEW MCPs (10 added in v5.1)
    # ════════════════════════════════════════
    "tavily": {
        "url": "https://api.tavily.com",
        "auth_type": "bearer",
        "key_env": "TAVILY_API_KEY",
        "capabilities": ["search", "extract", "search_news", "get_answer"],
    },
    "github": {
        "url": "https://api.github.com",
        "auth_type": "bearer",
        "key_env": "GITHUB_TOKEN",
        "capabilities": ["create_repo", "push_file", "create_issue", "create_pr", "list_repos", "get_repo", "deploy_pages"],
    },
    "slack": {
        "url": "https://slack.com/api",
        "auth_type": "bearer",
        "key_env": "SLACK_BOT_TOKEN",
        "capabilities": ["send_message", "create_channel", "list_channels", "get_history", "post_update"],
    },
    "notion": {
        "url": "https://api.notion.com/v1",
        "auth_type": "bearer",
        "key_env": "NOTION_API_KEY",
        "capabilities": ["create_page", "search", "update_database", "query_database", "create_database"],
    },
    "google_ads": {
        "url": "https://googleads.googleapis.com/v15",
        "auth_type": "bearer",
        "key_env": "GOOGLE_ADS_ACCESS_TOKEN",
        "capabilities": ["create_campaign", "get_report", "manage_keywords", "get_conversions"],
    },
    "meta_ads": {
        "url": "https://graph.facebook.com/v18.0",
        "auth_type": "bearer",
        "key_env": "META_ADS_ACCESS_TOKEN",
        "capabilities": ["create_ad_campaign", "get_ad_insights", "manage_audience", "create_ad_creative"],
    },
    "whatsapp_business": {
        "url": "https://graph.facebook.com/v18.0",
        "auth_type": "bearer",
        "key_env": "WHATSAPP_BUSINESS_TOKEN",
        "capabilities": ["send_template", "send_text", "send_media", "send_interactive", "get_business_profile"],
    },
    "vercel": {
        "url": "https://api.vercel.com/v6",
        "auth_type": "bearer",
        "key_env": "VERCEL_API_TOKEN",
        "capabilities": ["deploy_project", "get_deployment", "list_projects", "create_project", "set_env_var"],
    },
    "sentry": {
        "url": "https://sentry.io/api/0",
        "auth_type": "bearer",
        "key_env": "SENTRY_AUTH_TOKEN",
        "capabilities": ["get_issues", "create_release", "get_events", "list_projects"],
    },
    "pinecone": {
        "url": None,  # uses Pinecone SDK
        "auth_type": "header",
        "key_env": "PINECONE_API_KEY",
        "capabilities": ["upsert_vectors", "query_vectors", "delete_vectors", "create_index", "describe_index"],
    },
}


class MCPClient:
    """
    Unified client for all 25 MCP servers.
    Handles authentication, retries, circuit breaker, and fallbacks.
    """
    
    def __init__(self):
        self.registry = MCP_REGISTRY
        self._clients: dict = {}
    
    def _get_http_client(self, mcp_name: str) -> httpx.AsyncClient:
        if mcp_name not in self._clients:
            self._clients[mcp_name] = httpx.AsyncClient(timeout=60.0)
        return self._clients[mcp_name]
    
    def _get_auth_headers(self, mcp_name: str) -> dict:
        config = self.registry.get(mcp_name)
        if not config:
            raise ValueError(f"Unknown MCP: {mcp_name}")
        
        key = os.getenv(config["key_env"], "")
        if not key:
            raise RuntimeError(f"Missing env var {config['key_env']} for MCP {mcp_name}")
        
        if config["auth_type"] == "bearer":
            return {"Authorization": f"Bearer {key}"}
        elif config["auth_type"] == "header":
            header_name = config.get("key_header", "Authorization")
            return {header_name: key}
        elif config["auth_type"] == "basic":
            user = os.getenv(config.get("key_user_env", ""), "")
            credentials = base64.b64encode(f"{user}:{key}".encode()).decode()
            return {"Authorization": f"Basic {credentials}"}
        return {}
    
    def is_configured(self, mcp_name: str) -> bool:
        """Check if an MCP has its API key configured."""
        config = self.registry.get(mcp_name)
        if not config:
            return False
        return bool(os.getenv(config["key_env"], ""))
    
    def list_available(self) -> dict:
        """List all MCPs with their configuration status and circuit breaker state."""
        result = {}
        for name, config in self.registry.items():
            result[name] = {
                "configured": bool(os.getenv(config["key_env"], "")),
                "circuit": breaker.get_status().get(f"mcp_{name}", {}).get("state", "closed"),
                "capabilities": config.get("capabilities", []),
                "total_capabilities": len(config.get("capabilities", [])),
            }
        return result
    
    async def call(self, mcp_name: str, capability: str, params: dict = None) -> dict:
        """
        Call a specific capability on an MCP server.
        Example: mcp.call("higgsfield", "generate_video", {"prompt": "ad for a bakery"})
        """
        config = self.registry.get(mcp_name)
        if not config:
            raise ValueError(f"Unknown MCP: {mcp_name}")
        
        if capability not in config.get("capabilities", []):
            raise ValueError(f"MCP {mcp_name} does not support capability '{capability}'")
        
        if not breaker.is_available(f"mcp_{mcp_name}"):
            raise RuntimeError(f"Circuit breaker OPEN for MCP {mcp_name}. Temporarily disabled.")
        
        # Special handlers
        if mcp_name == "supabase":
            return await self._call_supabase(capability, params or {})
        if mcp_name == "n8n":
            return await self._call_n8n(capability, params or {})
        if mcp_name == "pinecone":
            return await self._call_pinecone(capability, params or {})
        
        url = config["url"]
        headers = self._get_auth_headers(mcp_name)
        headers["Content-Type"] = "application/json"
        
        # Build endpoint
        endpoint = self._build_endpoint(mcp_name, capability, params or {})
        full_url = f"{url}{endpoint}"
        
        async def _do_request():
            client = self._get_http_client(mcp_name)
            method = "GET"
            if capability.startswith(("create", "send", "generate", "add", "run", "trigger", "deploy", "push", "post", "activate", "upsert")):
                method = "POST"
            elif capability.startswith("update"):
                method = "PATCH"
            elif capability.startswith(("delete", "cancel", "pause", "remove")):
                method = "DELETE"
            
            if method == "GET":
                if config["auth_type"] == "query_param":
                    params = params or {}
                    params[config["key_param"]] = os.getenv(config["key_env"], "")
                resp = await client.get(full_url, headers=headers, params=params)
            else:
                resp = await client.request(method, full_url, headers=headers, json=params)
            
            resp.raise_for_status()
            try:
                return resp.json()
            except:
                return {"status": "ok", "text": resp.text}
        
        try:
            result = await with_retry(
                _do_request,
                service_name=f"mcp_{mcp_name}",
                max_retries=3,
                timeout=60.0,
            )
            return result
        except Exception as e:
            log.error(f"MCP {mcp_name}.{capability} failed: {e}")
            fallback = self._get_fallback(mcp_name, capability)
            if fallback:
                log.info(f"Using fallback for {mcp_name}.{capability}")
                return await fallback(params or {})
            raise
    
    def _build_endpoint(self, mcp_name: str, capability: str, params: dict) -> str:
        """Build the API endpoint path for a capability."""
        endpoints = {
            "stripe": {
                "create_payment_link": "/payment_links",
                "create_invoice": "/invoices",
                "list_customers": "/customers",
                "create_customer": "/customers",
                "retrieve_balance": "/balance",
                "create_price": "/prices",
                "create_product": "/products",
            },
            "resend": {
                "send_email": "/emails",
                "send_batch": "/emails/batch",
                "create_domain": "/domains",
            },
            "higgsfield": {
                "generate_video": "/videos/generate",
                "generate_image": "/images/generate",
                "create_ad_variant": "/ads/variant",
                "generate_ugc": "/ugc/generate",
                "generate_product_photo": "/products/photo",
                "edit_video": "/videos/edit",
                "create_template": "/templates",
            },
            "clay": {
                "search_people": "/people/search",
                "enrich_company": "/companies/enrich",
                "find_email": "/people/email",
                "find_phone": "/people/phone",
                "build_lead_list": "/leads/build",
                "enrich_person": "/people/enrich",
            },
            "elevenlabs": {
                "text_to_speech": "/text-to-speech",
                "create_voice": "/voices",
                "stream_voice": "/text-to-speech/stream",
                "list_voices": "/voices",
                "voice_clone": "/voices/add",
            },
            "apify": {
                "run_actor": "/acts/runs",
                "scrape_url": "/acts/web-scraper/runs",
                "get_dataset": "/datasets",
                "search_google": "/acts/google-search-scraper/runs",
                "scrape_google_maps": "/acts/google-maps-scraper/runs",
            },
            "instantly": {
                "create_campaign": "/campaigns",
                "add_leads": "/leads",
                "send_sequence": "/campaigns/sequence",
                "get_replies": "/campaigns/replies",
                "pause_campaign": "/campaigns/pause",
                "get_analytics": "/analytics",
            },
            "cal_com": {
                "get_slots": "/slots",
                "create_booking": "/bookings",
                "cancel_booking": "/bookings",
                "list_event_types": "/event-types",
                "create_event_type": "/event-types",
            },
            "postmark": {
                "send_email": "/email",
                "send_batch": "/email/batch",
                "get_delivery_stats": "/deliverystats",
                "create_template": "/templates",
            },
            "tavily": {
                "search": "/search",
                "extract": "/extract",
                "search_news": "/search",
                "get_answer": "/search",
            },
            "github": {
                "create_repo": "/user/repos",
                "push_file": lambda p: f"/repos/{p.get('owner','')}/{p.get('repo','')}/contents/{p.get('path','')}",
                "create_issue": lambda p: f"/repos/{p.get('owner','')}/{p.get('repo','')}/issues",
                "create_pr": lambda p: f"/repos/{p.get('owner','')}/{p.get('repo','')}/pulls",
                "list_repos": "/user/repos",
                "get_repo": lambda p: f"/repos/{p.get('owner','')}/{p.get('repo','')}",
                "deploy_pages": lambda p: f"/repos/{p.get('owner','')}/{p.get('repo','')}/pages",
            },
            "slack": {
                "send_message": "/chat.postMessage",
                "create_channel": "/conversations.create",
                "list_channels": "/conversations.list",
                "get_history": "/conversations.history",
                "post_update": "/chat.postMessage",
            },
            "notion": {
                "create_page": "/pages",
                "search": "/search",
                "update_database": lambda p: f"/databases/{p.get('database_id','')}",
                "query_database": lambda p: f"/databases/{p.get('database_id','')}/query",
                "create_database": "/databases",
            },
            "google_ads": {
                "create_campaign": "/customers/{customer_id}/campaigns",
                "get_report": "/customers/{customer_id}/reports",
                "manage_keywords": "/customers/{customer_id}/adGroups/criteria",
                "get_conversions": "/customers/{customer_id}/conversionActions",
            },
            "meta_ads": {
                "create_ad_campaign": "/{ad_account_id}/campaigns",
                "get_ad_insights": "/{ad_account_id}/insights",
                "manage_audience": "/{ad_account_id}/customaudiences",
                "create_ad_creative": "/{ad_account_id}/adcreatives",
            },
            "whatsapp_business": {
                "send_template": "/{phone_number_id}/messages",
                "send_text": "/{phone_number_id}/messages",
                "send_media": "/{phone_number_id}/messages",
                "send_interactive": "/{phone_number_id}/messages",
                "get_business_profile": "/{phone_number_id}/whatsapp_business_profile",
            },
            "vercel": {
                "deploy_project": "/deployments",
                "get_deployment": lambda p: f"/deployments/{p.get('id','')}",
                "list_projects": "/projects",
                "create_project": "/projects",
                "set_env_var": lambda p: f"/projects/{p.get('project_id','')}/env",
            },
            "sentry": {
                "get_issues": "/projects/{organization}/{project}/issues/",
                "create_release": "/organizations/{organization}/releases/",
                "get_events": "/organizations/{organization}/events/",
                "list_projects": "/projects/",
            },
            "google_maps": {
                "geocode": "/geocode/json",
                "place_search": "/place/textsearch/json",
                "place_details": "/place/details/json",
                "directions": "/directions/json",
                "distance_matrix": "/distancematrix/json",
            },
            "twilio": {
                "send_whatsapp": lambda p: f"/2010-04-01/Accounts/{os.getenv('TWILIO_ACCOUNT_SID','')}/Messages.json",
                "send_sms": lambda p: f"/2010-04-01/Accounts/{os.getenv('TWILIO_ACCOUNT_SID','')}/Messages.json",
                "make_call": lambda p: f"/2010-04-01/Accounts/{os.getenv('TWILIO_ACCOUNT_SID','')}/Calls.json",
                "list_messages": lambda p: f"/2010-04-01/Accounts/{os.getenv('TWILIO_ACCOUNT_SID','')}/Messages.json",
            },
            "cloudflare": {
                "purge_cache": lambda p: f"/zones/{p.get('zone_id','')}/purge_cache",
                "create_dns_record": lambda p: f"/zones/{p.get('zone_id','')}/dns_records",
                "list_zones": "/zones",
                "create_worker": f"/accounts/{os.getenv('CLOUDFLARE_ACCOUNT_ID','')}/workers/scripts",
                "get_analytics": lambda p: f"/zones/{p.get('zone_id','')}/analytics/dashboard",
            },
        }
        
        mcp_endpoints = endpoints.get(mcp_name, {})
        ep = mcp_endpoints.get(capability, "")
        if callable(ep):
            return ep(params)
        return ep
    
    async def _call_supabase(self, capability: str, params: dict) -> dict:
        """Real Supabase SDK calls."""
        from db.supabase_client import is_db_ready
        if not is_db_ready():
            raise RuntimeError("Supabase not configured")
        
        from db.supabase_client import get_supabase
        sb = get_supabase()
        
        table = params.get("table", "")
        data = params.get("data", {})
        filters = params.get("filters", {})
        query = params.get("query", "*")
        
        if capability == "query":
            q = sb.table(table).select(query)
            for k, v in filters.items():
                q = q.eq(k, v)
            resp = q.execute()
            return {"data": resp.data, "count": len(resp.data)}
        elif capability == "insert":
            resp = sb.table(table).insert(data).execute()
            return {"data": resp.data, "inserted": len(resp.data)}
        elif capability == "update":
            resp = sb.table(table).update(data).match(filters).execute()
            return {"data": resp.data, "updated": len(resp.data)}
        elif capability == "delete":
            resp = sb.table(table).delete().match(filters).execute()
            return {"data": resp.data, "deleted": len(resp.data)}
        elif capability == "rpc":
            fn = params.get("function", "")
            resp = sb.rpc(fn, params.get("args", {})).execute()
            return {"data": resp.data}
        elif capability == "storage_upload":
            bucket = params.get("bucket", "public")
            path = params.get("path", "")
            file_data = params.get("file_data", "")
            resp = sb.storage.from_(bucket).upload(path, file_data)
            return {"url": resp.get("Key", path)}
        elif capability == "storage_url":
            bucket = params.get("bucket", "public")
            path = params.get("path", "")
            url = sb.storage.from_(bucket).get_public_url(path)
            return {"url": url}
        raise ValueError(f"Unknown Supabase capability: {capability}")
    
    async def _call_n8n(self, capability: str, params: dict) -> dict:
        """Real n8n webhook calls."""
        webhook_url = os.getenv("N8N_WEBHOOK_URL", "")
        if not webhook_url:
            raise RuntimeError("N8N_WEBHOOK_URL not configured")
        
        headers = {}
        key = os.getenv("N8N_WEBHOOK_KEY", "")
        if key:
            headers["X-N8N-API-KEY"] = key
        
        if capability == "trigger_workflow":
            async with httpx.AsyncClient() as client:
                resp = await client.post(webhook_url, headers=headers, json=params)
                resp.raise_for_status()
                return resp.json()
        elif capability == "list_workflows":
            base = webhook_url.replace("/webhook", "/api/v1/workflows")
            async with httpx.AsyncClient() as client:
                resp = await client.get(base, headers=headers)
                resp.raise_for_status()
                return resp.json()
        elif capability == "get_execution":
            exec_id = params.get("execution_id", "")
            base = webhook_url.replace("/webhook", f"/api/v1/executions/{exec_id}")
            async with httpx.AsyncClient() as client:
                resp = await client.get(base, headers=headers)
                resp.raise_for_status()
                return resp.json()
        elif capability == "activate_workflow":
            wf_id = params.get("workflow_id", "")
            base = webhook_url.replace("/webhook", f"/api/v1/workflows/{wf_id}/activate")
            async with httpx.AsyncClient() as client:
                resp = await client.post(base, headers=headers, json=params)
                resp.raise_for_status()
                return resp.json()
        raise ValueError(f"Unknown n8n capability: {capability}")
    
    async def _call_pinecone(self, capability: str, params: dict) -> dict:
        """Real Pinecone vector DB calls for semantic search and memory."""
        from pinecone import Pinecone, ServerlessSpec
        api_key = os.getenv("PINECONE_API_KEY", "")
        if not api_key:
            raise RuntimeError("PINECONE_API_KEY not configured")
        
        pc = Pinecone(api_key=api_key)
        
        if capability == "create_index":
            pc.create_index(
                name=params.get("name", "ergio-memory"),
                dimension=params.get("dimension", 1536),
                metric=params.get("metric", "cosine"),
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
            return {"status": "created", "index": params.get("name")}
        
        elif capability == "upsert_vectors":
            index = pc.Index(params.get("index", "ergio-memory"))
            vectors = params.get("vectors", [])
            index.upsert(vectors=vectors)
            return {"status": "upserted", "count": len(vectors)}
        
        elif capability == "query_vectors":
            index = pc.Index(params.get("index", "ergio-memory"))
            results = index.query(
                vector=params.get("vector", []),
                top_k=params.get("top_k", 5),
                include_metadata=params.get("include_metadata", True),
            )
            return {"matches": results.to_dict()}
        
        elif capability == "delete_vectors":
            index = pc.Index(params.get("index", "ergio-memory"))
            index.delete(ids=params.get("ids", []))
            return {"status": "deleted"}
        
        elif capability == "describe_index":
            return pc.describe_index(params.get("index", "ergio-memory")).to_dict()
        
        raise ValueError(f"Unknown Pinecone capability: {capability}")
    
    def _get_fallback(self, mcp_name: str, capability: str):
        """Get a fallback handler for when the primary MCP fails."""
        fallbacks = {
            "groq": {
                "chat_completion": self._fallback_pollinations_text,
                "json_completion": self._fallback_pollinations_json,
            },
            "resend": {
                "send_email": self._fallback_postmark,
                "send_batch": self._fallback_postmark_batch,
            },
            "postmark": {
                "send_email": self._fallback_resend,
            },
            "higgsfield": {
                "generate_image": self._fallback_pollinations_image,
            },
        }
        return fallbacks.get(mcp_name, {}).get(capability)
    
    async def _fallback_pollinations_text(self, params):
        async with httpx.AsyncClient() as client:
            prompt = params.get("prompt", "Hello")
            resp = await client.get(f"https://text.pollinations.ai/{prompt}")
            return {"text": resp.text, "source": "pollinations_fallback"}
    
    async def _fallback_pollinations_json(self, params):
        prompt = params.get("prompt", "{}")
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://text.pollinations.ai/{prompt} Return ONLY valid JSON.")
            try:
                return json.loads(resp.text)
            except:
                return {"status": "fallback", "text": resp.text}
    
    async def _fallback_pollinations_image(self, params):
        import urllib.parse
        prompt = urllib.parse.quote(params.get("prompt", "abstract art"))
        w = params.get("width", 1024)
        h = params.get("height", 1024)
        url = f"https://image.pollinations.ai/prompt/{prompt}?width={w}&height={h}&nologo=true"
        return {"url": url, "source": "pollinations_fallback"}
    
    async def _fallback_postmark(self, params):
        token = os.getenv("POSTMARK_SERVER_TOKEN", "")
        if not token:
            raise RuntimeError("No fallback available — Postmark also not configured")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.postmarkapp.com/email",
                headers={"X-Postmark-Server-Token": token, "Content-Type": "application/json"},
                json=params,
            )
            return resp.json()
    
    async def _fallback_postmark_batch(self, params):
        token = os.getenv("POSTMARK_SERVER_TOKEN", "")
        if not token:
            raise RuntimeError("No fallback available")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.postmarkapp.com/email/batch",
                headers={"X-Postmark-Server-Token": token, "Content-Type": "application/json"},
                json=params.get("emails", []),
            )
            return resp.json()
    
    async def _fallback_resend(self, params):
        key = os.getenv("RESEND_API_KEY", "")
        if not key:
            raise RuntimeError("No fallback available")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json=params,
            )
            return resp.json()


# Global MCP client instance
mcp = MCPClient()
