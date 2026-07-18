"""
ERGIO Engine 02 — Demand Matching (Bolt for Skills)
Continuously scans social media, forums, and classifieds for people
actively requesting or looking for the user's service. Matches them
to the ERGIO user in real-time — like Uber/Bolt matching riders to drivers.

What it does:
1. Monitors Nigerian social media (Twitter/X, Facebook groups, Nairaland) for
   posts like "I need a photographer in Lagos" or "looking for a plumber"
2. Uses AI to understand the intent and match it to the right ERGIO business
3. Scores each match based on skill fit, location proximity, and urgency
4. Returns matched demand with contact info for immediate outreach
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Optional
from utils.search import searxng_search, searxng_multi_query
from utils.scraper import scrape_page_async, scrape_multiple
from utils.ai import ai_smart, ai_fast
from db.supabase_client import insert_leads, is_db_ready, get_supabase, get_businesses
from utils.logger import log
from config import settings

# Platforms where demand signals appear
DEMAND_PLATFORMS = {
    "twitter": "site:twitter.com OR site:x.com",
    "facebook": "site:facebook.com",
    "nairaland": "site:nairaland.com",
    "reddit": "site:reddit.com",
    "jiji": "site:jiji.com.ng",
    "whatsapp_groups": "site:whatsapp.com",
}

# Nigerian service request patterns
DEMAND_PATTERNS = [
    "I need {service}",
    "looking for {service}",
    "can anyone recommend {service}",
    "does anyone know {service}",
    "where can I find {service}",
    "please help me find {service}",
    "I'm looking to hire {service}",
    "need {service} urgently",
    "any {service} around {city}",
    "who does {service} in {city}",
]

async def run_demand_matching(
    business_type: str,
    city: str = "Lagos",
    business_id: str = None,
    business_name: str = None,
    services: list = None,
) -> dict:
    """
    Scan for real-time demand signals and match them to this business.
    """
    log.info(f"🎯 Engine 02 [Demand Matching] starting for {business_type} in {city}")

    # ── Phase 1: Build search queries with demand patterns ──
    service_term = business_type.lower()
    queries = []

    for pattern in DEMAND_PATTERNS[:6]:
        query = pattern.format(service=service_term, city=city)
        # Add Nigerian context
        queries.append(f'"{query}" Nigeria')
        queries.append(f'{query} {city} Nigeria')

    # Platform-specific searches
    for platform, site_filter in list(DEMAND_PLATFORMS.items())[:4]:
        platform_query = f'I need {service_term} in {city} Nigeria {site_filter}'
        queries.append(platform_query)
        platform_query2 = f'looking for {service_term} {city} Nigeria {site_filter}'
        queries.append(platform_query2)

    log.info(f"Searching {len(queries)} demand-signal queries...")
    search_results = await searxng_multi_query(queries, count_per_query=8)
    log.info(f"Found {len(search_results)} potential demand signals")

    # ── Phase 2: AI filter — which results are actual demand? ──
    # Batch process: send top 15 results to AI for classification
    if not search_results:
        log.info("No demand signals found, generating AI-predicted demand...")
        # Fallback: AI generates likely demand scenarios
        ai_demand = generate_ai_demand_signals(business_type, city, services or [])
        if ai_demand:
            await insert_leads(ai_demand, business_id)
        return {
            "engine": "demand_matching",
            "business_type": business_type,
            "city": city,
            "matched_demand": len(ai_demand),
            "matches": ai_demand,
            "source": "ai_predicted",
        }

    # ── Phase 3: Scrape promising demand signal pages ──
    # Filter for platforms where people post requests
    demand_urls = []
    for r in search_results[:15]:
        url = r.get("url", "")
        title = r.get("title", "")
        content_snippet = r.get("content", "")

        # Check if this looks like a demand signal (person asking for service)
        demand_keywords = ["need", "looking for", "recommend", "hire", "urgent",
                          "anyone know", "help me find", "want to", "seeking"]
        is_demand = any(kw in (title + content_snippet).lower() for kw in demand_keywords)

        if is_demand or any(p in url for p in ["nairaland", "twitter", "x.com", "facebook", "reddit"]):
            demand_urls.append({"url": url, "title": title, "snippet": content_snippet})

    log.info(f"Scraping {len(demand_urls)} demand signal pages...")
    scraped = await scrape_multiple(
        [d["url"] for d in demand_urls[:8]],
        max_concurrent=3,
    )

    # ── Phase 4: AI match scoring ──
    matches = []
    for i, page in enumerate(scraped):
        if page.get("error"):
            continue

        content = page.get("content", {})
        page_text = content.get("text", "")

        if not page_text or len(page_text) < 100:
            continue

        emails = page.get("emails", [])
        phones = page.get("phones", [])

        match_prompt = f"""You are ERGIO's demand matching AI. This page was found while searching for people who need "{business_type}" in {city}, Nigeria.

Page: {page.get('url', '')}
Title: {content.get('title', '')}
Content: {page_text[:1000]}

Analyze:
1. Is someone on this page actually REQUESTING or LOOKING FOR {business_type}?
2. If yes, extract their contact info and details
3. How well does this match a {business_name or business_type} business?
4. How urgent is their need?

Return JSON:
{{
    "is_demand": true/false,
    "score": 0-100 (match quality),
    "urgency": "immediate|this_week|this_month|browsing",
    "person_name": "name of person making the request",
    "person_contact": "email or phone or username if found",
    "what_they_need": "specific description of what they're asking for",
    "budget_signal": "any mention of budget or price expectation",
    "location_mentioned": "specific area/neighborhood if mentioned",
    "platform": "twitter|facebook|nairaland|reddit|web|unknown",
    "reason": "why this is or isn't a good match"
}}"""

        try:
            match_data = ai_fast(match_prompt)

            if match_data.get("is_demand") and match_data.get("score", 0) >= settings.LEAD_SCORE_THRESHOLD:
                lead = {
                    "source": "demand_matching",
                    "source_url": page.get("url", ""),
                    "name": match_data.get("person_name", ""),
                    "email": emails[0] if emails else "",
                    "phone": phones[0] if phones else match_data.get("person_contact", ""),
                    "platform": match_data.get("platform", "web"),
                    "message": match_data.get("what_they_need", ""),
                    "intent": "buying" if match_data.get("urgency") in ("immediate", "this_week") else "browsing",
                    "location": match_data.get("location_mentioned", city),
                    "score": match_data.get("score", 50),
                    "urgency": match_data.get("urgency", "browsing"),
                    "budget": match_data.get("budget_signal", ""),
                    "reason": match_data.get("reason", ""),
                }
                matches.append(lead)
                log.info(f"  → Match: {lead['name'] or 'unknown'} — score {lead['score']} — urgency: {lead['urgency']}")
        except Exception as e:
            log.debug(f"AI match scoring failed: {e}")

    # ── Phase 5: If no real demand found, generate AI-predicted demand ──
    if not matches:
        log.info("No real demand signals found, generating AI-predicted demand...")
        ai_demand = generate_ai_demand_signals(business_type, city, services or [])
        matches = ai_demand

    # ── Phase 6: Save to Supabase ──
    if matches:
        await insert_leads(matches, business_id)

    result = {
        "engine": "demand_matching",
        "business_type": business_type,
        "city": city,
        "queries_searched": len(queries),
        "results_found": len(search_results),
        "pages_scraped": len([p for p in scraped if not p.get("error")]),
        "matched_demand": len(matches),
        "matches": sorted(matches, key=lambda x: x.get("score", 0), reverse=True)[:settings.MAX_LEADS_PER_SCAN],
    }

    log.info(f"✅ Engine 02 done: {len(matches)} demand matches")
    return result

def generate_ai_demand_signals(business_type: str, city: str, services: list) -> list[dict]:
    """When live search fails, AI generates realistic demand predictions based on market knowledge."""
    prompt = f"""You are ERGIO's demand prediction AI for Nigeria. Based on your knowledge of the Nigerian market in {city}, generate 5 realistic demand signals for a "{business_type}" business.

These should be REALISTIC scenarios of people who would currently be looking for this service. Think about:
- Seasonal demand in Nigeria
- Common problems people face that this business solves
- Real Nigerian contexts (weddings, events, businesses opening, home repairs, etc.)
- Realistic Nigerian names and platforms

Services offered: {json.dumps(services[:5]) if services else 'general ' + business_type}

Return JSON:
{{
    "signals": [
        {{
            "name": "Realistic Nigerian name",
            "need": "What they need (specific)",
            "platform": "whatsapp|instagram|facebook|nairaland|referral",
            "location": "specific area in {city}",
            "urgency": "immediate|this_week|this_month",
            "budget": "₦amount or range",
            "score": 0-100,
            "reason": "why this is a strong lead"
        }}
    ]
}}"""
    try:
        data = ai_smart(prompt)
        signals = data.get("signals", [])
        return [
            {
                "source": "ai_predicted",
                "source_url": "",
                "name": s.get("name", ""),
                "email": "",
                "phone": "",
                "platform": s.get("platform", "whatsapp"),
                "message": s.get("need", ""),
                "intent": "buying" if s.get("urgency") == "immediate" else "browsing",
                "location": s.get("location", city),
                "score": s.get("score", 60),
                "urgency": s.get("urgency", "this_week"),
                "budget": s.get("budget", ""),
                "reason": s.get("reason", ""),
            }
            for s in signals
        ]
    except Exception as e:
        log.error(f"AI demand prediction failed: {e}")
        return []
