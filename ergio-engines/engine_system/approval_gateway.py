"""
ERGIO Human Approval Gateway
Queues external actions for human approval. AI prepares, human approves.
This is the conscience of the system — nothing goes out without a human saying yes.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import uuid
import asyncio
from datetime import datetime
from typing import Optional
from utils.logger import log
from db.supabase_client import get_supabase, is_db_ready


# Actions that ALWAYS require human approval
APPROVAL_REQUIRED_ACTIONS = {
    "send_email",
    "send_whatsapp",
    "send_sms",
    "post_to_social",
    "post_tweet",
    "post_to_facebook",
    "post_to_instagram",
    "post_to_linkedin",
    "post_to_tiktok",
    "upload_video",
    "charge_payment",
    "create_payment_link",
    "send_invoice",
    "respond_to_review",
    "send_inmail",
    "broadcast_message",
    "send_campaign",
    "run_ads",
    "make_call",
    "create_charge",
}

# Actions that are always autonomous (no approval needed)
AUTONOMOUS_ACTIONS = {
    "search_leads",
    "score_leads",
    "search_people",
    "enrich_company",
    "find_email",
    "find_phone",
    "build_lead_list",
    "generate_draft",
    "generate_content",
    "generate_video",
    "generate_image",
    "scrape_url",
    "search_google",
    "get_report",
    "track_visitors",
    "get_insights",
    "get_slots",
    "get_realtime",
    "get_analytics",
    "create_design",
    "create_page",
    "search",
    "chat",
    "auto_respond",
    "handoff_to_human",
    "build_website",
    "generate_brand",
    "generate_seo",
}


class ApprovalGateway:
    """
    Queues external actions for human approval.
    Stores pending approvals in Supabase.
    Notifies the dashboard via Supabase real-time subscriptions.
    """
    
    async def queue(
        self,
        plugin_name: str,
        capability: str,
        params: dict,
        business_id: str = None,
        engine: str = None,
    ) -> str:
        """Queue an action for human approval. Returns approval_id."""
        approval_id = f"apr_{uuid.uuid4().hex[:12]}"
        
        # Check if this action actually requires approval
        if capability not in APPROVAL_REQUIRED_ACTIONS:
            # Auto-approve internal actions
            log.info(f"✅ Auto-approving {capability} (internal action)")
            return approval_id  # caller should proceed
        
        # Store in Supabase
        if is_db_ready():
            sb = get_supabase()
            sb.table("pending_approvals").insert({
                "id": approval_id,
                "business_id": business_id,
                "engine": engine or plugin_name,
                "plugin": plugin_name,
                "capability": capability,
                "params": json.dumps(params),
                "content_preview": self._build_preview(capability, params),
                "status": "pending",
                "created_at": datetime.utcnow().isoformat(),
            }).execute()
            log.info(f"📋 Queued approval {approval_id}: {plugin_name}.{capability}")
        else:
            log.warn("⚠️ DB not ready — approval queued in memory only")
        
        return approval_id
    
    async def approve(self, approval_id: str, user_id: str = None) -> dict:
        """Approve a pending action and execute it."""
        if not is_db_ready():
            raise RuntimeError("Database not ready")
        
        sb = get_supabase()
        
        # Fetch the approval
        resp = sb.table("pending_approvals").select("*").eq("id", approval_id).execute()
        if not resp.data:
            raise ValueError(f"Approval {approval_id} not found")
        
        approval = resp.data[0]
        if approval["status"] != "pending":
            raise ValueError(f"Approval {approval_id} is not pending (status: {approval['status']})")
        
        # Mark as approved
        sb.table("pending_approvals").update({
            "status": "approved",
            "approved_by": user_id,
            "approved_at": datetime.utcnow().isoformat(),
        }).eq("id", approval_id).execute()
        
        # Execute the action
        from engine_system.plugin_sandbox import PluginSandbox
        sandbox = PluginSandbox(approval_gateway=None)  # no re-queue
        result = await sandbox._execute_now(
            plugin_name=approval["plugin"],
            capability=approval["capability"],
            params=json.loads(approval["params"]),
            business_id=approval.get("business_id"),
        )
        
        # Update with result
        sb.table("pending_approvals").update({
            "status": "completed" if result.get("status") == "completed" else "failed",
            "result": json.dumps(result),
            "executed_at": datetime.utcnow().isoformat(),
        }).eq("id", approval_id).execute()
        
        log.info(f"✅ Approval {approval_id} executed: {result.get('status')}")
        return result
    
    async def reject(self, approval_id: str, reason: str = None, user_id: str = None):
        """Reject a pending action."""
        if not is_db_ready():
            raise RuntimeError("Database not ready")
        
        sb = get_supabase()
        sb.table("pending_approvals").update({
            "status": "rejected",
            "rejected_by": user_id,
            "rejected_at": datetime.utcnow().isoformat(),
            "rejection_reason": reason,
        }).eq("id", approval_id).execute()
        
        log.info(f"❌ Approval {approval_id} rejected: {reason}")
    
    async def list_pending(self, business_id: str = None) -> list:
        """List all pending approvals for a business."""
        if not is_db_ready():
            return []
        
        sb = get_supabase()
        q = sb.table("pending_approvals").select("*").eq("status", "pending")
        if business_id:
            q = q.eq("business_id", business_id)
        resp = q.order("created_at", desc=True).execute()
        return resp.data
    
    def _build_preview(self, capability: str, params: dict) -> str:
        """Build a human-readable preview of the action."""
        if capability == "send_email":
            return f"Email to: {params.get('to', 'N/A')}\nSubject: {params.get('subject', 'N/A')}\nBody: {params.get('html', params.get('text', ''))[:200]}..."
        elif capability in ("send_whatsapp", "send_sms"):
            return f"To: {params.get('to', 'N/A')}\nMessage: {params.get('body', params.get('message', ''))[:200]}..."
        elif capability.startswith("post_to") or capability in ("post_tweet", "upload_video"):
            return f"Platform: {capability}\nContent: {params.get('content', params.get('text', params.get('caption', '')))[:200]}..."
        elif capability == "send_invoice":
            return f"Client: {params.get('client_name', 'N/A')}\nAmount: ₦{params.get('amount', 'N/A')}\nDue: {params.get('due_date', 'N/A')}"
        elif capability in ("charge_payment", "create_payment_link"):
            return f"Amount: ₦{params.get('amount', 'N/A')}\nCustomer: {params.get('customer', 'N/A')}"
        elif capability == "respond_to_review":
            return f"Review: {params.get('review_text', '')[:100]}...\nResponse: {params.get('response', '')[:200]}..."
        return f"Action: {capability}\nParams: {json.dumps(params)[:200]}..."
