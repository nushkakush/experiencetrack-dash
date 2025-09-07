-- Add raw_response column to magic_briefs table
ALTER TABLE magic_briefs 
ADD COLUMN IF NOT EXISTS raw_response JSONB;

-- Add index for raw_response queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_magic_briefs_raw_response ON magic_briefs USING GIN (raw_response);

-- Add comment to document the column
COMMENT ON COLUMN magic_briefs.raw_response IS 'Raw AI response data from Perplexity/OpenAI for debugging and analysis';
