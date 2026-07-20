# ERGIO Engine System v5.0

AI Business Operating System — Conductor + 10 Engines + 15 MCPs + 20 Plugins

## Architecture

```
User Request
    ↓
┌─────────────┐
│  CONDUCTOR  │  (brain — Groq-powered, thinks & decomposes)
└──────┬──────┘
       ├──→ 10 ENGINES (website, lead, booking, invoice, payment, content, voice, analytics, reputation, workflow)
       ├──→ 15 MCPs (Higgsfield, Clay, Stripe, ElevenLabs, Apify, etc.)
       ├──→ 20 PLUGINS (WhatsApp CRM, Facebook, Instagram, TikTok, etc.)
       ├──→ Approval Gateway (human-in-the-loop for external actions)
       ├──→ Event Bus (Redis Pub/Sub for inter-engine communication)
       └──→ Circuit Breaker (auto-disable broken services, retry with backoff)
```

## Files

| File | Purpose |
|------|---------|
| conductor_prompt.py | System prompt for the AI brain |
| circuit_breaker.py | Fault tolerance — retry + auto-disable broken services |
| mcp_client.py | Unified client for 15 MCP servers |
| plugin_sandbox.py | Execute 20 plugins with approval gating |
| approval_gateway.py | Human-in-the-loop approval queue |
| event_bus.py | Redis Pub/Sub for inter-engine events |
| conductor.py | The brain — orchestrates everything |
| main.py | FastAPI server — REST API endpoints |
| supabase_schema.sql | Database schema with RLS |
| requirements.txt | Python dependencies |
| .env.example | All environment variables |

## Quick Start

1. Clone and install:
```bash
git clone https://github.com/emmanuelerogian723-alt/ergio-engines.git
cd ergio-engines
pip install -r requirements.txt
cp .env.example .env  # fill in your keys
```

2. Set up Supabase:
```bash
# Run supabase_schema.sql in your Supabase SQL Editor
```

3. Run locally:
```bash
python main.py
```

4. Deploy to Render:
   - Create new Web Service from this repo
   - Set all env vars in Render dashboard
   - Build command: pip install -r requirements.txt
   - Start command: python main.py

## API Endpoints

POST /conductor — Send any request to the AI brain
POST /build — Build a business website (SSE streamed)
POST /approve — Approve a pending action
POST /reject — Reject a pending action
GET /approvals — List pending approvals
GET /status — Full system status
GET /mcp/list — List all MCP integrations
GET /plugins/list — List all plugins

## Key Design Decisions

1. Human-in-the-loop: AI prepares, human approves all external actions
2. Circuit breakers: broken services auto-disable, preventing cascade failures
3. Fallbacks: if Groq fails, use Pollinations. If Resend fails, use Postmark.
4. Event-driven: engines communicate via Redis Pub/Sub events
5. Polyglot persistence: Supabase (structured) + MongoDB (content) + Firebase (real-time) + Redis (queue)
6. No Oracle: Render + Supabase + Redis scales to thousands of businesses at fraction of cost
