"""
ERGIO Plugin Sandbox v5.1
Executes 30 plugins with human approval gating for external actions.
10 new plugins added: Shopify, Discord Bot, Reddit, Pinterest, Snapchat Ads,
WhatsApp Business, Google Drive, Zoom, HubSpot CRM, Google Calendar.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio
import json
from typing import Any, Optional
from utils.logger import log
from engine_system.circuit_breaker import with_retry, breaker


# Plugin Registry — 30 plugins
PLUGIN_REGISTRY = {
    # ════════════════════════════════════════
    # ORIGINAL 20 PLUGINS
    # ════════════════════════════════════════
    "whatsapp_crm": {
        "type": "external", "requires_approval": True, "mcp": "twilio",
        "capabilities": ["send_message", "broadcast", "auto_reply", "manage_contacts"],
    },
    "email_marketing": {
        "type": "external", "requires_approval": True, "mcp": "resend",
        "capabilities": ["send_campaign", "send_sequence", "track_opens"],
    },
    "google_analytics": {
        "type": "internal", "requires_approval": False, "mcp": None,
        "capabilities": ["track_visitors", "get_report", "get_realtime"],
    },
    "calendly": {
        "type": "external", "requires_approval": False, "mcp": "cal_com",
        "capabilities": ["get_slots", "book_appointment", "cancel_appointment"],
    },
    "flutterwave": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["create_payment_link", "verify_payment", "refund", "list_transactions"],
    },
    "instagram_feed": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["post_photo", "post_reel", "post_story", "get_insights"],
    },
    "push_notifications": {
        "type": "external", "requires_approval": False, "mcp": None,
        "capabilities": ["send_notification", "send_bulk", "schedule"],
    },
    "ai_live_chat": {
        "type": "internal", "requires_approval": False, "mcp": "groq",
        "capabilities": ["chat", "auto_respond", "handoff_to_human"],
    },
    "facebook_business": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["post_to_page", "manage_messages", "run_ads", "get_insights"],
    },
    "twitter": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["post_tweet", "schedule_thread", "track_engagement"],
    },
    "linkedin": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["post_to_page", "send_inmail", "get_leads"],
    },
    "tiktok": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["post_video", "get_trending", "track_views"],
    },
    "whatsapp_catalog": {
        "type": "external", "requires_approval": True, "mcp": "whatsapp_business",
        "capabilities": ["create_product", "update_catalog", "showcase_products"],
    },
    "google_business_profile": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["update_listing", "respond_to_review", "post_update"],
    },
    "youtube": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["upload_video", "manage_channel", "get_analytics"],
    },
    "mailchimp": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["create_campaign", "manage_subscribers", "get_reports"],
    },
    "notion": {
        "type": "internal", "requires_approval": False, "mcp": "notion",
        "capabilities": ["create_page", "search", "update_database"],
    },
    "canva": {
        "type": "internal", "requires_approval": False, "mcp": None,
        "capabilities": ["create_design", "generate_graphic", "export"],
    },
    "paystack_pos": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["create_charge", "verify_charge", "list_transactions"],
    },
    "telegram_bot": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["send_message", "broadcast", "manage_orders"],
    },
    # ════════════════════════════════════════
    # NEW 10 PLUGINS (v5.1)
    # ════════════════════════════════════════
    "shopify": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["create_product", "list_orders", "manage_inventory", "create_discount", "get_customers"],
    },
    "discord_bot": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["send_message", "create_embed", "manage_roles", "broadcast_announcement"],
    },
    "reddit": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["submit_post", "get_subreddit_data", "track_mentions", "respond_to_comment"],
    },
    "pinterest": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["create_pin", "create_board", "get_analytics", "schedule_pin"],
    },
    "snapchat_ads": {
        "type": "external", "requires_approval": True, "mcp": "meta_ads",
        "capabilities": ["create_ad", "get_campaign_performance", "manage_audience"],
    },
    "whatsapp_business_api": {
        "type": "external", "requires_approval": True, "mcp": "whatsapp_business",
        "capabilities": ["send_template", "send_interactive", "send_media_message", "get_business_profile"],
    },
    "google_drive": {
        "type": "internal", "requires_approval": False, "mcp": None,
        "capabilities": ["upload_file", "share_file", "create_folder", "list_files"],
    },
    "zoom": {
        "type": "external", "requires_approval": False, "mcp": None,
        "capabilities": ["create_meeting", "get_join_link", "list_meetings", "get_recording"],
    },
    "hubspot_crm": {
        "type": "external", "requires_approval": True, "mcp": None,
        "capabilities": ["create_contact", "create_deal", "get_pipeline", "send_email", "manage_tasks"],
    },
    "google_calendar": {
        "type": "internal", "requires_approval": False, "mcp": None,
        "capabilities": ["create_event", "list_events", "get_free_busy", "send_invite"],
    },
}


class PluginSandbox:
    """
    Executes plugins. External plugins queue for human approval.
    Internal plugins execute immediately.
    """
    
    def __init__(self, approval_gateway=None):
        self.registry = PLUGIN_REGISTRY
        self.approval_gateway = approval_gateway
    
    def list_available(self) -> dict:
        """List all plugins with their status."""
        result = {}
        for name, config in self.registry.items():
            result[name] = {
                "requires_approval": config["requires_approval"],
                "type": config["type"],
                "mcp": config.get("mcp"),
                "capabilities": config.get("capabilities", []),
                "total_capabilities": len(config.get("capabilities", [])),
            }
        return result
    
    async def execute(self, plugin_name: str, capability: str, params: dict = None, business_id: str = None) -> dict:
        """Execute a plugin capability."""
        config = self.registry.get(plugin_name)
        if not config:
            raise ValueError(f"Unknown plugin: {plugin_name}")
        
        if capability not in config.get("capabilities", []):
            raise ValueError(f"Plugin {plugin_name} does not support '{capability}'")
        
        if not breaker.is_available(f"plugin_{plugin_name}"):
            raise RuntimeError(f"Circuit breaker OPEN for plugin {plugin_name}")
        
        if config["requires_approval"] and self.approval_gateway:
            approval_id = await self.approval_gateway.queue(
                plugin_name=plugin_name, capability=capability,
                params=params or {}, business_id=business_id,
            )
            return {
                "status": "pending_approval", "approval_id": approval_id,
                "plugin": plugin_name, "capability": capability,
                "message": f"Queued for approval. ID: {approval_id}",
            }
        
        return await self._execute_now(plugin_name, capability, params or {}, business_id)
    
    async def _execute_now(self, plugin_name: str, capability: str, params: dict, business_id: str = None) -> dict:
        """Execute a plugin immediately."""
        config = self.registry[plugin_name]
        
        # Delegate to MCP if configured
        if config.get("mcp"):
            from engine_system.mcp_client import mcp
            try:
                result = await with_retry(
                    mcp.call, config["mcp"], capability, params,
                    service_name=f"plugin_{plugin_name}", max_retries=3, timeout=60.0,
                )
                return {"status": "completed", "plugin": plugin_name, "result": result}
            except Exception as e:
                log.error(f"Plugin {plugin_name}.{capability} failed: {e}")
                return {"status": "failed", "plugin": plugin_name, "error": str(e)}
        
        # Direct API call
        try:
            result = await self._call_direct_api(plugin_name, capability, params)
            return {"status": "completed", "plugin": plugin_name, "result": result}
        except Exception as e:
            log.error(f"Plugin {plugin_name}.{capability} failed: {e}")
            return {"status": "failed", "plugin": plugin_name, "error": str(e)}
    
    async def _call_direct_api(self, plugin_name: str, capability: str, params: dict) -> dict:
        """Direct HTTP calls for plugins without MCP delegation."""
        import httpx
        
        api_configs = {
            "flutterwave": {"base_url": "https://api.flutterwave.com/v3", "key_env": "FLUTTERWAVE_SECRET_KEY", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "paystack_pos": {"base_url": "https://api.paystack.co", "key_env": "PAYSTACK_SECRET_KEY", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "instagram_feed": {"base_url": "https://graph.instagram.com", "key_env": "INSTAGRAM_ACCESS_TOKEN", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "facebook_business": {"base_url": "https://graph.facebook.com/v18.0", "key_env": "FACEBOOK_PAGE_TOKEN", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "twitter": {"base_url": "https://api.twitter.com/2", "key_env": "TWITTER_BEARER_TOKEN", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "linkedin": {"base_url": "https://api.linkedin.com/v2", "key_env": "LINKEDIN_ACCESS_TOKEN", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "tiktok": {"base_url": "https://open.tiktokapis.com/v2", "key_env": "TIKTOK_ACCESS_TOKEN", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "google_analytics": {"base_url": "https://analyticsreporting.googleapis.com/v4", "key_env": "GOOGLE_ANALYTICS_KEY", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "push_notifications": {"base_url": "https://fcm.googleapis.com/fcm", "key_env": "FCM_SERVER_KEY", "auth_header": "Authorization", "auth_prefix": "key="},
            "telegram_bot": {"base_url": "https://api.telegram.org", "key_env": "TELEGRAM_BOT_TOKEN", "auth_header": None, "auth_prefix": None},
            "youtube": {"base_url": "https://www.googleapis.com/youtube/v3", "key_env": "YOUTUBE_API_KEY", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "mailchimp": {"base_url": "https://{dc}.api.mailchimp.com/3.0", "key_env": "MAILCHIMP_API_KEY", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "canva": {"base_url": "https://api.canva.com/v1", "key_env": "CANVA_API_KEY", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "google_business_profile": {"base_url": "https://mybusinessbusinessinformation.googleapis.com/v1", "key_env": "GOOGLE_BUSINESS_PROFILE_TOKEN", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            # NEW plugins
            "shopify": {"base_url": "https://{shop}.myshopify.com/admin/api/2024-01", "key_env": "SHOPIFY_ACCESS_TOKEN", "auth_header": "X-Shopify-Access-Token", "auth_prefix": None},
            "discord_bot": {"base_url": "https://discord.com/api/v10", "key_env": "DISCORD_BOT_TOKEN", "auth_header": "Authorization", "auth_prefix": "Bot "},
            "reddit": {"base_url": "https://oauth.reddit.com", "key_env": "REDDIT_ACCESS_TOKEN", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "pinterest": {"base_url": "https://api.pinterest.com/v5", "key_env": "PINTEREST_ACCESS_TOKEN", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "google_drive": {"base_url": "https://www.googleapis.com/drive/v3", "key_env": "GOOGLE_DRIVE_TOKEN", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "zoom": {"base_url": "https://api.zoom.us/v2", "key_env": "ZOOM_ACCESS_TOKEN", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "hubspot_crm": {"base_url": "https://api.hubapi.com/crm/v3", "key_env": "HUBSPOT_API_KEY", "auth_header": "Authorization", "auth_prefix": "Bearer "},
            "google_calendar": {"base_url": "https://www.googleapis.com/calendar/v3", "key_env": "GOOGLE_CALENDAR_TOKEN", "auth_header": "Authorization", "auth_prefix": "Bearer "},
        }
        
        cfg = api_configs.get(plugin_name)
        if not cfg:
            raise ValueError(f"No API config for plugin: {plugin_name}")
        
        key = os.getenv(cfg["key_env"], "")
        if not key:
            raise RuntimeError(f"Missing env var {cfg['key_env']} for plugin {plugin_name}")
        
        headers = {"Content-Type": "application/json"}
        if cfg["auth_header"]:
            prefix = cfg["auth_prefix"] or ""
            headers[cfg["auth_header"]] = f"{prefix}{key}"
        
        # Build URL (handle templated base URLs)
        base_url = cfg["base_url"]
        if "{shop}" in base_url:
            base_url = base_url.replace("{shop}", params.get("shop", "ergio"))
        if "{dc}" in base_url:
            dc = key.split("-")[-1] if "-" in key else "us1"
            base_url = base_url.replace("{dc}", dc)
        
        # Build endpoint
        endpoint = self._build_plugin_endpoint(plugin_name, capability, params)
        full_url = f"{base_url}{endpoint}"
        
        # Determine method
        method = "GET"
        if capability.startswith(("create", "send", "post", "submit", "upload", "schedule", "share", "broadcast", "respond")):
            method = "POST"
        elif capability.startswith("update"):
            method = "PATCH"
        elif capability.startswith(("delete", "cancel", "remove")):
            method = "DELETE"
        
        async def _do_request():
            async with httpx.AsyncClient(timeout=60.0) as client:
                if method == "GET":
                    resp = await client.get(full_url, headers=headers, params=params)
                else:
                    resp = await client.request(method, full_url, headers=headers, json=params)
                resp.raise_for_status()
                try:
                    return resp.json()
                except:
                    return {"status": "ok", "text": resp.text}
        
        return await with_retry(
            _do_request,
            service_name=f"plugin_{plugin_name}",
            max_retries=3,
            timeout=60.0,
        )
    
    def _build_plugin_endpoint(self, plugin_name: str, capability: str, params: dict) -> str:
        """Build endpoint paths for each plugin's capabilities."""
        endpoints = {
            "flutterwave": {"create_payment_link": "/payments", "verify_payment": "/transactions/{id}/verify", "refund": "/transactions/{id}/refund", "list_transactions": "/transactions"},
            "paystack_pos": {"create_charge": "/transaction/initialize", "verify_charge": "/transaction/{id}/verify", "list_transactions": "/transaction"},
            "shopify": {"create_product": "/products.json", "list_orders": "/orders.json", "manage_inventory": "/inventory_levels.json", "create_discount": "/price_rules.json", "get_customers": "/customers.json"},
            "discord_bot": {"send_message": "/channels/{channel_id}/messages", "create_embed": "/channels/{channel_id}/messages", "manage_roles": "/guilds/{guild_id}/roles", "broadcast_announcement": "/channels/{channel_id}/messages"},
            "reddit": {"submit_post": "/r/{subreddit}/submit", "get_subreddit_data": "/r/{subreddit}/about", "track_mentions": "/me/mentions", "respond_to_comment": "/api/comment"},
            "pinterest": {"create_pin": "/pins", "create_board": "/boards", "get_analytics": "/boards/analytics", "schedule_pin": "/pins/scheduled"},
            "google_drive": {"upload_file": "/files", "share_file": "/files/{file_id}/permissions", "create_folder": "/files", "list_files": "/files"},
            "zoom": {"create_meeting": "/users/me/meetings", "get_join_link": "/meetings/{meeting_id}", "list_meetings": "/users/me/meetings", "get_recording": "/meetings/{meeting_id}/recordings"},
            "hubspot_crm": {"create_contact": "/contacts", "create_deal": "/deals", "get_pipeline": "/pipelines/deals", "send_email": "/emails", "manage_tasks": "/tasks"},
            "google_calendar": {"create_event": "/calendars/primary/events", "list_events": "/calendars/primary/events", "get_free_busy": "/calendars/primary/freeBusy", "send_invite": "/calendars/primary/events/{event_id}"},
            "telegram_bot": {"send_message": "/bot{token}/sendMessage", "broadcast": "/bot{token}/sendMessage", "manage_orders": "/bot{token}/getUpdates"},
            "youtube": {"upload_video": "/upload/videos", "manage_channel": "/channels", "get_analytics": "/reports"},
            "mailchimp": {"create_campaign": "/campaigns", "manage_subscribers": "/lists/{list_id}/members", "get_reports": "/reports"},
            "instagram_feed": {"post_photo": "/me/media", "post_reel": "/me/media", "post_story": "/me/media", "get_insights": "/me/insights"},
            "facebook_business": {"post_to_page": "/{page_id}/feed", "manage_messages": "/{page_id}/messages", "run_ads": "/{ad_account_id}/campaigns", "get_insights": "/{page_id}/insights"},
            "twitter": {"post_tweet": "/tweets", "schedule_thread": "/tweets", "track_engagement": "/tweets/{id}/metrics"},
            "linkedin": {"post_to_page": "/ugcPosts", "send_inmail": "/messages", "get_leads": "/leadForms"},
            "tiktok": {"post_video": "/post/publish/video/init/", "get_trending": "/discover/hashtag/", "track_views": "/data/video metrics/"},
        }
        
        plugin_endpoints = endpoints.get(plugin_name, {})
        ep = plugin_endpoints.get(capability, "")
        # Replace placeholders with params
        if ep:
            for key, val in params.items():
                ep = ep.replace(f"{{{key}}}", str(val))
            if "{token}" in ep and plugin_name == "telegram_bot":
                ep = ep.replace("{token}", os.getenv("TELEGRAM_BOT_TOKEN", ""))
        return ep


# Global instance
plugin_sandbox = PluginSandbox()
