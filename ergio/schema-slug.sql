-- Add slug column to generated_websites table
ALTER TABLE generated_websites ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE generated_websites ADD COLUMN IF NOT EXISTS website_category TEXT DEFAULT 'landing';
CREATE INDEX IF NOT EXISTS idx_generated_websites_slug ON generated_websites(slug);

-- Also create mcp_servers table
CREATE TABLE IF NOT EXISTS mcp_servers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  plugin_id TEXT DEFAULT 'custom',
  transport TEXT DEFAULT 'sse',
  command TEXT,
  args JSONB DEFAULT '[]',
  url TEXT,
  env_vars JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  tools JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
