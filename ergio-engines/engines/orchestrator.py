"""
ERGIO Engines — Orchestrator
Runs all four engines for a business and can be triggered on a schedule.
"""

import asyncio
import json
from typing import Optional
from db.supabase_client import get_businesses, is_db_ready
from engines.engine_01_local_discovery import run_discovery_engine
from engines.engine_02_demand_matching import run_demand_matching
from engines.engine_03_outreach import run_outreach_engine, generate_social_content
from engines.engine_04_repeat_client import run_repeat_engine
from utils.logger import log
from config import settings

async def run_all_engines(business_id: str = None, business_type: str = None,
                          city: str = "Lagos", business_name: str = None,
                          services: list = None) -> dict:
    """
    Run all four engines for a single business.
    Returns combined results.
    """
    log.info(f"🚀 Running ALL engines for {business_name or business_type} in {city}")

    results = {}

    # Engine 01: Local Discovery
    try:
        results["engine_01_local_discovery"] = await run_discovery_engine(
            business_type=business_type,
            city=city,
            business_id=business_id,
            business_name=business_name,
        )
    except Exception as e:
        log.error(f"Engine 01 failed: {e}")
        results["engine_01_local_discovery"] = {"error": str(e)}

    # Engine 02: Demand Matching
    try:
        results["engine_02_demand_matching"] = await run_demand_matching(
            business_type=business_type,
            city=city,
            business_id=business_id,
            business_name=business_name,
            services=services,
        )
    except Exception as e:
        log.error(f"Engine 02 failed: {e}")
        results["engine_02_demand_matching"] = {"error": str(e)}

    # Engine 03: AI Outreach
    try:
        if business_id:
            results["engine_03_outreach"] = await run_outreach_engine(
                business_id=business_id,
                business_name=business_name or business_type,
                business_type=business_type,
                city=city,
            )
    except Exception as e:
        log.error(f"Engine 03 failed: {e}")
        results["engine_03_outreach"] = {"error": str(e)}

    # Engine 04: Repeat Client
    try:
        if business_id:
            results["engine_04_repeat_client"] = await run_repeat_engine(
                business_id=business_id,
                business_name=business_name or business_type,
                business_type=business_type,
                city=city,
            )
    except Exception as e:
        log.error(f"Engine 04 failed: {e}")
        results["engine_04_repeat_client"] = {"error": str(e)}

    # Summary
    results["summary"] = {
        "business_name": business_name,
        "business_type": business_type,
        "city": city,
        "total_leads": (results.get("engine_01_local_discovery", {}).get("leads_found", 0) +
                       results.get("engine_02_demand_matching", {}).get("matched_demand", 0)),
        "outreach_generated": results.get("engine_03_outreach", {}).get("outreach_generated", 0),
        "follow_ups": results.get("engine_04_repeat_client", {}).get("follow_ups_generated", 0),
    }

    log.info(f"✅ All engines complete: {results['summary']['total_leads']} leads, "
             f"{results['summary']['outreach_generated']} outreach, "
             f"{results['summary']['follow_ups']} follow-ups")

    return results

async def run_scheduled_scan():
    """
    Run all engines for all active businesses in Supabase.
    Called by the scheduler on a recurring basis.
    """
    log.info("⏰ Scheduled scan starting for all businesses...")

    if not is_db_ready():
        log.warning("Supabase not configured — scheduled scan skipped")
        return {"error": "supabase_not_configured"}

    businesses = await get_businesses()
    if not businesses:
        log.info("No active businesses found")
        return {"businesses_scanned": 0}

    log.info(f"Found {len(businesses)} active businesses")

    all_results = []
    for biz in businesses:
        biz_type = biz.get("type") or biz.get("business_type") or "general business"
        biz_city = biz.get("city") or "Lagos"
        biz_name = biz.get("name") or biz.get("business_name") or "Unknown"
        biz_id = biz.get("id")
        biz_services = biz.get("services", [])

        log.info(f"Processing: {biz_name} ({biz_type}) in {biz_city}")
        try:
            result = await run_all_engines(
                business_id=biz_id,
                business_type=biz_type,
                city=biz_city,
                business_name=biz_name,
                services=biz_services,
            )
            all_results.append(result)
        except Exception as e:
            log.error(f"Failed to process {biz_name}: {e}")
            all_results.append({"business_name": biz_name, "error": str(e)})

    return {
        "scan_completed": True,
        "businesses_scanned": len(businesses),
        "results": all_results,
    }
