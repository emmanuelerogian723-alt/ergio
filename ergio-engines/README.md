# ERGIO Engines — Autonomous Client Acquisition System

A standalone Python backend that powers ERGIO's four client acquisition engines. Deploy this separately on Render and connect it to your ERGIO frontend.

## What It Does

Four autonomous engines that work together to find and convert clients:

1. **Engine 01 — Local Discovery (SEO)**: Crawls Nigerian business directories, competitor websites, and forum posts. Finds local demand signals, generates SEO-optimized content, and identifies directory citation opportunities.

2. **Engine 02 — Demand Matching (Bolt for Skills)**: Scans social media (Twitter/X, Facebook, Nairaland, Reddit) for people actively requesting your service. AI scores each signal for match quality, urgency, and budget. Real-time "Bolt for skills" matching.

3. **Engine 03 — AI Outreach**: Generates personalized cold outreach messages (WhatsApp, email, social DM) for each lead found by Engines 01 & 02. Sends emails via Resend when configured. Tracks outreach status to avoid duplicates.

4. **Engine 04 — Repeat Client**: Analyzes your client history, identifies who's due for a follow-up based on service cycles, generates personalized re-engagement messages, and creates retainer offers for high-value clients.

## Tech Stack

- **FastAPI** — high-performance async API server
- **Playwright** — headless browser for JS-heavy page scraping
- **BeautifulSoup + lxml** — fast HTML parsing
- **SearXNG** — meta search across 70+ search engines (free, no API key)
- **Groq AI** — Llama 3.3 70B + Llama 3.1 8B for lead scoring and content generation
- **Supabase** — shared database with ERGIO frontend
- **APScheduler** — automated recurring engine runs
- **httpx** — async HTTP client
- **tenacity** — retry logic for resilient scraping

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| POST | `/engines/discovery` | Engine 01 — Local Discovery SEO |
| POST | `/engines/matching` | Engine 02 — Demand Matching |
| POST | `/engines/outreach` | Engine 03 — AI Outreach |
| POST | `/engines/repeat` | Engine 04 — Repeat Client |
| POST | `/engines/run-all` | Run all four engines |
| POST | `/scrape` | Scrape a single URL |
| POST | `/crawl` | Scrape multiple URLs |
| POST | `/search` | SearXNG meta search |
| POST | `/ai` | Direct Groq AI call |
| POST | `/social-content` | Generate social media content |
| GET | `/businesses` | List active businesses from Supabase |
| POST | `/scan/all` | Manually trigger scheduled scan |

## Deploy on Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo (this folder)
3. Configure:
   - **Build Command**: `pip install -r requirements.txt && playwright install chromium --with-deps`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Python Version**: 3.11+
4. Add environment variables (see `.env.example`)
5. Deploy

### Required Environment Variables

```
GROQ_API_KEY=your_groq_key
SUPABASE_URL=https://owcxfzlanlrulflsyvlr.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
SEARXNG_URL=https://search.sapti.me
CORS_ORIGINS=https://ergio.vercel.app
```

### Optional (for email sending)
```
RESEND_API_KEY=your_resend_key
FROM_EMAIL=hello@ergio.app
```

## Connect to ERGIO Frontend

In your ERGIO frontend, call the engines API:

```javascript
const ENGINES_API = 'https://your-render-url.onrender.com';

// Run all engines for a business
const res = await fetch(`${ENGINES_API}/engines/run-all`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    business_type: 'photography',
    city: 'Lagos',
    business_id: '123',
    business_name: 'Studio One',
    services: ['wedding', 'portraits']
  })
});
const results = await res.json();
```

## Architecture

```
ergio-engines/
├── main.py                    # FastAPI server — all endpoints
├── config.py                  # Environment config
├── requirements.txt           # Python dependencies
├── .env.example               # Environment template
├── engines/
│   ├── orchestrator.py        # Runs all engines together
│   ├── engine_01_local_discovery.py  # SEO + directory crawling
│   ├── engine_02_demand_matching.py  # Real-time demand detection
│   ├── engine_03_outreach.py         # AI message generation + sending
│   └── engine_04_repeat_client.py    # Client retention + re-engagement
├── utils/
│   ├── ai.py                  # Groq AI wrapper
│   ├── scraper.py             # httpx + Playwright scraper
│   ├── search.py              # SearXNG search client
│   └── logger.py              # Logging setup
└── db/
    └── supabase_client.py      # Supabase CRUD
```

## How the Engines Work Together

1. **Engine 01** scans directories and the web to find leads and build SEO
2. **Engine 02** monitors social media for real-time demand signals
3. Leads from Engines 01 & 02 are saved to the shared Supabase database
4. **Engine 03** picks up those leads, generates personalized outreach, and sends emails
5. **Engine 04** manages existing clients, sending follow-ups at the right time
6. **Scheduler** runs all engines automatically on configured intervals
