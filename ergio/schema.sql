-- ========================================
-- ERGIO Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',
  plan_status TEXT DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BUSINESSES
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  type TEXT,
  description TEXT,
  logo_url TEXT,
  brand_colors JSONB DEFAULT '{"primary":"#00D9FF","secondary":"#09090B"}',
  domain TEXT,
  subdomain TEXT,
  status TEXT DEFAULT 'active',
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Nigeria',
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SERVICES
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'NGN',
  duration_minutes INT DEFAULT 60,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BOOKINGS
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id),
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_whatsapp TEXT,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  price NUMERIC(10,2),
  payment_status TEXT DEFAULT 'unpaid',
  paystack_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'pending',
  paystack_ref TEXT,
  paystack_url TEXT,
  payment_method TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LEADS (found by the engines)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_url TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  platform TEXT,
  message TEXT,
  intent TEXT,
  location TEXT,
  score INT DEFAULT 50,
  status TEXT DEFAULT 'new',
  contacted BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. OUTREACH CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  channel TEXT DEFAULT 'email',
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  opened BOOLEAN DEFAULT false,
  replied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CLIENTS (converted leads/bookings)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  total_bookings INT DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  last_booking_date DATE,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. GENERATED WEBSITES
CREATE TABLE IF NOT EXISTS public.generated_websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  html TEXT NOT NULL,
  css TEXT,
  js TEXT,
  version INT DEFAULT 1,
  is_published BOOLEAN DEFAULT false,
  published_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ANALYTICS EVENTS
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  visitor_ip TEXT,
  visitor_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ENGINE STATUS (track the 4 acquisition engines)
CREATE TABLE IF NOT EXISTS public.engine_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  engine_name TEXT NOT NULL,
  status TEXT DEFAULT 'idle',
  last_run_at TIMESTAMPTZ,
  last_run_results INT DEFAULT 0,
  total_results INT DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. WHATSAPP CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_phone TEXT NOT NULL,
  client_name TEXT,
  messages JSONB DEFAULT '[]',
  ai_enabled BOOLEAN DEFAULT true,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. REFERRALS
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES auth.users(id),
  referred_email TEXT,
  referred_name TEXT,
  business_id UUID REFERENCES public.businesses(id),
  status TEXT DEFAULT 'pending',
  reward_months INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engine_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Profiles: users can see/edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Businesses: users can CRUD their own businesses
CREATE POLICY "Users can view own businesses" ON public.businesses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own businesses" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own businesses" ON public.businesses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own businesses" ON public.businesses FOR DELETE USING (auth.uid() = user_id);

-- Services
CREATE POLICY "Users can view own services" ON public.services FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own services" ON public.services FOR INSERT WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own services" ON public.services FOR UPDATE USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own services" ON public.services FOR DELETE USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Bookings
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Payments
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own payments" ON public.payments FOR UPDATE USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Leads
CREATE POLICY "Users can view own leads" ON public.leads FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own leads" ON public.leads FOR INSERT WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own leads" ON public.leads FOR UPDATE USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Outreach
CREATE POLICY "Users can view own outreach" ON public.outreach_campaigns FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own outreach" ON public.outreach_campaigns FOR INSERT WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own outreach" ON public.outreach_campaigns FOR UPDATE USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Clients
CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Generated websites
CREATE POLICY "Users can view own websites" ON public.generated_websites FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own websites" ON public.generated_websites FOR INSERT WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own websites" ON public.generated_websites FOR UPDATE USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Analytics events (anyone can insert, only owner can view)
CREATE POLICY "Anyone can insert analytics" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own analytics" ON public.analytics_events FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Engine status
CREATE POLICY "Users can view own engines" ON public.engine_status FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own engines" ON public.engine_status FOR INSERT WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own engines" ON public.engine_status FOR UPDATE USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- WhatsApp conversations
CREATE POLICY "Users can view own whatsapp" ON public.whatsapp_conversations FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own whatsapp" ON public.whatsapp_conversations FOR INSERT WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own whatsapp" ON public.whatsapp_conversations FOR UPDATE USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Referrals
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (referrer_id = auth.uid());
CREATE POLICY "Users can insert own referrals" ON public.referrals FOR INSERT WITH CHECK (referrer_id = auth.uid());

-- ========================================
-- TRIGGERS
-- ========================================

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER businesses_updated BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER generated_websites_updated BEFORE UPDATE ON public.generated_websites FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER engine_status_updated BEFORE UPDATE ON public.engine_status FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();

-- ========================================
-- INDEXES
-- ========================================
CREATE INDEX idx_businesses_user ON public.businesses(user_id);
CREATE INDEX idx_bookings_business ON public.bookings(business_id);
CREATE INDEX idx_bookings_date ON public.bookings(date);
CREATE INDEX idx_payments_business ON public.payments(business_id);
CREATE INDEX idx_leads_business ON public.leads(business_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_services_business ON public.services(business_id);
CREATE INDEX idx_clients_business ON public.clients(business_id);
CREATE INDEX idx_analytics_business ON public.analytics_events(business_id);
CREATE INDEX idx_analytics_type ON public.analytics_events(event_type);
CREATE INDEX idx_outreach_business ON public.outreach_campaigns(business_id);
CREATE INDEX idx_engine_business ON public.engine_status(business_id);
CREATE INDEX idx_businesses_slug ON public.businesses(slug);
CREATE INDEX idx_whatsapp_business ON public.whatsapp_conversations(business_id);

-- ========================================
-- ERGIO v2.2 Additional Tables
-- ========================================

-- File uploads metadata
CREATE TABLE IF NOT EXISTS public.file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'asset',
  mime_type TEXT,
  file_size BIGINT DEFAULT 0,
  storage_bucket TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own uploads" ON public.file_uploads FOR ALL USING (auth.uid() = created_by OR business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  items JSONB DEFAULT '[]',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own invoices" ON public.invoices FOR ALL USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- Transactions (income & expenses)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transactions" ON public.transactions FOR ALL USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- Reviews & testimonials
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved reviews" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Owners manage reviews" ON public.reviews FOR ALL USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_uploads_business ON public.file_uploads(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business ON public.transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business ON public.reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
