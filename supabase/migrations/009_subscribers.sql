-- Migration 009: Subscribers table for email newsletter signups
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text default 'homepage',
  subscribed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists subscribers_email_idx on subscribers (email);

alter table subscribers enable row level security;

-- No public policies — only the service role (server-side) can read/write.
