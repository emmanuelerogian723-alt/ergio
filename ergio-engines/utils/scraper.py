"""
ERGIO Engines — Web Scraper
Multi-strategy scraper: httpx (fast) + Playwright (for JS-heavy pages, optional)
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
                "yourdomain.com", "domain.com", "email.com"}

# Check if playwright is available
PLAYWRIGHT_AVAILABLE = False
try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    log.warning("Playwright not installed — browser rendering disabled, httpx-only mode")

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
    if not PLAYWRIGHT_AVAILABLE:
        log.debug(f"Playwright not available, skipping browser render for {url}")
        return None
    timeout = timeout or settings.BROWSER_TIMEOUT
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=settings.HEADLESS)
            context = await browser.new_context(
                user_agent=ua.random,
                viewport={"width": 1280, "height": 800},
            )
            page = await context.new_page()
            page.set_default_timeout(timeout)
            await page.goto(url, wait_until="domcontentloaded")
            await page.wait_for_timeout(2000)
            content = await page.content()
            await browser.close()
            return content
    except Exception as e:
        log.warning(f"Playwright fetch failed for {url}: {e}")
        return None

async def fetch_page(url: str, use_browser: bool = False) -> Optional[str]:
    """Fetch a page. Tries httpx first, falls back to Playwright for JS pages."""
    if use_browser and PLAYWRIGHT_AVAILABLE:
        return await fetch_page_playwright(url)

    html = await fetch_page_httpx(url)
    if html and len(html) > 500:
        return html

    # If httpx returned too little (JS-rendered page), try browser if available
    if PLAYWRIGHT_AVAILABLE:
        log.debug(f"Small response from {url}, trying Playwright...")
        return await fetch_page_playwright(url)
    
    log.debug(f"Small response from {url}, Playwright not available")
    return html

def extract_emails(html: str) -> list[str]:
    """Extract and de-duplicate email addresses."""
    emails = set(EMAIL_RE.findall(html))
    # Filter junk
    return [e for e in emails if not any(j in e.lower() for j in JUNK_EMAILS)]

def extract_phones(html: str) -> list[str]:
    """Extract Nigerian and international phone numbers."""
    phones = set()
    # Nigerian format
    for m in PHONE_RE.finditer(html):
        phones.add(f"+234{m.group(1)}{m.group(2)}{m.group(3)}")
    # International format
    for m in INTL_PHONE_RE.finditer(html):
        phone = m.group()
        if phone not in phones:
            phones.add(phone)
    return list(phones)

def extract_socials(html: str) -> dict:
    """Extract social media links."""
    socials = {}
    for platform, pattern in SOCIAL_PATTERNS.items():
        matches = pattern.findall(html)
        if matches:
            socials[platform] = matches[0]
    return socials

def parse_content(html: str, url: str = "") -> dict:
    """Parse HTML and extract structured content."""
    soup = BeautifulSoup(html, "lxml")
    
    # Remove scripts and styles
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    
    title = soup.find("title")
    title_text = title.get_text(strip=True) if title else ""
    
    # Meta description
    meta_desc = ""
    meta = soup.find("meta", attrs={"name": "description"})
    if meta:
        meta_desc = meta.get("content", "")
    
    # Main content text
    body = soup.find("body") or soup
    text = body.get_text(separator=" ", strip=True)
    # Truncate
    if len(text) > 5000:
        text = text[:5000]
    
    # Headings
    headings = []
    for h in soup.find_all(["h1", "h2", "h3"]):
        h_text = h.get_text(strip=True)
        if h_text:
            headings.append(h_text)
    
    return {
        "title": title_text,
        "meta_description": meta_desc,
        "text": text,
        "headings": headings[:10],
        "url": url,
    }

async def scrape_page_async(url: str, use_browser: bool = False) -> dict:
    """Scrape a single page — returns emails, phones, socials, and content."""
    html = await fetch_page(url, use_browser=use_browser)
    if not html:
        return {"url": url, "error": "Failed to fetch page", "emails": [], "phones": [], "socials": {}, "content": {}}
    
    return {
        "url": url,
        "emails": extract_emails(html),
        "phones": extract_phones(html),
        "socials": extract_socials(html),
        "content": parse_content(html, url),
    }

async def scrape_multiple(urls: list[str], max_concurrent: int = 3) -> list[dict]:
    """Scrape multiple URLs concurrently."""
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def limited_scrape(url: str) -> dict:
        async with semaphore:
            return await scrape_page_async(url)
    
    tasks = [limited_scrape(url) for url in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Handle exceptions
    output = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            output.append({"url": urls[i], "error": str(result), "emails": [], "phones": [], "socials": {}, "content": {}})
        else:
            output.append(result)
    return output
