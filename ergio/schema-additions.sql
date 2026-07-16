-- ========================================
-- ERGIO Schema Additions — Missing Tables
-- Run this in Supabase SQL Editor
-- ========================================

-- Transactions table (for expense tracker)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID,
  type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID,
  invoice_number TEXT NOT NULL,
  business_name TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  items JSONB DEFAULT '[]',
  subtotal NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID,
  client_name TEXT NOT NULL,
  rating INT DEFAULT 5,
  text TEXT,
  booking_id UUID,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Users can insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Users can delete transactions" ON public.transactions FOR DELETE USING (true);

CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Users can insert invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update invoices" ON public.invoices FOR UPDATE USING (true);

CREATE POLICY "Anyone can view approved reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can submit reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update reviews" ON public.reviews FOR UPDATE USING (true);
