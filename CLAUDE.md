# Sharpable News — Complete Project Reference

## What This Is
AI-powered Bahasa Malaysia news publication. Automatically generates full editorial articles using an 8-agent Claude AI pipeline. Target audience: researchers, developers, decision-makers in Malaysia. You are the editor — you review and publish AI-generated articles through a full admin panel.

---

## Current Stack
- **Framework:** Next.js 15 (App Router) — server + client components
- **Database:** Supabase (Postgres + RLS) — project ID `xymbpgyrdwlqpclwanol`
- **Background jobs:** Inngest v4 — orchestrates the AI pipeline (runs on port 8288 in dev)
- **AI:** Anthropic Claude API — model `claude-sonnet-4-5` via `@anthropic-ai/sdk`
- **Rich text editor:** TipTap (with `@tiptap/extension-image`, `@tiptap/starter-kit`)
- **Image cropping:** `react-image-crop`
- **Animations:** Framer Motion
- **Styling:** Tailwind CSS + inline styles (dark editorial design system)
- **Language:** Bahasa Malaysia throughout all UI and generated content

---

## Running the Dev Servers

Two terminals must run simultaneously:

**Terminal 1 — Next.js (port 3000):**
```bash
cd "D:/ALIFF MC/Website Coding/sharpable-news"
npm run dev
```

**Terminal 2 — Inngest dev server (port 8288):**
```bash
cd "D:/ALIFF MC/Website Coding/sharpable-news"
npx inngest-cli@latest dev
```

Admin panel: `http://localhost:3000/admin` — password: `sharpable2025`
Inngest dashboard: `http://localhost:8288/runs`

---

## Environment Variables (`.env.local` — never commit)
```
NEXT_PUBLIC_SUPABASE_URL=https://xymbpgyrdwlqpclwanol.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase anon key (safe for browser)
SUPABASE_SERVICE_ROLE_KEY=          # Supabase service role (server-only, bypasses RLS)
ANTHROPIC_API_KEY=                  # Anthropic API key — sk-ant-api03-...
ADMIN_PASSWORD=sharpable2025        # Admin panel password
INNGEST_DEV=1                       # Enables Inngest dev mode
```

---

## Project Structure (complete)
```
sharpable-news/
├── app/
│   ├── page.js                         # Public homepage — article listing grid
│   ├── HomePageClient.js               # Client component for homepage
│   ├── artikel/[slug]/page.js          # Public article detail page
│   ├── admin/
│   │   ├── layout.js                   # Admin layout wrapper (sidebar + auth check)
│   │   ├── page.js                     # Papan Pemuka (dashboard) server page
│   │   ├── AdminClient.js              # Dashboard client — metrics strip, 7-day bar chart
│   │   ├── AdminSidebar.js             # Sidebar nav + light/dark theme toggle + logout modal
│   │   ├── loading.js                  # Dashboard skeleton (instant tab switching)
│   │   ├── artikel/
│   │   │   ├── page.js                 # Article list server page
│   │   │   ├── ArtikelClient.js        # Article table — status badges, edit links, filters
│   │   │   └── loading.js              # Skeleton loader
│   │   ├── jana/
│   │   │   ├── page.js                 # Generate article server page
│   │   │   ├── JanaClient.js           # Live progress tracker — polls every 3s
│   │   │   └── loading.js              # Skeleton loader
│   │   ├── editor/[id]/
│   │   │   ├── page.js                 # Article editor server page
│   │   │   └── EditorClient.js         # Full TipTap editor with all features (see below)
│   │   ├── tetapan/
│   │   │   └── page.js                 # Settings page — system info, pipeline overview
│   │   └── login/
│   │       ├── page.js                 # Login page
│   │       └── LoginClient.js          # Login form client component
│   └── api/
│       ├── inngest/route.js            # Inngest serve handler (GET/POST/PUT)
│       ├── generate/route.js           # POST: creates article row + fires Inngest event
│       ├── progress/route.js           # GET: returns live progress rows by articleId
│       ├── articles/
│       │   ├── route.js                # GET: all articles for admin table
│       │   └── [id]/route.js           # GET + PATCH + DELETE for single article
│       ├── upload-image/route.js       # POST: uploads featured hero image to Supabase Storage
│       └── upload-inline-image/route.js # POST: uploads inline article image to Supabase Storage
│
├── components/
│   └── admin/
│       └── ConfirmationModal.js        # Reusable "are you sure?" modal (icon badge, spring anim)
│
├── lib/
│   ├── agents/
│   │   ├── _client.js                  # Shared Claude API helper: ask() + askWithSearch()
│   │   ├── style-guide.js              # Editorial style rules injected into article-writer
│   │   ├── trend-scout.js              # Agent 1: finds trending topics via web search
│   │   ├── topic-selector.js           # Agent 2: picks best topic, deduplicates vs last 30 articles
│   │   ├── deep-researcher.js          # Agent 3: gathers facts via web search
│   │   ├── article-writer.js           # Agent 4: writes full BM article (injects STYLE_GUIDE)
│   │   ├── seo-metadata.js             # Agent 5: generates slug, meta description, tags
│   │   ├── image-brief.js              # Agent 6: Midjourney-style prompt + Unsplash query
│   │   ├── quality-checker.js          # Agent 7: fact-checks via web search, scores 0-100
│   │   └── revision.js                 # Agent 7b: fixes issues found by quality-checker
│   ├── db/
│   │   └── supabase-admin.js           # Admin Supabase client (service role, server-only)
│   ├── inngest.js                      # Inngest client init
│   └── inngest-functions.js            # generateArticle — orchestrates all 8 agents + save
│
├── supabase/migrations/                # SQL migration files
├── .env.local                          # Local secrets (never commit)
└── CLAUDE.md                           # This file
```

---

## Supabase Schema

### `articles` table
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| title | text | First headline (picked from headline_options) |
| slug | text | URL slug from seo-metadata |
| body | jsonb/text | Full TipTap JSON body |
| meta_description | text | SEO description |
| headline_options | text[] | All 3 AI-generated headline variants |
| tags | text[] | SEO tags |
| image_brief | text | `{prompt} \| Query: {unsplashQuery}` |
| featured_image | text | URL of uploaded hero image (Supabase Storage) |
| quality_flags | jsonb | `{verdict, overall_score, publish_readiness, required_fixes, checks{}, corrections_made[]}` |
| original_quality_flags | jsonb | Pre-revision quality report (optional, migration 003) |
| similar_articles | jsonb | Articles that were too similar during dedup (optional, migration 004) |
| sources | jsonb[] | `[{title, description}]` from research brief |
| status | text | `generating` → `ready_to_review` → `published` → `draft` |
| created_at | timestamptz | |

### `article_generation_progress` table
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| article_id | uuid | FK to articles |
| agent_name | text | `trend-scout`, `topic-selector`, ..., `save-article` |
| status | text | `running` \| `done` \| `failed` |
| message | text | Human-readable BM status message |
| created_at | timestamptz | |

**Rule:** All server-side writes use `createAdminSupabaseClient()` (service role). Browser reads use anon client only.

### Supabase Storage
- Bucket: `article-images` — stores both hero images and inline article images
- Hero images uploaded via `/api/upload-image`
- Inline images uploaded via `/api/upload-inline-image`

---

## AI Pipeline — Complete Flow

**Trigger:** `POST /api/generate` → creates blank article row (`status: generating`) → fires Inngest event `article/generate`

**Pipeline steps in `inngest-functions.js`:**

| Step | Agent | Sleep after | What it does |
|---|---|---|---|
| 1 | `trend-scout` | 65s | Web search for trending AI/tech topics (last 48h) |
| 2 | `topic-selector` | 65s | Picks best topic; checks last 30 published for duplicates; retries up to 3x if all topics are duplicates |
| 3 | `deep-researcher` | 65s | Web search for facts, key players, timeline, Malaysian context |
| 4 | `article-writer` | 65s | Writes 600–800 word BM article in TipTap JSON format; uses STYLE_GUIDE |
| 5 | `seo-metadata` | 65s | Slug, meta description, tags |
| 6 | `image-brief` | 65s | Midjourney-style image prompt + Unsplash fallback query |
| 7 | `quality-checker` | — (or 65s if revision needed) | Fact-checks via web search, scores 1–100, verdict: publish/review/reject |
| 7b | `revision-agent` | — | Only runs if verdict ≠ publish; fixes flagged issues, lists corrections |
| 8 | `save-article` | — | Saves everything to Supabase, status → `ready_to_review` |

**Each step writes a progress row** (`running` on start, `done`/`failed` on end) — including `save-article`.

**Total runtime:** ~9–10 minutes per article.

**Topic dedup:** topic-selector receives last 30 published articles' titles+slugs. If all trending topics are too similar to recent articles, sets `isDuplicate: true`. Orchestrator retries with fresh trends up to 3 times total before marking article as `failed`.

---

## The Agent Helpers (`lib/agents/_client.js`)

```js
ask(systemPrompt, userPrompt, maxTokens = 4096)
// → calls Claude, extracts JSON from response, retries 3x on 429/529

askWithSearch(systemPrompt, userPrompt, maxTokens = 4096)
// → same but with web_search_20250305 tool enabled (live internet)
```

Agents using `askWithSearch`: trend-scout, deep-researcher, quality-checker
Agents using `ask`: topic-selector, article-writer, seo-metadata, image-brief, revision

**Important:** quality-checker uses `maxTokens: 2500` (not default 4096) — raised from 1200 because web search synthesis + JSON output was being truncated.

---

## Context Flow Between Agents

Each agent receives the full `context` object from all previous agents and adds its own output:
```
{} 
→ { trends, scoutedAt }
→ { trends, scoutedAt, selectedTopic, articleAngle, isDuplicate, similarArticles }
→ { ...above, researchBrief }
→ { ...above, article }
→ { ...above, seo }
→ { ...above, images }
→ { ...above, qualityReport, qualityPassed }
→ { ...above, revisionCorrectionsMade }  ← only if revision ran
```

The `save-article` step reads from `ctxFinal` which is the final merged context.

---

## Article Editor (`app/admin/editor/[id]/EditorClient.js`)

The editor is the most complex file in the codebase. Features:

- **Headline picker:** 3 radio options (AI-generated) + custom text input
- **TipTap editor:** `StarterKit` + `Image` extension. Images constrained to 100%/500px max-height.
- **Image toolbar:** Appears as horizontal overlay on bottom of selected image when clicked.
  - ↑↓ move image up/down between paragraphs
  - ✏ Edit — reopens InlineImageModal pre-filled with current src/alt/caption
  - × Remove — shows ConfirmationModal before deleting
- **InlineImageModal:** Upload tab or URL tab. Square preview container. ReactCrop available for uploaded files (optional crop). Upload happens lazily on insert (not on file select). Supports insert + edit modes.
- **Featured image (hero):** Drag-drop or click-to-upload. CropModal forces 16:9 (1280×720 output). Stored in Supabase Storage.
- **AI image brief:** Shown as sidebar card on desktop, bottom sheet on mobile.
- **SEO sidebar:** Editable slug, meta description, tag chips.
- **Quality report panel:** Collapsible. Shows verdict, score, required fixes, corrections made, original pre-revision report if available.
- **Sources list:** Read-only list with `<cite>` tags stripped from descriptions.
- **Save buttons:** "Simpan Draf" (status: draft) and "Terbit Sekarang" (status: published, with ConfirmationModal).
- **Mobile:** Tab-based layout (Kandungan / SEO & Meta / Semakan). Floating save buttons hidden on mobile (in tabs instead).
- **Dirty state:** Tracks unsaved changes, shows amber dot, warns on navigation away.

---

## Admin Panel Pages

| Page | Route | What it does |
|---|---|---|
| Dashboard | `/admin` | Metrics strip (published/draft/generating/7-day), 7-day bar chart, 5 recent articles |
| Articles | `/admin/artikel` | Table of all articles with status, created date, edit link |
| Generate | `/admin/jana` | "Jana Artikel Baru" button + live pipeline progress cards |
| Editor | `/admin/editor/[id]` | Full article editor (see above) |
| Settings | `/admin/tetapan` | System info, pipeline agent descriptions, config values |

All admin pages support **light and dark mode** via `admin-theme-change` custom event dispatched by AdminSidebar. CSS variables switch via a `lm` boolean state. Loading skeletons exist for instant tab-switching feedback.

---

## Design System

**Tone:** Calm, mature, authoritative. MIT Tech Review meets The Economist.

**Typography:**
- Headlines/display: `Fraunces` (variable serif)
- Body/UI: `DM Sans`

**Color palette (dark mode default):**
```
--bg:        #0c0b0a
--bg-2:      #111010
--bg-card:   #161412
--text-1:    #ede8df   (primary)
--text-2:    #8c857c   (secondary)
--text-3:    #56514d   (meta/muted)
--accent:    #d4a853   (amber gold — use sparingly)
--border:    rgba(237,232,223,0.07)
--border-mid:rgba(237,232,223,0.11)
```

**Light mode equivalent:** bg `#f5f3f0`, surface `#ffffff`, text `#18150f`, etc. — all pages support both modes.

**Rules:**
- Max border-radius: 8px on cards, 4px on inputs/small elements
- No purple gradients, no neon, no Inter/Roboto/system fonts
- Animations: Framer Motion spring (stiffness ~480, damping ~34) for modals; subtle `fadeIn`/`slideUp` for page content
- All UI copy in Bahasa Malaysia

**Category tag colours:**
- Penyelidikan: `#5a9ee0` (blue) | Analisis: `#c97c42` (amber) | Permulaan: `#50aa70` (green)
- Dasar: `#c84c6a` (rose) | Alatan: `#9070cc` (violet) | Industri: `#c4a030` (gold)

---

## Key Bugs Fixed (session history — important to know)

### Generation timing glitch (FIXED)
**Symptom:** Article left Jana tab with "done" toast before save completed; article showed no title, still in "generating" status.
**Root cause:** JanaClient polling declared done when quality-checker/revision-agent finished, but save-article runs after with no progress row.
**Fix:** Added `startProgress`/`endProgress` calls for `save-article` step in `inngest-functions.js`. Added `save-article` to `AGENTS` array in `JanaClient.js` as required (non-optional).

### Quality score showing 0/100 (FIXED)
**Root cause:** `quality-checker.js` was calling `askWithSearch` with `maxTokens: 1200`. Web search synthesis + full JSON output exceeded this, truncating the response. `parseJSON` fell back to `{ raw: text }` → `result.overallScore = undefined` → `result.verdict = undefined → 'reject'` → floor returned 0.
**Fix:** Raised `maxTokens` to 2500. Added floor: publish→82, review→65, reject→35 (never 0). Added explicit scoring rules to system prompt.

### `<cite>` tags in sources (FIXED)
**Symptom:** Source descriptions showed raw `<cite index="...">...</cite>` XML from Anthropic's web search API.
**Fix:** `.replace(/<cite[^>]*>(.*?)<\/cite>/gi, '$1')` applied in EditorClient sources display.

### `childCount` JS crash in editor (FIXED)
**Symptom:** `Cannot read properties of undefined (reading 'childCount')` on every blur/focus/drop event in TipTap.
**Root cause:** `$pos.node($pos.depth - 1)` returns undefined when selection depth < 1.
**Fix:** Guard with `if (depth < 1) { setImgMove(null); return }` and `if (!parent) { setImgMove(null); return }`.

### Inline image squishing on public page (FIXED)
**Fix:** `.article-figure img { width: auto; max-width: 100%; height: auto; margin: 0 auto 8px }` in `globals.css`.

### Mobile metrics overflow (FIXED)
**Fix:** `!important` overrides on `.metrics-strip > div` in `AdminClient.js` since MetricCell uses inline `flex:1`.

### Optional DB columns missing (FIXED)
**Symptom:** `save-article` step threw on columns `original_quality_flags` and `similar_articles` (migrations 003/004 not applied).
**Fix:** Two-phase save in `inngest-functions.js` — core fields in one UPDATE (throws on failure), optional fields in separate UPDATE (errors swallowed with console.warn).

---

## Important Rules / Gotchas

1. **Never use the anon Supabase client for server-side writes** — always `createAdminSupabaseClient()` (service role key).
2. **Model ID is `claude-sonnet-4-5`** — not `claude-sonnet-4-20250514` (returns 404).
3. **Inngest MUST be running on port 8288** for article generation to work. `POST /api/generate` fires the Inngest event; without the dev server, nothing runs.
4. **`maxTokens` in agent calls** — quality-checker needs 2500. Don't lower it. Other agents use default 4096.
5. **TipTap body format** — article body is stored as TipTap JSON (not HTML). `editor.getHTML()` returns HTML for save; the DB stores JSON. Both are used in different contexts.
6. **`!important` in media queries for admin** — MetricCell and other components use inline styles that CSS media queries can't override without `!important`.
7. **65s sleeps between agents** — intentional rate-limit protection. Do not remove.
8. **Image uploads** — go to Supabase Storage bucket `article-images`. Two separate endpoints: `/api/upload-image` (hero, 16:9 crop) and `/api/upload-inline-image` (inline, free crop).

---

## What Is Complete

- [x] Full public website (homepage, article pages, responsive)
- [x] Full admin panel (dashboard, article list, generator, editor, settings)
- [x] All 8 AI agents fully implemented and working
- [x] Article generation pipeline (Inngest) end-to-end
- [x] Live generation progress tracking
- [x] TipTap article editor with image upload, crop, inline images
- [x] Inline image toolbar (move up/down, edit, remove)
- [x] Featured hero image upload with 16:9 crop
- [x] SEO fields editor
- [x] Quality report panel (collapsible, shows score/verdict/fixes/corrections)
- [x] Sources list (cite tags stripped)
- [x] Light/dark mode across all admin pages
- [x] Loading skeletons for admin tabs
- [x] Confirmation modals (logout, publish, remove image, remove inline image)
- [x] Dirty state tracking + unsaved changes warning
- [x] Topic deduplication with retry logic
- [x] Style guide injected into article writer

## What Could Be Next (not started)

- [ ] Scheduled article generation (cron via Inngest — auto-generate on a schedule)
- [ ] Unsplash API integration (auto-fetch hero image from `image_brief` Unsplash query)
- [ ] Article search / filter on public homepage
- [ ] Category pages on public site
- [ ] Reading time display on articles
- [ ] Analytics (page views, most read)
- [ ] Multiple admin users / role-based access
- [ ] Email notification when article is ready to review
