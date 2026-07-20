# ERGIO Engine System v5.0 — Major Upgrade

This upgrade adds the **Conductor** — an AI brain that orchestrates all engines, MCPs, and plugins.

## What's New

### Conductor (The Brain)
- `engine_system/conductor.py` — AI brain that takes any user request, understands it, decomposes it into sub-tasks, and routes to the right engine/MCP/plugin
- Uses Groq for reasoning (fast model for understanding, smart model for complex tasks)
- 6-step pipeline: Understand → Decompose → Check Permissions → Execute → Verify → Report

### 10 Engines (6 new)
1. Website Engine (existing, upgraded)
2. Lead Engine (existing, upgraded with Clay MCP)
3. Booking Engine (new — Cal.com integration)
4. Invoice Engine (new — auto-generate + track)
5. Payment Engine (new — Paystack + Stripe + Flutterwave)
6. Content Engine (new — Higgsfield video ads)
7. Voice Engine (new — ElevenLabs AI receptionist)
8. Analytics Engine (new — revenue + insights)
9. Reputation Engine (new — review management)
10. Workflow Engine (new — n8n automation)

### 15 MCP Integrations (8 new)
- Existing: Stripe, Resend, Supabase, Groq, Google Maps, Twilio, Cloudflare
- New: Higgsfield, Clay, ElevenLabs, Apify, Instantly, n8n, Cal.com, Postmark

### 20 Plugins (12 new)
- Existing: WhatsApp CRM, Email Marketing, Google Analytics, Calendly, Flutterwave, Instagram, Push Notifications, AI Live Chat
- New: Facebook Business, Twitter/X, LinkedIn, TikTok, WhatsApp Catalog, Google Business, YouTube, Mailchimp, Notion, Canva, Paystack POS, Telegram Bot

### Human-in-the-Loop Approval Gateway
- AI prepares all external actions (emails, social posts, payments, WhatsApp messages)
- Human approves before anything goes out
- 19 action types require approval
- Stored in Supabase `pending_approvals` table

### Circuit Breaker (Fault Tolerance)
- 3 failures in 60 seconds = service disabled for 5 minutes
- Automatic retry with exponential backoff (1s, 5s, 15s)
- Fallbacks: Groq → Pollinations, Resend → Postmark
- Prevents cascade failures across the system

### Event Bus (Redis Pub/Sub)
- Inter-engine communication
- Channels: lead_captured, booking_created, invoice_paid, content_ready, review_received
- Falls back to in-memory if Redis unavailable

## File Structure

```
engine_system/
├── conductor_prompt.py      # System prompt for the AI brain
├── circuit_breaker.py       # Fault tolerance + retry logic
├── mcp_client.py            # Client for 15 MCP servers
├── plugin_sandbox.py        # Execute 20 plugins with approval gating
├── approval_gateway.py      # Human-in-the-loop approval queue
├── event_bus.py             # Redis Pub/Sub for inter-engine events
├── conductor.py             # The brain — orchestrates everything
├── main_v5.py               # FastAPI server (new endpoints)
├── supabase_schema.sql      # Database schema (9 tables + RLS)
├── requirements_v5.txt      # Python dependencies
├── .env.example             # All environment variables
└── README_V5.md             # Detailed documentation
```

## Deployment

1. Run `engine_system/supabase_schema.sql` in Supabase SQL Editor
2. Set environment variables from `engine_system/.env.example` in Render
3. Update Render start command to: `python engine_system/main_v5.py`
4. Install new deps: `pip install -r engine_system/requirements_v5.txt`

## No Oracle Needed

This system runs on:
- Render (backend, free tier works)
- Supabase (database, free tier)
- Redis (task queue, optional — falls back to in-memory)
- No Oracle. No expensive infrastructure.
