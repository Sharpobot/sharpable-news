-- Add featured_image column to articles
-- Run in: Supabase Dashboard → SQL Editor

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS featured_image text;
