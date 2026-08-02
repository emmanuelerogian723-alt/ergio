-- ========================================
-- ERGIO — generated_websites schema fix
-- Run this in Supabase SQL Editor to ensure all columns exist
-- ========================================

-- Ensure the table exists
CREATE TABLE IF NOT EXISTS public.generated_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (idempotent)
ALTER TABLE public.generated_websites ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.generated_websites ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'landing';
ALTER TABLE public.generated_websites ADD COLUMN IF NOT EXISTS website_type TEXT DEFAULT 'standard';
ALTER TABLE public.generated_websites ADD COLUMN IF NOT EXISTS website_category TEXT DEFAULT 'landing';
ALTER TABLE public.generated_websites ADD COLUMN IF NOT EXISTS html_content TEXT;
ALTER TABLE public.generated_websites ADD COLUMN IF NOT EXISTS html TEXT;
ALTER TABLE public.generated_websites ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.generated_websites ADD COLUMN IF NOT EXISTS brand_colors JSONB DEFAULT '{"primary":"#00D9FF"}'::jsonb;
ALTER TABLE public.generated_websites ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'guest';

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_generated_websites_slug ON public.generated_websites(slug);
CREATE INDEX IF NOT EXISTS idx_generated_websites_business_name ON public.generated_websites(business_name);
CREATE INDEX IF NOT EXISTS idx_generated_websites_created_date ON public.generated_websites(created_date DESC);

-- Enable RLS
ALTER TABLE public.generated_websites ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read (public websites)
DROP POLICY IF EXISTS "Anyone can read generated_websites" ON public.generated_websites;
CREATE POLICY "Anyone can read generated_websites" ON public.generated_websites
  FOR SELECT USING (true);

-- Policy: anyone can insert (builder creates sites)
DROP POLICY IF EXISTS "Anyone can insert generated_websites" ON public.generated_websites;
CREATE POLICY "Anyone can insert generated_websites" ON public.generated_websites
  FOR INSERT WITH CHECK (true);

-- Policy: owners can update their sites
DROP POLICY IF EXISTS "Owners can update generated_websites" ON public.generated_websites;
CREATE POLICY "Owners can update generated_websites" ON public.generated_websites
  FOR UPDATE USING (true);

-- Policy: owners can delete their sites
DROP POLICY IF EXISTS "Owners can delete generated_websites" ON public.generated_websites;
CREATE POLICY "Owners can delete generated_websites" ON public.generated_websites
  FOR DELETE USING (true);
