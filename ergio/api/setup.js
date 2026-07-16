// ERGIO One-time database setup endpoint
// Runs the full schema via pg direct connection
// POST /api/setup?key=ergio_setup_2026 to execute

import pkg from 'pg';
const { Client } = pkg;

const SETUP_KEY = 'ergio_setup_2026';

const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT, phone TEXT, avatar_url TEXT,
  plan TEXT DEFAULT 'free', plan_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, slug TEXT UNIQUE, type TEXT, description TEXT,
  logo_url TEXT, brand_colors JSONB DEFAULT '{"primary":"#00D9FF"}',
  website_html TEXT, status TEXT DEFAULT 'active',
  city TEXT, state TEXT, country TEXT DEFAULT 'Nigeria',
  phone TEXT, whatsapp TEXT, email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT, price NUMERIC(10,2),
  currency TEXT DEFAULT 'NGN', duration_minutes INT DEFAULT 60,
  is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id),
  client_name TEXT NOT NULL, client_email TEXT, client_phone TEXT,
  booking_date DATE, booking_time TEXT,
  status TEXT DEFAULT 'pending', notes TEXT,
  price NUMERIC(10,2), payment_status TEXT DEFAULT 'unpaid',
  paystack_ref TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id),
  amount NUMERIC(10,2) NOT NULL, currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'pending', paystack_ref TEXT,
  customer_email TEXT, paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  source TEXT, source_url TEXT, name TEXT, email TEXT, phone TEXT,
  message TEXT, intent TEXT, score INT DEFAULT 50,
  status TEXT DEFAULT 'new', contacted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL, email TEXT, phone TEXT, whatsapp TEXT,
  total_bookings INT DEFAULT 0, total_spent NUMERIC(10,2) DEFAULT 0,
  last_booking_date DATE, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE, client_name TEXT, client_email TEXT,
  items JSONB DEFAULT '[]', total_amount NUMERIC(10,2),
  due_date DATE, status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  type TEXT, amount NUMERIC(10,2), category TEXT,
  description TEXT, expense_date DATE, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_name TEXT, rating INT CHECK (rating BETWEEN 1 AND 5),
  text TEXT, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  type TEXT, title TEXT, message TEXT,
  channel TEXT DEFAULT 'in-app', status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES auth.users(id),
  referred_email TEXT, business_id UUID REFERENCES public.businesses(id),
  status TEXT DEFAULT 'pending', reward_amount NUMERIC DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='businesses' AND policyname='businesses_own') THEN
    CREATE POLICY "businesses_own" ON public.businesses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_own') THEN
    CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bookings' AND policyname='bookings_public_insert') THEN
    CREATE POLICY "bookings_public_insert" ON public.bookings FOR INSERT WITH CHECK (true);
  END IF;
END $$;
`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const key = req.query.key || (req.body && req.body.key);
  if (key !== SETUP_KEY) {
    return res.status(403).json({ error: 'Invalid setup key' });
  }

  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    // Build connection from Supabase project ref
    const projectRef = 'owcxfzlanlrulflsyvlr';
    const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;
    if (!dbPassword) {
      return res.status(500).json({ 
        error: 'No database connection string. Add DATABASE_URL or SUPABASE_DB_PASSWORD env var.',
        hint: 'Get from Supabase Dashboard > Settings > Database > Connection string'
      });
    }
    var connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;
  } else {
    var connectionString = dbUrl;
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(SCHEMA);
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name;
    `);
    await client.end();
    return res.status(200).json({ 
      success: true, 
      message: 'ERGIO database setup complete!',
      tables: result.rows.map(r => r.table_name)
    });
  } catch (err) {
    try { await client.end(); } catch(e) {}
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
