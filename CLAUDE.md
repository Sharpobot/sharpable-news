# Sharpable News — Project Spec & Session Context

## What This Is
AI-powered Malay-language news publication. Automatically generates full editorial articles using a 7-agent Claude AI pipeline. Target audience: researchers, developers, decision-makers in Malaysia.

---

## Current Stack
- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (Postgres + RLS)
- **Background jobs:** Inngest v4 (orchestrates the AI pipeline)
- **AI:** Anthropic Claude API — model `claude-sonnet-4-5` via `@anthropic-ai/sdk`
- **Styling:** Tailwind CSS
- **Language:** Bahasa Malaysia throughout all UI and generated content

---

## Project Structure
```
sharpable-news/
├── app/
│   ├── api/
│   │   └── inngest/route.js        # Inngest serve handler (GET/POST/PUT)
│   ├── admin/                      # Admin panel (password-protected)
│   └── ...                         # Public-facing pages (article listing, article page)
├── lib/
│   ├── agents/
│   │   ├── _client.js              # Shared Anthropic SDK helper (ask() function)
│   │   ├── trend-scout.js          # Agent 1: finds trending topics
│   │   ├── topic-selector.js       # Agent 2: picks best topic for Malaysian readers
│   │   ├── deep-researcher.js      # Agent 3: gathers key facts and sources
│   │   ├── article-writer.js       # Agent 4: writes full BM article
│   │   ├── seo-metadata.js         # Agent 5: generates slug, meta, tags
│   │   ├── image-brief.js          # Agent 6: prepares hero image brief + Unsplash query
│   │   ├── quality-checker.js      # Agent 7: QA pass, scores 0-100, gives verdict
│   │   └── test.js                 # Standalone test runner for all agents
│   ├── db/
│   │   └── supabase-admin.js       # Admin Supabase client (service role, server-only)
│   ├── inngest.js                  # Inngest client
│   ├── inngest-functions.js        # generateArticle Inngest function (7 steps + save)
│   └── functions/
│       └── test-connection.js      # Test Inngest function
├── .env.local                      # Local secrets (never commit)
└── CLAUDE.md                       # This file
```

---

## Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xymbpgyrdwlqpclwanol.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase anon key (safe for browser)
SUPABASE_SERVICE_ROLE_KEY=          # Supabase service role (server-only, bypasses RLS)
ANTHROPIC_API_KEY=                  # Anthropic API key (paid account — sk-ant-api03-...)
GEMINI_API_KEY=                     # Old Gemini key (no longer used, can ignore)
ADMIN_PASSWORD=sharpable2025        # Admin panel password
INNGEST_DEV=1                       # Enables Inngest dev mode
```
**Never commit `.env.local` — it is in `.gitignore`.**

**Supabase project ID:** `xymbpgyrdwlqpclwanol` (used in Supabase dashboard URL)

---

## Supabase Schema (key tables)

### `articles`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| title | text | First headline from article-writer |
| slug | text | URL slug from seo-metadata |
| body | text | Full article HTML/markdown |
| meta_description | text | SEO description |
| headline_options | text[] | All 3 headline variants |
| tags | text[] | SEO tags |
| image_brief | text | Hero image description + Unsplash query |
| quality_flags | jsonb | verdict, overall_score, publish_readiness, required_fixes, checks |
| sources | jsonb[] | [{title, description}] from research brief |
| status | text | `generating` → `ready_to_review` → `published` |
| created_at | timestamptz | |

### `article_generation_progress`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| article_id | uuid | FK to articles |
| agent_name | text | e.g. `trend-scout`, `article-writer` |
| status | text | `running` \| `done` \| `failed` |
| message | text | Human-readable status message in BM |
| created_at | timestamptz | |

**Important:** Both tables use RLS. All server-side writes (from Inngest functions and API routes) must use `createAdminSupabaseClient()` (service role key) — never the anon client. The browser-side admin panel can use the anon client for reads only.

---

## How the AI Pipeline Works

**Trigger:** Someone calls `POST /api/generate` (or sends an Inngest event directly)
→ Creates a blank `articles` row with `status = 'generating'`
→ Fires Inngest event `article/generate` with `{ articleId }`

**Inngest runs these 8 steps in sequence:**
1. `trend-scout` — finds trending topics (returns `trends[]`)
2. ⏳ 65s sleep (rate-limit protection between Claude calls)
3. `topic-selector` — picks best topic for Malaysian audience
4. ⏳ 65s sleep
5. `deep-researcher` — gathers facts, sources, key data
6. ⏳ 65s sleep
7. `article-writer` — writes the full BM article (headlines, body, wordCount)
8. ⏳ 65s sleep
9. `seo-metadata` — generates slug, metaDescription, tags
10. ⏳ 65s sleep
11. `image-brief` — prepares hero image description + Unsplash search query
12. ⏳ 65s sleep
13. `quality-checker` — scores article 0–100, gives verdict (publish/review/reject)
14. `save-article` — writes all outputs to Supabase, sets `status = 'ready_to_review'`

**Total runtime:** ~9–10 minutes per article.

**Inngest function config:**
- Function ID: `generate-article`
- Trigger event: `article/generate`
- Retries: `1` (Inngest will retry the whole function once on failure)
- The event payload must be: `{ name: "article/generate", data: { articleId: "<uuid>" } }`

**Each agent step also writes to `article_generation_progress`** — one row inserted as `running` at start, updated to `done`/`failed` at end. This enables live progress tracking in the admin panel.

---

## The `ask()` Helper (`lib/agents/_client.js`)
All 7 agents use this single shared function — it handles everything:
- Calls `anthropic.messages.create()` with `claude-sonnet-4-5`, `max_tokens: 4096`
- Extracts JSON from the response (handles ` ```json ``` ` blocks or raw `{}`)
- Retries up to 3x on `429` (rate limit) or `529` (overloaded) with exponential backoff (5s, 10s, 20s)

```js
// Usage in any agent:
import { ask } from './_client.js'
const result = await ask(systemPrompt, userPrompt)
// result is parsed JSON object
```

---

## Running the Dev Servers
Two servers must run simultaneously:

**Terminal 1 — Next.js:**
```bash
cd "D:/ALIFF MC/Website Coding/sharpable-news"
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 — Inngest Dev Server:**
```bash
cd "D:/ALIFF MC/Website Coding/sharpable-news"
npx inngest-cli@latest dev
# Runs on http://localhost:8288
# Dashboard: http://localhost:8288/runs
```

---

## Sending a Test Event (bypass the broken Inngest UI Monaco editor)
The Inngest dev UI's Send Event JSON editor has a bug where pasting compact JSON results in `data: null`. Use the browser console instead:

```js
// Open http://localhost:8288 in Chrome, open DevTools console, paste:
fetch('http://localhost:8288/e/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'article/generate',
    data: { articleId: 'YOUR-ARTICLE-UUID-HERE' }
  })
}).then(r => r.json()).then(console.log)
```
Then create a test article row in Supabase SQL editor first:
```sql
INSERT INTO articles (slug, status) VALUES ('test-artikel', 'generating') RETURNING id;
```
Use the returned `id` as `articleId` in the fetch above.

---

## Key Decisions & Fixes (session history)

### Why Inngest?
Normal web requests time out after ~30s. The 7-agent pipeline takes ~10 minutes. Inngest runs it as a background job with automatic retries, step isolation, and the dev dashboard for observability.

### Why Anthropic instead of Gemini?
Originally built with Google Gemini (free tier). The free tier caused:
- Silent request hangs (no timeout, ran for 27+ minutes)
- Quota exhaustion with no graceful error

Switched to Anthropic paid API. Completely resolved all hanging issues. The 65s sleeps between agents are a leftover precaution (they also help avoid any accidental rate limits on Claude).

### Model name gotcha
`claude-sonnet-4-20250514` does NOT exist — returns a 404. The correct model ID is `claude-sonnet-4-5`. Always use exact model IDs from the Anthropic docs.

### Admin password
`sharpable2025` — stored in `ADMIN_PASSWORD` env var, checked in admin middleware.

---

## What Has Been Completed

- [x] Next.js 15 project setup with Tailwind
- [x] Supabase schema (`articles` + `article_generation_progress` tables)
- [x] Admin panel at `/admin` (password-protected via middleware, "Artikel Baru AI" button fully wired to API)
- [x] Inngest integration (client + dev server + route handler)
- [x] All 7 AI agents (trend-scout → quality-checker) using Anthropic Claude
- [x] Full `generateArticle` Inngest function with 65s rate-limit spacing
- [x] Live progress rows written to `article_generation_progress` per agent
- [x] End-to-end test: pipeline completes, saves article to Supabase ✅
- [x] `app/api/generate/route.js` — POST: creates article row + fires Inngest event
- [x] `app/api/progress/route.js` — GET: returns live agent progress rows for an articleId
- [x] `app/api/articles/route.js` — GET: returns all articles for admin table
- [x] Live progress tracker in admin panel — polls every 3s, shows all 7 agents with spinner/checkmark/message

---

## What Is Next (in order)

### Next task (not started):
**"Create the article editor view at `app/admin/editor/[id]/page.js`"**

Specifically:
1. Load article from Supabase by `id`
2. **Headline picker** — 3 AI-generated `headline_options` as radio buttons + free text field
3. **TipTap rich text editor** — pre-loaded with `article.body`
4. **Image section** — show `image_brief` description + placeholder upload area
5. **Sidebar** — editable SEO fields: `slug`, `meta_description`, `tags`
6. **Quality flags panel** — show issues from `quality_flags` (verdict, score, required_fixes)
7. **Sources list** — read-only list from `sources` field
8. **Save as Draft** and **Publish Now** buttons — update article in Supabase
9. **Link from admin article list** — articles with `status = 'ready_to_review'` should link to this editor

**Also needed:**
- `app/api/articles/[id]/route.js` — GET + PATCH for single article (fetch + save)
- Install TipTap: `npm install @tiptap/react @tiptap/pm @tiptap/starter-kit`

### Future tasks (after above):
- Public article listing page
- Public article detail page (render `body` content)
- Image fetching from Unsplash using `image_brief`
- Scheduled article generation (cron via Inngest)
- Article editor / approval flow before publishing

---

## Design System (for all UI)

**Tone:** Calm, mature, authoritative. MIT Tech Review meets The Economist.

**Typography:**
- Headlines: `Fraunces` (variable serif)
- Body/UI: `DM Sans`
- Sizes: hero `clamp(30px,3.8vw,50px)` → section titles ~24px → body 14–16px

**Color palette (dark editorial):**
```
--bg: #0c0b0a
--bg-2: #111010
--bg-card: #161412
--text-1: #ede8df      (primary)
--text-2: #8c857c      (secondary)
--text-3: #56514d      (meta/muted)
--accent: #d4a853      (amber gold — use sparingly)
--border: rgba(237,232,223,0.07)
--border-mid: rgba(237,232,223,0.11)
```

**Avoid:** Purple gradients, neon, rounded cards (max 4px radius), flashy animations, Inter/Roboto/system fonts, AI-slop aesthetics.

**Category tag colours:**
- Penyelidikan: `#5a9ee0` (blue)
- Analisis: `#c97c42` (amber)
- Permulaan: `#50aa70` (green)
- Dasar: `#c84c6a` (rose)
- Alatan: `#9070cc` (violet)
- Industri: `#c4a030` (gold)

**All UI text in Bahasa Malaysia** — natural editorial tone, not direct translation.
