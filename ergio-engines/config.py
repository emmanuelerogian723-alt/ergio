"""ERGIO Engines — Shared Configuration (v5.0 Render-Ready)"""
import os
from dotenv import load_dotenv
load_dotenv

class Settings:
    # ── Server ──
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "https://ergio.vercel.app").split(",")
    
    # ── AI ──
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL_SMART = os.getenv("GROQ_MODEL_SMART", "llama-3.3-70b-versatile")
    GROQ_MODEL_FAST = os.getenv("GROQ_MODEL_FAST", "llama-3.1-8b-instant")
    
    # ── Database ──
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
    
    # ── Redis (optional — falls back to in-memory) ──
    REDIS_URL = os.getenv("REDIS_URL", "")
    
    # ── Search ──
    SEARXNG_URL = os.getenv("SEARXNG_URL", "")
    
    # ── Email ──
    RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
    FROM_EMAIL = os.getenv("FROM_EMAIL", "ergio@resend.dev")
    
    # ── Engine Settings ──
    ENGINE_DISCOVERY_INTERVAL_HOURS = int(os.getenv("ENGINE_DISCOVERY_INTERVAL_HOURS", "6"))
    ENGINE_MATCHING_INTERVAL_MINUTES = int(os.getenv("ENGINE_MATCHING_INTERVAL_MINUTES", "30"))
    LEAD_SCORE_THRESHOLD = int(os.getenv("LEAD_SCORE_THRESHOLD", "50"))
    MAX_LEADS_PER_SCAN = int(os.getenv("MAX_LEADS_PER_SCAN", "20"))
    
    # ── MCP API Keys (all optional — system works without them) ──
    HIGGSFIELD_API_KEY = os.getenv("HIGGSFIELD_API_KEY", "")
    HIGGSFIELD_MCP_URL = os.getenv("HIGGSFIELD_MCP_URL", "https://mcp.higgsfield.ai")
    CLAY_API_KEY = os.getenv("CLAY_API_KEY", "")
    ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
    STRIPE_API_KEY = os.getenv("STRIPE_API_KEY", "")
    APIFY_API_KEY = os.getenv("APIFY_API_KEY", "")
    APIFY_API_URL = os.getenv("APIFY_API_URL", "https://api.apify.com/v2")
    INSTANTLY_API_KEY = os.getenv("INSTANTLY_API_KEY", "")
    N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "")
    N8N_WEBHOOK_KEY = os.getenv("N8N_WEBHOOK_KEY", "")
    CAL_COM_API_KEY = os.getenv("CAL_COM_API_KEY", "")
    POSTMARK_SERVER_TOKEN = os.getenv("POSTMARK_SERVER_TOKEN", "")
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
    CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN", "")
    PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "")
    FLUTTERWAVE_SECRET_KEY = os.getenv("FLUTTERWAVE_SECRET_KEY", "")
    ERGIO_FRONTEND_URL = os.getenv("ERGIO_FRONTEND_URL", "https://ergio.vercel.app")
    
    # ── Social Media (optional) ──
    INSTAGRAM_ACCESS_TOKEN = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
    FACEBOOK_PAGE_TOKEN = os.getenv("FACEBOOK_PAGE_TOKEN", "")
    TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN", "")
    LINKEDIN_ACCESS_TOKEN = os.getenv("LINKEDIN_ACCESS_TOKEN", "")
    TIKTOK_ACCESS_TOKEN = os.getenv("TIKTOK_ACCESS_TOKEN", "")
    YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
    MAILCHIMP_API_KEY = os.getenv("MAILCHIMP_API_KEY", "")
    NOTION_API_KEY = os.getenv("NOTION_API_KEY", "")
    CANVA_API_KEY = os.getenv("CANVA_API_KEY", "")
    FCM_SERVER_KEY = os.getenv("FCM_SERVER_KEY", "")


    # ── New MCP Keys (v5.1) ──
    TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
    SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN", "")
    NOTION_API_KEY = os.getenv("NOTION_API_KEY", "")
    GOOGLE_ADS_ACCESS_TOKEN = os.getenv("GOOGLE_ADS_ACCESS_TOKEN", "")
    META_ADS_ACCESS_TOKEN = os.getenv("META_ADS_ACCESS_TOKEN", "")
    WHATSAPP_BUSINESS_TOKEN = os.getenv("WHATSAPP_BUSINESS_TOKEN", "")
    VERCEL_API_TOKEN = os.getenv("VERCEL_API_TOKEN", "")
    SENTRY_AUTH_TOKEN = os.getenv("SENTRY_AUTH_TOKEN", "")
    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
    CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
    
    # ── New Plugin Keys (v5.1) ──
    SHOPIFY_ACCESS_TOKEN = os.getenv("SHOPIFY_ACCESS_TOKEN", "")
    DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN", "")
    REDDIT_ACCESS_TOKEN = os.getenv("REDDIT_ACCESS_TOKEN", "")
    PINTEREST_ACCESS_TOKEN = os.getenv("PINTEREST_ACCESS_TOKEN", "")
    GOOGLE_DRIVE_TOKEN = os.getenv("GOOGLE_DRIVE_TOKEN", "")
    ZOOM_ACCESS_TOKEN = os.getenv("ZOOM_ACCESS_TOKEN", "")
    HUBSPOT_API_KEY = os.getenv("HUBSPOT_API_KEY", "")
    GOOGLE_CALENDAR_TOKEN = os.getenv("GOOGLE_CALENDAR_TOKEN", "")
    
    # ── Ping Engine ──
    PING_URL = os.getenv("PING_URL", "")
    PING_INTERVAL = os.getenv("PING_INTERVAL", "600")


    # ── AI Router Providers (v5.2) ──
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
    CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY", "")
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
    TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY", "")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
    FIREWORKS_API_KEY = os.getenv("FIREWORKS_API_KEY", "")
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
    COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")
    
    # ── Memory System ──
    MEMORY_STORAGE = os.getenv("MEMORY_STORAGE", "auto")  # auto, supabase, file

settings = Settings()
