-- Migration 006: Full-text search index on articles
-- Run this in Supabase dashboard > SQL Editor for better search performance.
-- The API currently uses ilike and works without this index.
-- Applying this index makes search significantly faster at scale.

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(meta_description, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS articles_fts_idx ON articles USING GIN (fts);
