"""
ERGIO Engines — Web Scraper
Multi-strategy scraper: httpx (fast) + Playwright (for JS-heavy pages)
Extracts: emails, phone numbers, social links, business info, page content
"""

import re
import asyncio
import httpx
from typing import Optional
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from tenacity import retry, stop_after_attempt, wait_exponential
from config import settings
from utils.logger import log

ua = UserAgent()

# ── Regex patterns for extraction ──

EMAIL_RE = re.compile(
    r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
    re.IGNORECASE
)
# Nigerian phone: +234, 080, 081, 070, 090, etc.
PHONE_RE = re.compile(
    r'(?:\+?234[\s-]?|0)([789][01])[\s-]?(\d{4})[\s-]?(\d{4})',
)
# International phone fallback
INTL_PHONE_RE = re.compile(
    r'\+?\d{1,3}[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}'
)

SOCIAL_PATTERNS = {
    "whatsapp": re.compile(r'(?:https?://)?wa\.me/(\d+)', re.IGNORECASE),
    "instagram": re.compile(r'(?:https?://)?(?:www\.)?instagram\.com/([a-zA-Z0-9_.]+)', re.IGNORECASE),
    "facebook": re.compile(r'(?:https?://)?(?:www\.)?facebook\.com/([a-zA-Z0-9._-]+)', re.IGNORECASE),
    "twitter": re.compile(r'(?:https?://)?(?:www\.)?(?:twitter|x)\.com/([a-zA-Z0-9_]+)', re.IGNORECASE),
    "linkedin": re.compile(r'(?:https?://)?(?:www\.)?linkedin\.com/(?:in|company)/([a-zA-Z0-9_-]+)', re.IGNORECASE),
    "tiktok": re.compile(r'(?:https?://)?(?:www\.)?tiktok\.com/@([a-zA-Z0-9_.]+)', re.IGNORECASE),
}

# Junk emails to filter out
JUNK_EMAILS = {"example.com", "sentry.io", "wixpress.com", "godaddy.com", "squarespace.com",
                "yourdomain.com", "domain.com", "email.com", "gmail.com"}  # keep gmail — real people use it

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=5))
async def fetch_page_httpx(url: str, timeout: int = 15) -> Optional[str]:
    """Fast HTTP fetch with httpx."""
    headers = {
        "User-Agent": ua.random,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    try:
        async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
            resp = await client.get(url, headers=headers, timeout=timeout)
            if resp.status_code == 200:
                return resp.text
            log.debug(f"HTTP {resp.status_code} for {url}")
            return None
    except Exception as e:
        log.debug(f"httpx fetch failed for {url}: {e}")
        raise

async def fetch_page_playwright(url: str, timeout: int = None) -> Optional[str]:
    """Full browser render with Playwright (for JS-heavy pages)."""
    timeout = timeout or settings.BROWSER_TIMEOUT
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=settings.HEADLESS)
            context = await browser.new_context(
                user_agent=ua.random,
                viewport={"width": 1280, "height": 800},
            )
            page = await context.new_page()
            page.set_default_timeout(timeout)
            await page.goto(url, wait_until="domcontentloaded")
            # Wait a bit for dynamic content
            await page.wait_for_timeout(2000)
            content = await page.content()
            await browser.close()
            return content
    except Exception as e:
        log.warning(f"Playwright fetch failed for {url}: {e}")
        return None

async def fetch_page(url: str, use_browser: bool = False) -> Optional[str]:
    """Fetch a page. Tries httpx first, falls back to Playwright for JS pages."""
    if use_browser:
        return await fetch_page_playwright(url)

    html = await fetch_page_httpx(url)
    if html and len(html) > 500:
        return html

    # If httpx returned too little (JS-rendered page), try browser
    log.debug(f"Small response from {url}, trying Playwright...")
    return await fetch_page_playwright(url)

def extract_emails(html: str) -> list[str]:
    """Extract and de-duplicate email addresses."""
    emails = EMAIL_RE.findall(html)
    # Filter junk
    cleaned = []
    seen = set()
    for e in emails:
        e = e.lower().strip()
        domain = e.split("@")[-1] if "@" in e else ""
        if domain in JUNK_EMAILS:
            continue
        if e in seen:
            continue
        seen.add(e)
        cleaned.append(e)
    return cleaned[:10]  # max 10

def extract_phones(html: str) -> list[str]:
    """Extract Nigerian and international phone numbers."""
    # Try Nigerian format first
    ng_phones = PHONE_RE.findall(html)
    phones = []
    seen = set()

    for match in PHONE_RE.finditer(html):
        raw = match.group()
        normalized = re.sub(r'[\s-]', '', raw)
        if normalized not in seen:
            seen.add(normalized)
            phones.append(normalized)

    # Fallback to international if not enough found
    if len(phones) < 2:
        for match in INTL_PHONE_RE.finditer(html):
            raw = match.group()
            normalized = re.sub(r'[\s.-]', '', raw)
            if normalized not in seen and len(normalized) >= 10:
                seen.add(normalized)
                phones.append(normalized)

    return phones[:10]

def extract_socials(html: str) -> dict:
    """Extract social media profiles."""
    socials = {}
    for platform, pattern in SOCIAL_PATTERNS.items():
        matches = pattern.findall(html)
        if matches:
            # Take the first non-generic match
            for m in matches:
                if m and m.lower() not in ("share", "sharer", "intent", "post"):
                    socials[platform] = m
                    break
    return socials

def extract_content(html: str) -> dict:
    """Extract clean text content and metadata from HTML."""
    soup = BeautifulSoup(html, "lxml")

    # Remove script/style/nav
    for tag in soup(["script", "style", "nav", "footer", "noscript"]):
        tag.decompose()

    title = soup.find("title")
    title_text = title.get_text(strip=True) if title else ""

    meta_desc = ""
    meta = soup.find("meta", attrs={"name": "description"})
    if meta:
        meta_desc = meta.get("content", "")

    # Get main text content
    body = soup.find("body") or soup
    text = body.get_text(separator=" ", strip=True)

    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    # Try to find business name from structured data
    business_name = ""
    h1 = soup.find("h1")
    if h1:
        business_name = h1.get_text(strip=True)

    return {
        "title": title_text[:300],
        "meta_description": meta_desc[:300],
        "business_name": business_name[:200],
        "text": text[:5000],  # First 5000 chars for AI processing
        "html_length": len(html),
    }

def scrape_page(url: str, use_browser: bool = False) -> dict:
    """Full page scrape: fetch + extract all data."""
    html = asyncio.run(fetch_page_async(url, use_browser))
    if not html:
        return {"url": url, "error": "fetch_failed"}

    return {
        "url": url,
        "emails": extract_emails(html),
        "phones": extract_phones(html),
        "socials": extract_socials(html),
        "content": extract_content(html),
    }

async def fetch_page_async(url: str, use_browser: bool = False) -> Optional[str]:
    """Async wrapper for fetch_page."""
    return await fetch_page(url, use_browser=use_browser)

async def scrape_page_async(url: str, use_browser: bool = False) -> dict:
    """Full async page scrape."""
    html = await fetch_page(url, use_browser=use_browser)
    if not html:
        return {"url": url, "error": "fetch_failed"}

    return {
        "url": url,
        "emails": extract_emails(html),
        "phones": extract_phones(html),
        "socials": extract_socials(html),
        "content": extract_content(html),
    }

async def scrape_multiple(urls: list[str], max_concurrent: int = None) -> list[dict]:
    """Scrape multiple URLs concurrently."""
    max_concurrent = max_concurrent or settings.MAX_CONCURRENT_CRAWLS
    semaphore = asyncio.Semaphore(max_concurrent)

    async def scrape_with_limit(url):
        async with semaphore:
            return await scrape_page_async(url)

    tasks = [scrape_with_limit(url) for url in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    output = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            output.append({"url": urls[i], "error": str(result)})
        else:
            output.append(result)
    return output
