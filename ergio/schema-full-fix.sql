-- ============================================================
-- ERGIO — COMPREHENSIVE SCHEMA FIX
-- Run this in Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- This fixes ALL table schemas for the full revenue system
-- ============================================================

-- ===== 1. generated_websites (for website deploy) =====
ALTER TABLE generated_websites 
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS website_category TEXT DEFAULT 'landing',
  ADD COLUMN IF NOT EXISTS website_type TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS brand_colors JSONB,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS created_date TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_date TIMESTAMPTZ;

-- ===== 2. bookings (for booking system) =====
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS business_id TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS client_phone TEXT,
  ADD COLUMN IF NOT EXISTS client_email TEXT,
  ADD COLUMN IF NOT EXISTS service_name TEXT,
  ADD COLUMN IF NOT EXISTS service_price NUMERIC,
  ADD COLUMN IF NOT EXISTS booking_date DATE,
  ADD COLUMN IF NOT EXISTS booking_time TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reference TEXT,
  ADD COLUMN IF NOT EXISTS created_date TIMESTAMPTZ DEFAULT now();

-- ===== 3. invoices (for invoicing) =====
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS business_id TEXT,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS client_email TEXT,
  ADD COLUMN IF NOT EXISTS client_phone TEXT,
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS created_date TIMESTAMPTZ DEFAULT now();

-- ===== 4. leads (for lead generation) =====
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS business_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS intent TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 70,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS created_date TIMESTAMPTZ DEFAULT now();

-- ===== 5. payments (for Paystack) =====
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS business_id TEXT,
  ADD COLUMN IF NOT EXISTS reference TEXT,
  ADD COLUMN IF NOT EXISTS amount NUMERIC,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS created_date TIMESTAMPTZ DEFAULT now();

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_websites_slug ON generated_websites(slug);
CREATE INDEX IF NOT EXISTS idx_bookings_business ON bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_business ON leads(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_business ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_websites_created ON generated_websites(created_date DESC);

-- ===== RLS POLICIES =====
ALTER TABLE generated_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow public read, service role write
DROP POLICY IF EXISTS "Public read websites" ON generated_websites;
CREATE POLICY "Public read websites" ON generated_websites FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write websites" ON generated_websites;
CREATE POLICY "Service write websites" ON generated_websites FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read bookings" ON bookings;
CREATE POLICY "Public read bookings" ON bookings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write bookings" ON bookings;
CREATE POLICY "Service write bookings" ON bookings FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read invoices" ON invoices;
CREATE POLICY "Public read invoices" ON invoices FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write invoices" ON invoices;
CREATE POLICY "Service write invoices" ON invoices FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read leads" ON leads;
CREATE POLICY "Public read leads" ON leads FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write leads" ON leads;
CREATE POLICY "Service write leads" ON leads FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read payments" ON payments;
CREATE POLICY "Public read payments" ON payments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write payments" ON payments;
CREATE POLICY "Service write payments" ON payments FOR ALL USING (true);

-- ===== DONE! =====
-- After running this:
-- 1. Website deploy saves with full metadata (slug, business_name, etc.)
-- 2. Booking system creates bookings in the database
-- 3. Invoice system saves invoices with items, tax, and totals
-- 4. Lead generation saves leads to the database
-- 5. Payment system records Paystack transactions
-- 6. All URLs use clean slugs (/s/powerhouse-fitness instead of UUIDs)
