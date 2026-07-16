# ERGIO — AI Business Operating System for Africa

*"You bring the skill. ERGIO brings the clients."*

## Quick Start

1. Create a Supabase project at https://supabase.com (free)
2. Run `schema.sql` in Supabase SQL Editor
3. Get your Supabase URL, anon key, and service key from Project Settings > API
4. Get a Groq API key from https://console.groq.com (free)
5. Get your Paystack secret key from https://dashboard.paystack.com
6. Fill in `config.js` with your Supabase URL and anon key
7. Set environment variables in Vercel (see `.env.example`)
8. Deploy to Vercel from this repo

## Architecture

- **Frontend**: Static HTML/CSS/JS (no framework needed)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Supabase (PostgreSQL + Auth)
- **AI**: Groq API (Llama 3.3 70B, Llama 3.1 8B)
- **Search**: SearXNG (70+ search engines, free, no API key)
- **Scraper**: Cheerio (lightweight HTML parser)
- **Images**: Pollinations.ai (free, no key)
- **Payments**: Paystack
- **Email**: Resend (free tier)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate` | POST | AI Conductor — generates business from prompt (SSE streaming) |
| `/api/refine` | POST | Chat refinement — edit website via natural language (SSE) |
| `/api/leads` | POST | Lead scanner — finds potential clients (SSE) |
| `/api/outreach` | GET/POST | AI email writer + sender |
| `/api/payments` | GET/POST/PUT | Paystack initialize, verify, webhook |
| `/api/bookings` | CRUD | Booking management |
| `/api/business` | CRUD | Business CRUD |
| `/api/analytics` | GET/POST | Dashboard analytics |
| `/api/whatsapp` | GET/POST | WhatsApp AI auto-reply bot |

## Database Tables

profiles, businesses, services, bookings, payments, leads, outreach_campaigns, clients, generated_websites, analytics_events, engine_status, whatsapp_conversations, referrals

## The 4 Client Acquisition Engines

1. **Local Discovery** — SEO-optimized pages + Google Business Profile
2. **Demand Matching** — SearXNG scans 70+ engines for people needing your service
3. **AI Outreach** — Groq writes personalized cold emails, sends via Resend
4. **Repeat Clients** — Automated WhatsApp follow-ups to past clients

## License

MIT
