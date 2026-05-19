-- ============================================================
-- Sharpable News — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================


-- ── 1. articles ─────────────────────────────────────────────
create table public.articles (
  id                  uuid primary key default gen_random_uuid(),

  -- Core content
  title               text,
  slug                text not null unique,
  body                jsonb,                        -- rich text (e.g. Tiptap/ProseMirror JSON)
  meta_description    text,
  image_brief         text,                         -- prompt/brief for the article image

  -- Publishing
  status              text not null default 'generating'
                      check (status in ('generating', 'ready_to_review', 'draft', 'published')),

  -- AI generation outputs
  headline_options    jsonb,                        -- array of 3 headline strings
  tags                text[],                       -- e.g. ['penyelidikan', 'openai']
  quality_flags       jsonb,                        -- e.g. {"factual_risk": true, "needs_editor": false}
  sources             jsonb,                        -- array of {url, title, accessed_at}

  -- Timestamps
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Indexes
create index articles_status_idx  on public.articles (status);
create index articles_tags_idx    on public.articles using gin (tags);
create index articles_created_idx on public.articles (created_at desc);


-- ── 2. article_generation_progress ──────────────────────────
create table public.article_generation_progress (
  id           uuid primary key default gen_random_uuid(),
  article_id   uuid not null references public.articles (id) on delete cascade,
  agent_name   text not null,                       -- e.g. 'researcher', 'writer', 'editor'
  status       text not null default 'pending'
               check (status in ('pending', 'running', 'done', 'failed')),
  message      text,                                -- human-readable status / error detail
  updated_at   timestamptz not null default now()
);

-- Index for fast lookups per article
create index agp_article_id_idx on public.article_generation_progress (article_id);


-- ── 3. Auto-update updated_at on row change ─────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger articles_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

create trigger agp_updated_at
  before update on public.article_generation_progress
  for each row execute function public.set_updated_at();


-- ── 4. Row-Level Security ────────────────────────────────────
-- Enable RLS (blocks all access by default until policies are added)
alter table public.articles                  enable row level security;
alter table public.article_generation_progress enable row level security;

-- Public read policy for published articles
create policy "Published articles are publicly readable"
  on public.articles for select
  using (status = 'published');

-- NOTE: Add authenticated/service-role write policies here
-- when you set up auth or your AI generation pipeline.
-- Example:
--   create policy "Service role can do anything"
--     on public.articles for all
--     using (auth.role() = 'service_role');
