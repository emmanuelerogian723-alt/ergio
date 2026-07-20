# ERGIO Engines v5.0

AI Business Operating System — Conductor brain + 10 engines + 15 MCPs + 20 plugins with human-in-the-loop approval and circuit breaker fault tolerance.

Built by MUTYINT. Deployed on Render free tier with Supabase backend.


## v5.2 Ultimate — 3-Layer Memory + Multi-Model AI Router

### 3-Layer Memory System (Hermes-inspired)

ERGIO now remembers and improves over time using a 3-layer memory architecture:

**Layer 1 — Durable Facts:** Stable info like user preferences, project conventions, deployment paths. Saved to Supabase or JSON file fallback.

**Layer 2 — Procedural Skills:** Reusable workflows with commands and verification steps. Teach ERGIO a workflow once and trigger it with a slash command.

**Layer 3 — Session Search:** Recall past conversations without storing raw transcripts. When a user says "we fixed this before," ERGIO searches prior sessions.

### Multi-Model AI Router (12 Providers)

ERGIO can now route AI requests to the best available model across 12 platforms:

1. **Groq** (ultra-fast) — Llama 3.3 70B, Llama 3.1 8B, DeepSeek R1
2. **OpenAI** — GPT-4o, GPT-4o-mini, o3-mini
3. **Google Gemini** — Gemini 2.5 Flash, Gemini 2.5 Pro
4. **Cerebras** (ultra-fast) — Llama 4 Scout, Llama 3.1 8B
5. **OpenRouter** — Claude 3.5 Sonnet, Llama 3.1, o3-mini (aggregator)
6. **Together AI** — Llama 3.3 70B Turbo, DeepSeek R1
7. **Anthropic Claude** — Claude 3.5 Sonnet, Claude 3.5 Haiku
8. **Mistral AI** — Mistral Large, Mistral Small
9. **Fireworks AI** — Llama 3.3 70B, DeepSeek R1
10. **DeepSeek** — DeepSeek Chat, DeepSeek Reasoner
11. **Cohere** — Command R+, Command R
12. **Pollinations** (free fallback) — always available, no API key needed

Features:
- Automatic fallback chain (if Groq fails, tries Cerebras, then OpenAI, etc.)
- Task-based routing (smart/fast/reasoning/vision/free)
- Parallel model racing (instant_execute mode — fastest valid response wins)
- Circuit breaker on every provider (3 failures = disabled for 5 min)
- JSON mode support across all OpenAI-compatible providers


## What ERGIO Does

ERGIO autonomously builds, launches, and operates businesses. You send a text prompt like "Build a photography business in Lagos" and the Conductor brain:

1. Understands your request using Groq AI
2. Decomposes it into sub-tasks (website, leads, booking, invoicing, payments)
3. Routes each task to the right engine, MCP, or plugin
4. Queues external actions for your approval (emails, social posts, payments)
5. Executes autonomous tasks immediately (lead search, content generation, analytics)
6. Verifies results and returns a structured report

Nothing goes out without you saying yes. AI prepares, human approves.

## Architecture

```
User Request
    |
+-------------+
|  CONDUCTOR  |  (Groq-powered brain — understands, decomposes, executes)
+------+------+
       |
       +---> 10 ENGINES
       |     website, lead, booking, invoice, payment,
       |     content, voice, analytics, reputation, workflow
       |
       +---> 15 MCPs
       |     Stripe, Resend, Supabase, Groq, Google Maps, Twilio,
       |     Cloudflare, Higgsfield, Clay, ElevenLabs, Apify,
       |     Instantly, n8n, Cal.com, Postmark
       |
       +---> 20 PLUGINS
       |     WhatsApp CRM, Email Marketing, Google Analytics, Calendly,
       |     Flutterwave, Instagram, Push Notifications, AI Live Chat,
       |     Facebook Business, Twitter/X, LinkedIn, TikTok,
       |     WhatsApp Catalog, Google Business Profile, YouTube,
       |     Mailchimp, Notion, Canva, Paystack POS, Telegram Bot
       |
       +---> Approval Gateway (human-in-the-loop for external actions)
       |
       +---> Event Bus (Redis Pub/Sub for inter-engine communication)
       |
       +---> Circuit Breaker (auto-disable broken services, retry with backoff)
```

## The 10 Engines

1. Website Engine — generates complete business websites with AI branding and SEO
2. Lead Engine — captures, scores, and enriches leads using Clay MCP and web scraping
3. Booking Engine — manages appointments via Cal.com integration with auto reminders
4. Invoice Engine — auto-generates and tracks professional invoices
5. Payment Engine — collects payments via Paystack, Stripe, or Flutterwave with revenue tracking
6. Content Engine — generates marketing content and video ads using Higgsfield AI
7. Voice Engine — AI voice receptionist using ElevenLabs for answering business calls
8. Analytics Engine — revenue dashboards, lead insights, and weekly business reports
9. Reputation Engine — manages reviews, requests feedback, drafts professional responses
10. Workflow Engine — triggers n8n automations and pre-built workflow recipes

## The 15 MCP Integrations

| MCP | Purpose | Key Capabilities |
|-----|---------|-----------------|
| Stripe | Global payments | payment links, invoices, customers |
| Resend | Transactional email | send email, batch |
| Supabase | Database | query, insert, update, delete, rpc |
| Groq | AI inference | chat completion, JSON completion |
| Google Maps | Location | geocode, place search, directions |
| Twilio | Messaging | WhatsApp, SMS, voice calls |
| Cloudflare | CDN/DNS | cache purge, DNS records |
| Higgsfield | AI video/creative | video ads, product photos, UGC content |
| Clay | Lead enrichment | people search, company data, email/phone finder |
| ElevenLabs | Voice synthesis | text-to-speech, voice cloning, streaming |
| Apify | Web scraping | run actors, scrape URLs, Google search |
| Instantly | Cold email | campaigns, lead lists, sequence automation |
| n8n | Workflow automation | trigger workflows, list executions |
| Cal.com | Scheduling | available slots, bookings, cancellations |
| Postmark | Email delivery | send email, batch, delivery stats |

## The 20 Plugins

*Requires human approval (external actions):*
WhatsApp CRM, Email Marketing, Flutterwave, Instagram, Facebook Business, Twitter/X, LinkedIn, TikTok, WhatsApp Catalog, Google Business Profile, YouTube, Mailchimp, Paystack POS, Telegram Bot

*Autonomous (internal actions):*
Google Analytics, Calendly, Push Notifications, AI Live Chat, Notion, Canva

## Human-in-the-Loop Approval

19 action types always require human approval before execution:
send_email, send_whatsapp, send_sms, post_to_social, post_tweet, post_to_facebook, post_to_instagram, post_to_linkedin, post_to_tiktok, upload_video, charge_payment, create_payment_link, send_invoice, respond_to_review, send_inmail, broadcast_message, send_campaign, run_ads, make_call

The Conductor drafts these actions and queues them in the pending_approvals table. You approve or reject from the dashboard. AI prepares, human approves.

## Circuit Breaker

3 failures in 60 seconds = service disabled for 5 minutes. Automatic retry with exponential backoff (1s, 5s, 15s). Fallbacks: Groq fails = Pollinations, Resend fails = Postmark. Prevents cascade failures across the entire system.

## File Structure

```
ergio-engines/
+-- main.py                  # FastAPI server (original 4 engines + v5 endpoints)
+-- config.py                # All configuration and env vars
+-- render.yaml              # Render deployment config (free tier)
+-- requirements.txt         # Python dependencies
+-- engines/                 # Original 4 engines (preserved)
|   +-- engine_01_local_discovery.py
|   +-- engine_02_demand_matching.py
|   +-- engine_03_outreach.py
|   +-- engine_04_repeat_client.py
|   +-- orchestrator.py
+-- engine_system/           # v5.0 system (new)
|   +-- conductor.py         # The brain (30KB) — orchestrates everything
|   +-- conductor_prompt.py  # System prompt for the AI brain
|   +-- circuit_breaker.py   # Fault tolerance + retry logic
|   +-- mcp_client.py        # Unified client for 15 MCP servers
|   +-- plugin_sandbox.py    # Execute 20 plugins with approval gating
|   +-- approval_gateway.py  # Human-in-the-loop approval queue
|   +-- event_bus.py         # Redis Pub/Sub for inter-engine events
|   +-- supabase_schema.sql  # Database schema (9 tables with RLS)
|   +-- main_v5.py           # Standalone v5 FastAPI server (alternative)
|   +-- requirements_v5.txt  # v5-specific dependencies
|   +-- .env.example         # All 30+ environment variables
|   +-- README_V5.md         # v5 detailed documentation
+-- utils/                   # Shared utilities
|   +-- logger.py            # Logging setup
|   +-- ai.py                # Groq AI wrapper
|   +-- scraper.py           # Web scraper (httpx + Playwright)
|   +-- search.py            # SearXNG search
+-- db/                      # Database client
    +-- supabase_client.py   # Supabase connection
```

## API Endpoints

*Original 4 engines (still working):*
POST /engines/discovery — Local business discovery
POST /engines/matching — Demand matching
POST /engines/outreach — AI outreach
POST /engines/repeat — Repeat client engine
POST /engines/run-all — Run all 4 engines
POST /scrape — Scrape a URL
POST /crawl — Crawl multiple URLs
POST /search — SearXNG search
POST /ai — Direct Groq AI call
POST /social-content — Generate social content

*New v5 endpoints:*
POST /conductor — Send any request to the AI brain
GET /status — Full system status (engines, MCPs, plugins, circuits)
GET /mcp/list — List all 15 MCP integrations
GET /plugins/list — List all 20 plugins
GET /approvals — List pending approvals
POST /approve — Approve a pending action
POST /reject — Reject a pending action

*Health:*
GET / — API info
GET /health — Health check

## Quick Start

1. Clone the repo:
```
git clone https://github.com/emmanuelerogian723-alt/ergio-engines.git
cd ergio-engines
```

2. Install dependencies:
```
pip install -r requirements.txt
playwright install chromium --with-deps
```

3. Set up environment variables:
```
cp engine_system/.env.example .env
# Fill in your API keys
```

4. Run the Supabase schema:
```
# Run engine_system/supabase_schema.sql in your Supabase SQL Editor
```

5. Start the server:
```
python main.py
```

Server runs on http://localhost:8000

## Deploy to Render (Free Tier)

1. Go to Render dashboard, create new Web Service from this GitHub repo
2. Set build command: pip install -r requirements.txt && playwright install chromium --with-deps
3. Set start command: python main.py
4. Set environment variables (see engine_system/.env.example for full list):
   - GROQ_API_KEY (required)
   - SUPABASE_URL (required)
   - SUPABASE_SERVICE_KEY (required)
   - SEARXNG_URL (optional)
   - All MCP API keys (optional — system works without them, just disables those services)

Render free tier specs:
RAM: 512MB (ERGIO uses ~110-160MB)
Sleeps after 15 min inactivity (cold start takes ~10 seconds)
No persistent disk (all state goes to Supabase/Redis)

## No Oracle Needed

This system runs entirely on free-tier infrastructure:
Render (compute, free)
Supabase (PostgreSQL database, free tier)
Redis via Upstash (task queue + event bus, free tier — optional, falls back to in-memory)

No Oracle. No expensive infrastructure. Scales to thousands of businesses.

## Tech Stack

Language: Python 3.11
Framework: FastAPI + Uvicorn
AI: Groq (llama-3.3-70b for complex tasks, llama-3.1-8b-instant for fast)
Database: Supabase (PostgreSQL with Row Level Security)
Scraping: Playwright + httpx + BeautifulSoup
Search: SearXNG
Scheduling: APScheduler
Task Queue: Redis (optional, falls back to in-memory)
Circuit Breaker: Custom implementation with exponential backoff

## Backward Compatibility

The original 4 engines are fully preserved and work alongside the v5 system. If any v5 component fails to load, the server automatically falls back to legacy mode (4 engines only). Nothing breaks.

## Tested

All 8 Python files pass syntax check.
Server starts successfully with 10 engines, 15 MCPs, 20 plugins loaded.
All endpoints tested and working:
GET / — running v5.0.0
GET /health — healthy
GET /status — 10 engines, 15 MCPs, 20 plugins
GET /mcp/list — 15 MCPs registered
GET /plugins/list — 20 plugins registered
GET /approvals — 0 pending
POST /conductor — task completed

## License

MUTYINT. All rights reserved.

## Author

Emmanuel Ene Rejoice — MUTYINT
