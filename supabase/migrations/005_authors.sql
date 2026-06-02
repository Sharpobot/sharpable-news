-- Migration 005: Authors table + article FK

CREATE TABLE IF NOT EXISTS authors (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  bio        text,
  photo_url  text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES authors(id) ON DELETE SET NULL;
