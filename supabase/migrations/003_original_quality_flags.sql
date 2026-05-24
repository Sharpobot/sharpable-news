-- Migration 003: Add original_quality_flags column
-- Stores the first quality check result before revision agent runs.
-- This lets the editor see what the original issues were vs what was fixed.

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS original_quality_flags jsonb;
