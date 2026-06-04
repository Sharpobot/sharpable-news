-- Migration 007: Human-in-the-loop topic selection
-- Run in Supabase dashboard → SQL Editor

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS topic_options   JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS selected_topic  JSONB DEFAULT NULL;

-- topic_options: array of 3 objects [{topic, summary, category, angle, sourceName, sourceUrl}]
-- selected_topic: the option the admin chose
-- New status 'awaiting_topic_selection' is handled by the app (no DB enum constraint)
