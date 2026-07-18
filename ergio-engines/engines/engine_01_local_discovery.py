"""
ERGIO Engine 01 — Local Discovery (SEO)
Scans the web for local business directories, Google Business profiles,
and social media pages related to the user's business type in their city.
Builds an SEO-optimized directory listing and finds local demand signals.

What it does:
1. Searches for the business type in Nigerian directories (Vconnect, Finelib, etc.)
2. Crawls competitor websites to extract SEO keywords and strategies
3. Finds local demand signals (people asking for the service online)
4. Generates SEO-optimized business listing content
5. Discovers citation opportunities (directories to list the business on)
"""

import asyncio
import json
from typing import Optional
from utils.search import searxng_search, searxng_multi_query
from utils.scraper import scrape_page_async, scrape_multiple, extract_emails, extract_phones
from utils.ai import ai_smart, ai_fast
from db.supabase_client import insert_leads, is_db_ready, get_supabase
from utils.logger import log
from config import settings

# Nigerian business directories to crawl
NG_DIRECTORIES = [
    "vconnect.com",
    "finelib.com",
    "businessday.ng",
    "nairaland.com",
    "jumia.com.ng",
    "connectnigeria.com",
    "businesslist.com.ng",
]

async def run_discovery_engine(business_type: str, city: str = "Lagos",
                                business_id: str = None, business_name: str = None) -> dict:
    """
    Main entry point for the Local Discovery engine.
    Returns SEO insights, directory citations, and local demand signals.
    """
    log.info(f"🔍 Engine 01 [Local Discovery] starting for {business_type} in {city}")

    # ── Phase 1: Search for local business directories and competitors ──
    search_queries = [
        f'"{business_type}" in {city} Nigeria site:vconnect.com',
        f'"{business_type}" in {city} Nigeria site:finelib.com',
        f'"{business_type}" in {city} Nigeria site:connectnigeria.com',
        f'best {business_type} in {city} Nigeria',
        f'{business_type} {city} Nigeria directory listing',
        f'I need {business_type} in {city} Nigeria',
        f'looking for {business_type} {city} Nigeria',
        f'recommend {business_type} {city} Nigeria',
    ]

    log.info(f"Searching {len(search_queries)} queries across 70+ engines...")
    search_results = await searxng_multi_query(search_queries, count_per_query=10)
    log.info(f"Found {len(search_results)} search results")

    # ── Phase 2: Scrape top results for content and contacts ──
    # Prioritize directory listings and forum posts (demand signals)
    directory_results = []
    demand_signals = []
    competitor_pages = []

    for r in search_results:
        url = r.get("url", "")
        if any(d in url for d in NG_DIRECTORIES):
            directory_results.append(r)
        elif "nairaland" in url or "reddit" in url or "quora" in url:
            demand_signals.append(r)
        else:
            competitor_pages.append(r)

    # Scrape the most promising pages
    urls_to_scrape = []
    urls_to_scrape.extend([r["url"] for r in directory_results[:5]])
    urls_to_scrape.extend([r["url"] for r in demand_signals[:3]])
    urls_to_scrape.extend([r["url"] for r in competitor_pages[:5]])

    log.info(f"Scraping {len(urls_to_scrape)} pages...")
    scraped = await scrape_multiple(urls_to_scrape, max_concurrent=3)

    # ── Phase 3: Extract leads (people/businesses who need the service) ──
    leads = []
    for page in scraped:
        if page.get("error"):
            continue

        emails = page.get("emails", [])
        phones = page.get("phones", [])
        content = page.get("content", {})
        page_text = content.get("text", "")

        # AI score this page as a potential lead source
        if page_text and len(page_text) > 100:
            score_prompt = f"""You are ERGIO's lead scoring system. Analyze this page for a "{business_type}" business in {city}, Nigeria.

Page title: {content.get('title', '')}
Page URL: {page.get('url', '')}
Content excerpt: {page_text[:800]}

Is this a person or business who NEEDS {business_type} services? Or is it a competitor? Or irrelevant?

Return JSON:
{{
    "score": 0-100,
    "intent": "buying|browsing|competing|irrelevant",
    "name": "extracted person or business name if found",
    "need": "what they need based on the content",
    "reason": "why this score"
}}"""
            try:
                scored = ai_fast(score_prompt)

                if scored.get("intent") != "irrelevant" and scored.get("score", 0) >= settings.LEAD_SCORE_THRESHOLD:
                    leads.append({
                        "source": "local_discovery",
                        "source_url": page.get("url", ""),
                        "name": scored.get("name", ""),
                        "email": emails[0] if emails else "",
                        "phone": phones[0] if phones else "",
                        "platform": "web",
                        "message": scored.get("need", content.get("title", "")),
                        "intent": scored.get("intent", "browsing"),
                        "location": city,
                        "score": scored.get("score", 50),
                        "reason": scored.get("reason", ""),
                    })
                    log.info(f"  → Lead found: {scored.get('name', 'unknown')} (score: {scored.get('score')})")
            except Exception as e:
                log.debug(f"AI scoring failed for {page.get('url')}: {e}")

    # ── Phase 4: Generate SEO content for the business ──
    seo_prompt = f"""You are ERGIO's SEO engine for Nigerian businesses. Generate a complete SEO package for:
Business name: {business_name or 'Your Business'}
Business type: {business_type}
City: {city}, Nigeria
Competitor keywords found: {json.dumps([r.get('title','')[:50] for r in competitor_pages[:5]])}

Return JSON:
{{
    "titleTag": "SEO-optimized title tag (60 chars max)",
    "metaDescription": "SEO meta description (160 chars max)",
    "keywords": ["list of 10-15 SEO keywords for this business in Nigeria"],
    "googleBusinessDescription": "Google Business Profile description (750 chars max)",
    "landingPageCopy": "2-paragraph SEO landing page copy",
    "schemaMarkup": "JSON-LD LocalBusiness schema as a string",
    "directoryListings": [
        {{"directory": "Vconnect", "url": "https://vconnect.com", "priority": "high"}},
        {{"directory": "Google Business Profile", "url": "https://business.google.com", "priority": "high"}},
        {{"directory": "Finelib", "url": "https://finelib.com", "priority": "medium"}}
    ],
    "citationsToBuild": ["list of 5-8 local directory citations to create"]
}}"""

    try:
        seo_package = ai_smart(seo_prompt)
    except Exception as e:
        log.error(f"SEO generation failed: {e}")
        seo_package = {}

    # ── Phase 5: Save leads to Supabase ──
    if leads:
        await insert_leads(leads, business_id)

    result = {
        "engine": "local_discovery",
        "business_type": business_type,
        "city": city,
        "search_results_total": len(search_results),
        "pages_scraped": len([p for p in scraped if not p.get("error")]),
        "leads_found": len(leads),
        "leads": sorted(leads, key=lambda x: x["score"], reverse=True)[:settings.MAX_LEADS_PER_SCAN],
        "seo_package": seo_package,
        "directories_found": [r.get("url") for r in directory_results[:5]],
        "demand_signals": [r.get("url") for r in demand_signals[:3]],
    }

    log.info(f"✅ Engine 01 done: {len(leads)} leads, SEO package generated")
    return result
