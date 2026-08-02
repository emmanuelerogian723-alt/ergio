-- ============================================================
-- ERGIO — Fix generated_websites table columns
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- The table currently only has: id, html
-- These columns are needed for the website management system to work

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

-- Enable RLS policies (allow public read, authenticated write)
ALTER TABLE generated_websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read generated_websites" ON generated_websites
  FOR SELECT USING (true);

CREATE POLICY "Service role can write generated_websites" ON generated_websites
  FOR ALL USING (auth.role() = 'service_role');

-- Done! After running this, the generate endpoint will save websites with full metadata.
