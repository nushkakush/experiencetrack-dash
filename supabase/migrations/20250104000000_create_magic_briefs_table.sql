-- Create magic_briefs table for storing AI-generated brand challenges
CREATE TABLE IF NOT EXISTS magic_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  challenge_statement TEXT NOT NULL,
  connected_learning_outcomes TEXT[] DEFAULT '{}',
  skill_focus TEXT,
  challenge_order INTEGER DEFAULT 1,
  prerequisite_skills TEXT,
  skill_compounding TEXT,
  epic_id UUID NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expanded BOOLEAN DEFAULT FALSE,
  expanded_experience_id UUID REFERENCES experiences(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_magic_briefs_epic_id ON magic_briefs(epic_id);
CREATE INDEX IF NOT EXISTS idx_magic_briefs_created_by ON magic_briefs(created_by);
CREATE INDEX IF NOT EXISTS idx_magic_briefs_created_at ON magic_briefs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_magic_briefs_expanded ON magic_briefs(expanded);
CREATE INDEX IF NOT EXISTS idx_magic_briefs_challenge_order ON magic_briefs(epic_id, challenge_order);

-- Enable RLS (Row Level Security)
ALTER TABLE magic_briefs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view magic briefs" ON magic_briefs
  FOR SELECT USING (true);

CREATE POLICY "Users can create magic briefs" ON magic_briefs
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own magic briefs" ON magic_briefs
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own magic briefs" ON magic_briefs
  FOR DELETE USING (auth.uid() = created_by);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_magic_briefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_magic_briefs_updated_at
  BEFORE UPDATE ON magic_briefs
  FOR EACH ROW
  EXECUTE FUNCTION update_magic_briefs_updated_at();
