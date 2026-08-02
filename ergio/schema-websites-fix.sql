-- ============================================================
-- ERGIO — Fix generated_websites table columns
-- Run this in Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================
-- The table currently only has: id, html
-- These columns are needed for the website deploy + management system

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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_generated_websites_slug ON generated_websites(slug);
CREATE INDEX IF NOT EXISTS idx_generated_websites_category ON generated_websites(website_category);
CREATE INDEX IF NOT EXISTS idx_generated_websites_created ON generated_websites(created_date DESC);

-- Enable RLS (allow public read so /s/{slug} works, service role can write)
ALTER TABLE generated_websites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read generated_websites" ON generated_websites;
CREATE POLICY "Public can read generated_websites" ON generated_websites
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can write generated_websites" ON generated_websites;
CREATE POLICY "Service role can write generated_websites" ON generated_websites
  FOR ALL USING (true);

-- Done! After running this:
-- 1. The generate endpoint saves websites with full metadata (name, slug, type, colors)
-- 2. /s/{slug} serves the website HTML directly
-- 3. Dashboard "My Websites" shows all generated sites
