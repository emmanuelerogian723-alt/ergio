-- ERGIO Memory System Tables (v5.2)
-- 3-Layer Memory: Durable Facts, Procedural Skills, Session Search

-- Layer 1: Durable Facts
CREATE TABLE IF NOT EXISTS ergio_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fact TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_memory_business ON ergio_memory(business_id);
CREATE INDEX IF NOT EXISTS idx_memory_category ON ergio_memory(category);
CREATE INDEX IF NOT EXISTS idx_memory_created ON ergio_memory(created_at DESC);

-- Layer 2: Procedural Skills
CREATE TABLE IF NOT EXISTS ergio_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    trigger TEXT DEFAULT '',
    verification TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_skills_name ON ergio_skills(name);

-- Layer 3: Session Search
CREATE TABLE IF NOT EXISTS ergio_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_business ON ergio_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON ergio_sessions(created_at DESC);

-- RLS Policies
ALTER TABLE ergio_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ergio_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE ergio_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own memory" ON ergio_memory
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage skills" ON ergio_skills
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own sessions" ON ergio_sessions
    FOR ALL USING (auth.uid() IS NOT NULL);
