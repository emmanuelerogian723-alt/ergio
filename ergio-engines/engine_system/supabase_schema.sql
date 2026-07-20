-- ERGIO Engine System — Supabase Schema
-- Run this in Supabase SQL Editor to create all tables with RLS

-- ── Extensions ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Businesses ──
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT,
  name TEXT NOT NULL,
  type TEXT,
  city TEXT DEFAULT 'Lagos',
  description TEXT,
  website_html TEXT,
  website_url TEXT,
  brand_logo_url TEXT,
  brand_colors JSONB,
  status TEXT DEFAULT 'active',
  plan TEXT DEFAULT 'starter',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Leads ──
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  score INTEGER DEFAULT 50,
  qualified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'new',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Bookings ──
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  service TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Invoices ──
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_name TEXT,
  client_email TEXT,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'NGN',
  service TEXT,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  invoice_data JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Payments ──
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'NGN',
  gateway TEXT,
  gateway_reference TEXT,
  status TEXT DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. Pending Approvals ──
CREATE TABLE IF NOT EXISTS pending_approvals (
  id TEXT PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  engine TEXT,
  plugin TEXT,
  capability TEXT,
  params JSONB,
  content_preview TEXT,
  status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejected_by TEXT,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  result JSONB,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. Activity Logs ──
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  engine TEXT,
  action TEXT,
  status TEXT,
  details JSONB,
  tokens_used INTEGER DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. Outreach Log ──
CREATE TABLE IF NOT EXISTS outreach_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  channel TEXT,
  message TEXT,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 9. Plugin Configurations ──
CREATE TABLE IF NOT EXISTS plugin_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  plugin_name TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_leads_business_id ON leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_business_id ON bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_status ON pending_approvals(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_business_id ON activity_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ── Row Level Security ──
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_configs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users see own businesses" ON businesses FOR SELECT USING (auth.uid()::text = owner_id);
CREATE POLICY "Users insert own businesses" ON businesses FOR INSERT WITH CHECK (auth.uid()::text = owner_id);
CREATE POLICY "Users update own businesses" ON businesses FOR UPDATE USING (auth.uid()::text = owner_id);

-- Service role can do everything (for the engine backend)
-- This is set via Supabase dashboard: service_role bypasses RLS
