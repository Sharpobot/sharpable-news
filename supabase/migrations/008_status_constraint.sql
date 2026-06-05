-- Migration 008: Update articles status CHECK constraint
-- Adds 'failed' and 'awaiting_topic_selection' to the allowed status values.
-- Run in: Supabase Dashboard → SQL Editor

DO $$
DECLARE
  c_name text;
BEGIN
  -- Find the existing status check constraint by inspecting its definition
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.articles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';

  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.articles DROP CONSTRAINT %I', c_name);
  END IF;
END $$;

ALTER TABLE public.articles
  ADD CONSTRAINT articles_status_check
  CHECK (status IN (
    'generating',
    'ready_to_review',
    'draft',
    'published',
    'failed',
    'awaiting_topic_selection'
  ));
