-- Add similar_articles column to track which existing articles were
-- considered too similar during topic deduplication (audit trail)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS similar_articles jsonb;
