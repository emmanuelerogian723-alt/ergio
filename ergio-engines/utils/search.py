"""
ERGIO Engines — SearXNG Meta Search Client
Searches 70+ engines through a single SearXNG instance
"""

import httpx
from typing import Optional
from config import settings
from utils.logger import log

CATEGORIES = {
    "general": "General web search",
    "it": "IT / tech",
    "images": "Image search",
    "news": "News articles",
    "social media": "Social media posts",
    "files": "File search",
}

async def searxng_search(
    query: str,
    count: int = 10,
    category: str = "general",
    language: str = "en",
    time_range: str = None,
    safesearch: int = 1,
) -> list[dict]:
    """
    Search via SearXNG instance.
    Returns list of {title, url, content, engine}
    """
    if not settings.SEARXNG_URL:
        log.warning("SEARXNG_URL not set, using public instance")
    base = settings.SEARXNG_URL or "https://search.sapti.me"

    params = {
        "q": query,
        "format": "json",
        "categories": category,
        "language": language,
        "safesearch": safesearch,
        "pageno": 1,
    }
    if time_range:
        params["time_range"] = time_range

    try:
        async with httpx.AsyncClient(timeout=20, verify=False) as client:
            resp = await client.get(f"{base}/search", params=params)
            if resp.status_code != 200:
                log.warning(f"SearXNG returned {resp.status_code}")
                return []
            data = resp.json()
            results = data.get("results", [])

            # Normalize and limit
            output = []
            for r in results[:count]:
                output.append({
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "content": r.get("content", ""),
                    "engine": r.get("engine", ""),
                    "score": r.get("score", 0),
                    "publishedDate": r.get("publishedDate", ""),
                })
            return output

    except Exception as e:
        log.error(f"SearXNG search failed: {e}")
        return []

async def searxng_multi_query(queries: list[str], count_per_query: int = 8) -> list[dict]:
    """Run multiple search queries and merge/deduplicate results."""
    all_results = []
    seen_urls = set()

    for query in queries:
        results = await searxng_search(query, count=count_per_query)
        for r in results:
            url = r.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_results.append(r)

    return all_results

async def search_nigerian_businesses(business_type: str, city: str = "Lagos") -> list[dict]:
    """Search specifically for Nigerian businesses of a given type."""
    queries = [
        f'"{business_type}" in {city} Nigeria',
        f'best {business_type} {city} Nigeria contact',
        f'hire {business_type} {city} Nigeria phone',
        f'{business_type} services {city} Nigeria',
        f'{business_type} {city} Nigeria site:instagram.com',
        f'{business_type} {city} Nigeria site:facebook.com',
    ]
    return await searxng_multi_query(queries, count_per_query=10)
