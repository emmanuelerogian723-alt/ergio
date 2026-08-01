# ERGIO Maintenance Guide

> Complete operational guide for keeping ERGIO healthy, updated, and scaling.
> Last updated: July 2026

---

## Architecture Overview

ERGIO runs on three platforms:

| Component | Platform | URL | Repo |
|-----------|----------|-----|------|
| Frontend (Dashboard + Website) | Vercel | ergio.vercel.app | github.com/emmanuelerogian723-alt/ergio |
| Backend (AI Engines + API) | Render | ergio-engines.onrender.com | github.com/emmanuelerogian723-alt/ergio-engines |
| Database | Supabase | owcxfzlanlrulflsyvlr.supabase.co | N/A (managed) |
| Payments | Paystack | api.paystack.co | Serverless on Vercel |

### Tech Stack
- Frontend: Vanilla JS, HTML, CSS (no framework, fast and lightweight)
- Backend: FastAPI + Python 3.11, Groq for LLM
- Database: Supabase (PostgreSQL with REST API)
- AI: Groq (fast inference), search via SearXNG fallback
- Payments: Paystack (NGN), serverless on Vercel

### Serverless Functions (Vercel, max 3 on Hobby plan)
1. api/[endpoint].js — catch-all router for all API endpoints (60s timeout)
2. api/health.js — health check (10s timeout)
3. api/firebase-config.js — Firebase config delivery (10s timeout)

---

## Daily Maintenance (5 minutes)

### Check Service Health
```bash
curl -s https://ergio.vercel.app/api/health | jq .
curl -s https://ergio-engines.onrender.com/health | jq .
curl -s -X POST https://ergio.vercel.app/api/paystack -H "Content-Type: application/json" -d '{"plan_id":"test","amount":100,"email":"test@test.com"}' | jq .
```

### What to look for:
- Vercel health: should return status ok
- Render health: should show status healthy, groq true, supabase true
- Paystack: should return authorization_url (means key is working)
- If Render shows searxng false — this is OK (fallback search is active)

### Render Free Plan Cold Starts
Render free plan sleeps after 15 minutes of inactivity. First request after sleep takes ~30-50 seconds. To keep warm:
- Set up UptimeRobot to ping https://ergio-engines.onrender.com/health every 10 minutes
- OR upgrade to Render Starter ($7/month) for always-on

---

## Weekly Maintenance (30 minutes)

### Check Vercel Function Count
Vercel Hobby plan allows max 3 serverless functions. If you add more, deployments fail.

### Check Supabase Database
1. Go to https://supabase.com/dashboard/project/owcxfzlanlrulflsyvlr
2. Check Table Editor — all 23 tables should exist
3. Check API logs for errors
4. Check storage usage (free tier: 500MB database, 1GB storage)

### Test Key User Flows
1. Open https://ergio.vercel.app/dashboard/index.html
2. Overview tab should load with KPIs
3. Conductor tab — send a message, should get AI response in under 2s
4. Billing tab — click Upgrade Now, should redirect to Paystack
5. Engines tab — should show 10 engines
6. MCP and Plugins tab — should show 18 servers + 12 plugins

---

## Monthly Maintenance (1 hour)

### Rotate API Keys
- Paystack: https://dashboard.paystack.co/settings/api-keys
- Groq: https://console.groq.com/keys
- Supabase: https://supabase.com/dashboard/project/owcxfzlanlrulflsyvlr/settings/api
- Vercel: https://vercel.com/account/tokens

### After rotating keys, update them on:
- Vercel: Project Settings > Environment Variables
- Render: Service > Environment

### Check GitHub Security Alerts
1. Go to repo Settings > Security > Code scanning alerts
2. Go to repo Settings > Security > Dependabot alerts
3. Fix any critical alerts

---

## Emergency Playbook

### Frontend Down (Vercel)
1. Check https://www.vercel-status.com/
2. Check deployment state via API
3. If deployment failed: check build logs on Vercel dashboard
4. Common fix: too many serverless functions (max 3 on Hobby)
5. Rollback: Vercel dashboard > Deployments > Instant Rollback

### Backend Down (Render)
1. Check https://status.render.com
2. Check if service is sleeping (free plan)
3. If build fails:
   - Check Python syntax: python3 -c "import py_compile; py_compile.compile('main.py', doraise=True)"
   - Check requirements.txt for incompatible packages
4. Manual deploy: Render dashboard > Manual Deploy > Deploy Latest Commit

### Database Down (Supabase)
1. Check https://status.supabase.com
2. Check if free tier limits exceeded (500MB DB, 1GB storage)
3. If tables are missing: run schema from Supabase SQL Editor

### Paystack Not Working
1. Check if PAYSTACK_SECRET_KEY is set on Vercel
2. Test endpoint with curl
3. If 500 error: key is missing or invalid
4. If 400 error: check Paystack dashboard for account status

### AI/Conductor Not Responding
1. Check if GROQ_API_KEY is set on Render
2. Test: curl -X POST https://ergio-engines.onrender.com/ai with a prompt
3. If timeout: Render is sleeping. Wait 30-50s for wake up.
4. If 500: Groq key expired or rate limited. Check https://console.groq.com

---

## Environment Variables

### Vercel (Frontend + Paystack Serverless)
- PAYSTACK_SECRET_KEY
- PAYSTACK_PUBLIC_KEY
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

### Render (Backend)
- GROQ_API_KEY
- SUPABASE_URL
- SUPABASE_SERVICE_KEY
- SUPABASE_ANON_KEY
- SEARXNG_URL
- CORS_ORIGINS
- PAYSTACK_SECRET_KEY
- HEADLESS
- MAX_CONCURRENT_CRAWLS
- MAX_LEADS_PER_SCAN
- PORT
- PYTHON_VERSION

---

## Database Management

### Supabase Tables (23 total)
businesses, profiles, leads, bookings, payments, clients, invoices, outreach_campaigns, generated_websites, reviews, referrals, referral_codes, rewards, analytics_events, engine_logs, seo_pages, services, file_uploads, whatsapp_conversations, notifications, transactions, engine_status, platform_analytics

### Backup Strategy
- Supabase free tier includes daily backups (7-day retention)
- For manual backup: Supabase Dashboard > Database > Backups
- Export table data: Supabase Dashboard > Table Editor > Export CSV

---

## Deployment Guide

### Deploy Frontend to Vercel
```bash
cd ergio
git add -A
git commit -m "description of changes"
git push origin main
# Vercel auto-deploys in ~25 seconds
```

### Deploy Backend to Render
```bash
cd ergio-engines
git add -A
git commit -m "description of changes"
git push origin main
# Render auto-deploys in ~1-2 minutes (if auto-deploy is ON)
```

### Vercel Serverless Function Limit
- Hobby plan: MAX 3 serverless functions
- All API routes go through api/[endpoint].js (catch-all)
- DO NOT add separate files in api/ directory
- New endpoints: add to ergio/api/ and register in api/[endpoint].js

---

## Monitoring Setup (Free)

1. UptimeRobot (free): Monitor these URLs
   - https://ergio.vercel.app/api/health (every 5 min)
   - https://ergio-engines.onrender.com/health (every 10 min, keeps Render warm)
   - https://ergio.vercel.app/dashboard/index.html (every 5 min)

2. Vercel Analytics (free on Hobby)
3. Render Metrics (free)
4. Supabase Logs (free)

---

## Cost Management

### Current Monthly Costs
- Vercel Hobby: $0
- Render Free: $0
- Supabase Free: $0
- Groq Free tier: $0
- Paystack: 1.5% per local transaction, 3.9% international
- Total: $0/month + Paystack fees

### When to Upgrade
- Vercel Pro ($20/mo): When you need more than 3 serverless functions
- Render Starter ($7/mo): When cold starts become a problem
- Supabase Pro ($25/mo): When you exceed 500MB DB
- Groq paid: When you exceed free tier rate limits

---

## Quick Reference

### Important URLs
- Dashboard: https://ergio.vercel.app/dashboard/index.html
- Main site: https://ergio.vercel.app
- Backend health: https://ergio-engines.onrender.com/health
- API health: https://ergio.vercel.app/api/health

### Important Dashboards
- Vercel: https://vercel.com/emmanuelerogian723-2472
- Render: https://dashboard.render.com
- Supabase: https://supabase.com/dashboard/project/owcxfzlanlrulflsyvlr
- Paystack: https://dashboard.paystack.co
- Groq: https://console.groq.com

### GitHub Repos
- Frontend: https://github.com/emmanuelerogian723-alt/ergio
- Backend: https://github.com/emmanuelerogian723-alt/ergio-engines
- EROGIAN Studio: https://github.com/emmanuelerogian723-alt/erogian-website

---

*Maintained by Vesper (AI agent) for Emmanuel Erog*
