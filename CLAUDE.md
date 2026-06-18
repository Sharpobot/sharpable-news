# Sharpable News — Complete Project Reference

## What This Is
AI-powered Bahasa Malaysia news publication. Automatically generates full editorial articles using a 9-agent Claude AI pipeline. Target audience: researchers, developers, decision-makers in Malaysia. You are the editor — you review and publish AI-generated articles through a full admin panel.

---

## Current Stack
- **Framework:** Next.js 15 (App Router) — server + client components
- **Database:** Supabase (Postgres + RLS) — project ID `xymbpgyrdwlqpclwanol`
- **Background jobs:** Inngest v4.4.0 — orchestrates the AI pipeline (runs on port 8288 in dev)
- **AI:** Anthropic Claude API — model `claude-sonnet-4-5` via `@anthropic-ai/sdk`
- **Rich text editor:** TipTap (with `@tiptap/extension-image`, `@tiptap/starter-kit`, custom ImagePlaceholder extension)
- **Image cropping:** `react-image-crop`
- **Animations:** Framer Motion
- **Styling:** Tailwind CSS + inline styles (dark editorial design system)
- **Language:** Bahasa Malaysia throughout all UI and generated content
- **Deployment:** Netlify (`netlify.toml` present, not yet fully deployed)

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

**Important:** After any code changes to `inngest-functions.js` OR any agent file in `lib/agents/`, restart BOTH servers to ensure Inngest picks up the latest function definitions.

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
│   ├── page.js                          # Public homepage — article listing grid
│   ├── HomePageClient.js                # Client component — navbar, hero, article grid, footer
│   ├── layout.js                        # Root layout — includes PageLoader
│   ├── globals.css                      # Global styles, design tokens, animations
│   ├── components/
│   │   ├── PublicNavbar.js              # Shared navbar (homepage + article pages) — sticky, always dark, full-screen search
│   │   ├── Footer.js                    # Shared footer component used on all public pages
│   │   ├── RelatedArticles.js           # Related articles carousel (mobile) / grid (desktop)
│   │   ├── PageLoader.js                # Page transition overlay (intercepts link clicks)
│   │   └── AdminLoader.js              # Admin panel navigation overlay
│   ├── artikel/[slug]/page.js           # Public article detail page + related articles + footer
│   ├── admin/
│   │   ├── layout.js                    # Admin layout — AdminSidebar + AdminLoader
│   │   ├── page.js                      # Papan Pemuka (dashboard) server page
│   │   ├── AdminClient.js               # Dashboard client — metrics strip, 7-day bar chart
│   │   ├── AdminSidebar.js              # Sidebar nav + light/dark theme toggle + logout modal
│   │   ├── loading.js                   # Dashboard skeleton
│   │   ├── artikel/
│   │   │   ├── page.js                  # Article list server page
│   │   │   ├── ArtikelClient.js         # Article table — status badges (incl. awaiting_topic_selection), edit links, cancel button
│   │   │   └── loading.js
│   │   ├── jana/
│   │   │   ├── page.js                  # Generate article server page — fetches generating + awaiting_topic_selection articles
│   │   │   ├── JanaClient.js            # Two-step topic selection UI + live progress cards
│   │   │   └── loading.js
│   │   ├── editor/[id]/
│   │   │   ├── page.js                  # Article editor server page (fetches article + authors list)
│   │   │   ├── EditorClient.js          # Full TipTap editor with all features (see below)
│   │   │   └── ImagePlaceholderExtension.js  # Custom TipTap node for inline image suggestions
│   │   ├── penulis/
│   │   │   ├── page.js                  # Author management server page
│   │   │   ├── PenulisClient.js         # Author card grid, add/edit modal with crop, delete
│   │   │   └── loading.js
│   │   ├── tetapan/
│   │   │   └── page.js                  # Settings page
│   │   ├── langgan/
│   │   │   ├── page.js                  # Subscribers server page (fetches subscribers list)
│   │   │   └── LanggananClient.js       # Subscribers table — search, CSV export, delete (ConfirmationModal)
│   │   └── login/
│   │       ├── page.js
│   │       └── LoginClient.js
│   └── api/
│       ├── inngest/route.js             # Inngest serve handler (GET/POST/PUT)
│       ├── generate/route.js            # POST: (legacy) creates article row + fires Inngest event
│       ├── generate-topics/route.js     # POST: creates article (awaiting_topic_selection) + fires Inngest with topicDirection
│       ├── select-topic/route.js        # POST: fires topic/selected Inngest event with chosen option
│       ├── cancel-topic/route.js        # POST: deletes article + fires topic/selected with cancelled:true
│       ├── progress/route.js            # GET: returns progress rows + article status + topic_options by articleId
│       ├── search/route.js              # GET: public article search (?q=query) — max 5 results
│       ├── subscribe/route.js           # POST: public newsletter signup — inserts into subscribers table (service role client)
│       ├── articles/
│       │   ├── route.js                 # GET: all articles for admin table
│       │   └── [id]/route.js            # GET + PATCH + DELETE for single article
│       ├── authors/
│       │   ├── route.js                 # GET all authors + POST create
│       │   └── [id]/route.js            # PATCH + DELETE single author
│       ├── subscribers/
│       │   └── [id]/route.js            # DELETE single subscriber (admin)
│       ├── upload-image/route.js        # POST: uploads featured hero image to Supabase Storage
│       ├── upload-inline-image/route.js # POST: uploads inline article image to Supabase Storage
│       └── upload-author-photo/route.js # POST: uploads author profile photo to 'authors' bucket
│
├── components/
│   └── admin/
│       └── ConfirmationModal.js         # Reusable confirmation modal
│
├── lib/
│   ├── agents/
│   │   ├── _client.js                   # Shared Claude API helper: ask() + askWithSearch() — MAX_RETRIES=2, 90s timeout
│   │   ├── style-guide.js               # Editorial style rules + 10 BERNAMA reference articles
│   │   ├── trend-scout.js               # Agent 1: finds trending topics via web search (maxTokens: 3000)
│   │   ├── topic-selector.js            # Agent 2: returns 3 distinct topic OPTIONS for human selection (maxTokens: 1000)
│   │   ├── deep-researcher.js           # Agent 3: gathers facts + source URLs via web search (maxTokens: 3000)
│   │   ├── article-writer.js            # Agent 4: writes full BM article (maxTokens: 4000, injects STYLE_GUIDE)
│   │   ├── seo-metadata.js              # Agent 5: generates slug, meta description, tags (maxTokens: 1000)
│   │   ├── image-brief.js               # Agent 6: hero image prompt + 3 inline image suggestions (maxTokens: 1000)
│   │   ├── quality-checker.js           # Agent 7: fact-checks via web search, scores 1–100 (maxTokens: 2000)
│   │   └── revision.js                  # Agent 7b: fixes issues, aims to reach 85+ (maxTokens: 4000)
│   ├── db/
│   │   └── supabase-admin.js            # Admin Supabase client (service role, server-only)
│   ├── inngest.js                       # Inngest client init
│   └── inngest-functions.js             # generateArticle — orchestrates all agents + human topic selection + quality loop
│
├── scripts/
│   └── test-trend-scout.mjs             # Isolated test harness for trend-scout agent (loads .env.local manually)
│
├── supabase/migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_featured_image.sql
│   ├── 003_original_quality_flags.sql
│   ├── 004_similar_articles.sql
│   ├── 005_authors.sql                  # authors table + author_id FK on articles
│   ├── 006_fts_index.sql               # Optional: GIN index for full-text search performance
│   ├── 007_topic_selection.sql         # Adds topic_options (jsonb) + selected_topic (jsonb) columns to articles
│   ├── 008_status_constraint.sql       # Expands status CHECK to include 'failed' + 'awaiting_topic_selection'
│   └── 009_subscribers.sql             # Adds subscribers table for newsletter signups
├── netlify.toml                         # Netlify deployment config (not yet live)
├── .env.local                           # Local secrets (never commit)
└── CLAUDE.md                            # This file
```

---

## Supabase Schema

### `articles` table
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| title | text | First headline (picked from headline_options) |
| slug | text | URL slug from seo-metadata |
| body | jsonb/text | Full TipTap JSON body (may contain imagePlaceholder nodes) |
| meta_description | text | SEO description |
| headline_options | text[] | All 3 AI-generated headline variants |
| tags | text[] | SEO tags |
| image_brief | text | `{heroPrompt} \| Query: {unsplashQuery}` — shown as "Cadangan AI" in editor |
| featured_image | text | URL of uploaded hero image (Supabase Storage) |
| quality_flags | jsonb | `{verdict, overall_score, publish_readiness, required_fixes, checks{}, corrections_made[]}` |
| original_quality_flags | jsonb | Pre-revision quality report (migration 003) |
| similar_articles | jsonb | Articles too similar during dedup (migration 004) |
| sources | jsonb[] | `[{title, url, description}]` — url populated from web search |
| author_id | uuid | FK → authors.id ON DELETE SET NULL (migration 005) |
| topic_options | jsonb | Array of 3 topic options from topic-selector (migration 007) |
| selected_topic | jsonb | The topic option chosen by the admin (migration 007) |
| status | text | `generating` → `awaiting_topic_selection` → `generating` → `ready_to_review` → `published` → `draft` → `failed` |
| created_at | timestamptz | |

### `authors` table (migration 005)
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Author full name |
| bio | text | One-sentence bio |
| photo_url | text | URL in Supabase Storage 'authors' bucket |
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

### Supabase Storage Buckets
- `article-images` — hero images + inline article images
- `authors` — author profile photos

### Applied Migrations (all applied to production)
- 001–006: initial schema, featured image, quality flags, similar articles, authors, FTS index
- **007_topic_selection.sql** — adds `topic_options` + `selected_topic` jsonb columns
- **008_status_constraint.sql** — drops old CHECK constraint, adds expanded one allowing `failed` + `awaiting_topic_selection`
- **009_subscribers.sql** — creates `subscribers` table (email, source, subscribed_at, created_at) for newsletter signups; RLS enabled, no public policies (service role only)

---

## AI Pipeline — Complete Flow (with Human-in-the-Loop)

**Trigger:** `POST /api/generate-topics` → creates blank article row (`status: awaiting_topic_selection`) → fires Inngest event `article/generate` with `{ articleId, topicDirection }`

**Pipeline steps in `inngest-functions.js`:**

| Step | Agent/Action | Sleep after | What it does |
|---|---|---|---|
| 1 | `trend-scout` | 65s | Web search for trending AI/tech topics (last 48h); accepts optional `topicDirection` hint |
| 2 | `topic-selector` | — | Returns 3 distinct topic OPTIONS (different stories/angles) for human review |
| — | fail-fast guard | — | If 0 options returned → mark article `failed` immediately, throw |
| — | `save-topic-options` | — | Saves `topic_options` to DB; sets status → `awaiting_topic_selection` |
| — | `waitForEvent` | up to 24h | Pauses pipeline. Waits for `topic/selected` event matching `data.articleId` |
| — | `resume-pipeline` | — | Sets status → `generating`; saves `selected_topic` to DB |
| 3 | `deep-researcher` | 65s | Web search for facts, key players, timeline, Malaysian context |
| 4 | `article-writer` | 65s | Writes 700–900 word BM article in TipTap JSON; injects full STYLE_GUIDE |
| 5 | `seo-metadata` | 65s | Slug, meta description, tags |
| 6 | `image-brief` | 65s | Hero image prompt (Midjourney-style) + Unsplash query + 3 inline image suggestions |
| 7 | `quality-checker` | — or 65s | Fact-checks via web search; scores 1–100; publish threshold is **85** |
| 7b | `revision-agent` | — or 65s | Runs if score < 85; aims to bring article to 85+; up to 2 revision attempts |
| 7c | `quality-checker-2` | — | Re-checks after first revision |
| 7d | `revision-agent-2` | — | Runs if score still < 85 after first revision |
| 8 | `save-article` | — | Saves to Supabase, injects ImagePlaceholder nodes, status → `ready_to_review` |

**Cancel flow:** `POST /api/cancel-topic` → deletes article from DB → fires `topic/selected` with `{ cancelled: true }` → Inngest pipeline detects cancellation → returns `{ cancelled: true }` cleanly without further processing.

**Quality scoring thresholds:**
- `publish` → score ≥ 85
- `review` → score 60–84
- `reject` → score < 60
- Fallback floors: publish=87, review=70, reject=35 (never 0)

**Pipeline failure abort:** `pipelineFailures` counter in `inngest-functions.js`. Each agent catch block calls `checkFailureLimit(err)` which increments the counter. If `pipelineFailures >= 3`, throws immediately to abort entire pipeline. Prevents runaway costs.

**Permanent failure handler:** When all Inngest retries (2 total) are exhausted, catch block marks article as `failed` and writes `failed` progress rows for all pending agents so JanaClient detects completion.

**Total runtime:** ~10–13 minutes per article (after topic selection, up to 2 revision cycles).

---

## The Agent Helpers (`lib/agents/_client.js`)

```js
ask(systemPrompt, userPrompt, maxTokens = 4096)
// → calls Claude, extracts JSON from response, retries up to 2x on errors

askWithSearch(systemPrompt, userPrompt, maxTokens = 4096)
// → same but with web_search_20250305 tool enabled (live internet)
```

**Retry logic (`MAX_RETRIES = 2`):** Maximum 1 retry per call. Retries on 429, 529, 500, 503, 502, network errors (status 0), timeout, ECONNREFUSED, ENOTFOUND, "fetch failed", "timed out". Delays: 5s, 10s.

**90-second hard timeout:** Every API call is wrapped in `withTimeout()` using `Promise.race`. If Claude hasn't responded in 90s, the call throws `'Agent call timed out after 90s'` — which is retryable once.

```js
const MAX_RETRIES = 2
const AGENT_TIMEOUT_MS = 90_000
function withTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Agent call timed out after 90s')), AGENT_TIMEOUT_MS)
    ),
  ])
}
```

Agents using `askWithSearch`: trend-scout, deep-researcher, quality-checker
Agents using `ask`: topic-selector, article-writer, seo-metadata, image-brief, revision

**maxTokens by agent (CRITICAL — do not change without good reason):**
| Agent | maxTokens | Reason |
|---|---|---|
| trend-scout | **3000** | Returns top 8 candidates with 1-2 sentence (~100 char) descriptions; raised from 2000 (Jun 11, 2026) — at 2000, descriptions had grown verbose enough to truncate the JSON again |
| topic-selector | **1000** | Returns 3 short option objects |
| deep-researcher | **3000** | Detailed research brief with multiple sources |
| article-writer | **4000** | Full 700-900 word TipTap JSON article |
| seo-metadata | **1000** | Short slug/meta/tags output |
| image-brief | **1000** | Hero prompt + 3 suggestions |
| quality-checker | **2000** | Web search synthesis + structured quality report |
| revision | **4000** | Full revised article in TipTap JSON |

**WARNING:** Lowering trend-scout below 3000 or quality-checker below 2000 will cause JSON truncation → `parseJSON` returns `{ raw: text }` → agent returns empty/null data → pipeline fails silently.

**Markdown fence fallback (trend-scout.js, Jun 11, 2026):** If `askWithSearch()`'s shared `parseJSON()` fails (returns `{ raw: text }`), trend-scout.js now strips leading/trailing ```` ```json ```` / ```` ``` ```` fences from `result.raw` and retries `JSON.parse()` before falling back to diagnostic logging. This handles cases where the model wraps its JSON response in markdown code fences. Diagnostic `console.log` lines were also added (raw text on parse failure, parsed keys/trends.length on success, and a summary of `topicsFound`/`firstTopic`/`scoutedAt`) to make future failures easier to diagnose from the terminal.

**Markdown fence fallback extended to deep-researcher.js and article-writer.js (Jun 12, 2026):** Both agents were returning null/empty articles because `askWithSearch()`/`ask()`'s `parseJSON()` failed silently on markdown-fenced JSON responses (same root cause as the trend-scout issue, never backported to these two agents). Applied the same fence-stripping fallback (strip leading/trailing ```` ```json ```` / ```` ``` ```` and retry `JSON.parse()`) to both files. `scripts/test-pipeline-health.mjs` → 20/20 passing after fix.

**image-brief.js prompt overhaul (Jun 12, 2026):** System prompt rewritten for photorealistic, publication-ready stock photo suggestions:
- All people described as Malaysian, and must use a FACELESS composition (shot from behind/side/over-the-shoulder/farther away) — never a clearly visible face
- Banned descriptors: "minimalist", "abstract", graphic/infographic, fantasy/surreal — replaced with "cinematic" framing/lighting/composition language
- Examples updated to match (e.g. "Malaysian developer seen from behind, working on laptop in modern Kuala Lumpur office, cinematic natural lighting")
- `maxTokens` unchanged at 1000

---

## Human-in-the-Loop Topic Selection (JanaClient)

The `/admin/jana` page implements a two-step flow:

**Step 1 — Search Topics:**
1. Page loads showing single "Jana Artikel Baru" button
2. Admin clicks button → Step 1 panel slides in with optional topic direction input
3. Admin types a direction (or leaves blank for fully automatic) → clicks "Cari Topik"
4. `POST /api/generate-topics` fires with `{ topicDirection }` — creates article in DB
5. Inngest runs trend-scout + topic-selector → saves 3 options to DB
6. JanaClient polls `/api/progress` every 3s → detects `topic_options` → shows 3 topic cards
7. Topic direction input stays visible as read-only during this waiting state

**Step 2 — Select Topic:**
- Admin reviews 3 topic cards (each shows topic, summary, category, angle, source)
- Click "Pilih" on one → `POST /api/select-topic` → fires `topic/selected` Inngest event
- Pipeline resumes, full article generation begins
- "Jana Automatik" button auto-selects option 1
- On selection: panel collapses, topic direction clears, progress cards appear

**Cancel:**
- "Batal" button in panel: if article exists → opens confirmation modal → `POST /api/cancel-topic` → deletes article + sends cancel signal to Inngest
- If no article yet (search hasn't started) → just collapses panel
- After cancel: panel collapses, topic direction input clears

**Key state variables in JanaClient:**
- `showStep1` — controls panel visibility
- `topicDirection` — the optional topic hint text
- `topicOptionsMap` — `{ [articleId]: topicOptions[] }` — pre-populated from `initialArticles` on load
- `isSearching` — true while waiting for topic options to appear
- `selectingId` — article being selected (to show loading state on card)
- `cancelTarget` — article pending cancellation (for modal)

**Important:** `topicOptionsMap` is initialized from `initialArticles` in `useState()` so existing options show immediately on page load without waiting for first poll.

---

## Context Flow Between Agents

```
{}
→ { trends, scoutedAt }                                    ← trend-scout
→ { trends, scoutedAt, topicOptions[] }                    ← topic-selector (3 options)
→ [HUMAN SELECTS ONE OPTION]
→ { selectedTopic, articleAngle, researchBrief }           ← deep-researcher
→ { ...above, article }                                    ← article-writer (TipTap JSON body)
→ { ...above, seo }                                        ← seo-metadata
→ { ...above, images: { heroImage, suggestions } }         ← image-brief
→ { ...above, qualityReport, qualityPassed }               ← quality-checker
→ { ...above, revisionCorrectionsMade }                    ← revision (only if score < 85)
```

The `save-article` step uses `ctxFinal` (final merged context). After save, `injectImagePlaceholders()` inserts ImagePlaceholder nodes at the paragraphIndex positions from `images.suggestions`.

**`selectedTopicCtx` shape** (built from human-selected option):
```js
{
  selectedTopic: {
    topic: option.topic,
    description: option.summary,
    category: option.category,
    urgency: 'high',
    keywords: []
  },
  articleAngle: option.angle ?? option.summary ?? ''
}
```

---

## Article Editor (`app/admin/editor/[id]/EditorClient.js`)

The most complex file. Features:

- **Headline picker:** 3 radio options + custom text input
- **TipTap editor:** StarterKit + Image + ImagePlaceholder extensions
- **Sticky toolbar:** Position sticky below editor header (60px desktop, 96px mobile). Buttons: B, I, H2, H3, • Senarai, 1. Senarai, image insert icon
- **Image hover controls:** Hovering over any inline image shows circular buttons top-right:
  - ✏ Edit — opens InlineImageModal (uses `hoverEditPosRef` to replace node by position)
  - 🗑 Delete — opens ConfirmationModal (`removeHoverImage` modal)
  - ↑↓ Move — appear when `canUp`/`canDown` (mobile tap support via touchstart)
- **Image toolbar (click-based):** Appears at bottom of selected image — ↑↓ move, ✏ edit, × delete
- **ImagePlaceholder nodes:** Amber dashed border blocks injected at suggested positions. "Muat Naik" → uploads and replaces node with real image. "Langkau" → deletes node. Placeholders are stripped from body HTML on publish.
- **Cadangan AI card:** Shows hero image prompt in the "Imej Hero" section (desktop only; mobile has "Lihat Cadangan AI" button)
- **InlineImageModal:** Upload + crop (ReactCrop) or URL. Lazy upload on insert. Compact icon-based aspect ratio selector (36×36px / 32×32px responsive squares with visual aspect shapes): Free, 16:9 Landscape, 3:4 Portrait, 1:1 Square, 9:16 Tall.
- **Featured image (hero) / CropModal:** Drag-drop or click. Same icon-based aspect ratio selector as InlineImageModal (`CROP_ASPECT_RATIOS = { free: null, landscape: 16/9, portrait: 3/4, square: 1/1, tall: 9/16 }`), default 16:9 (1280×720). Stored in `article-images` bucket.
- **Thumbnail caption field:** Always visible in the "Imej Hero" section (matching Hero Alt Text), no longer conditional on an image being uploaded first (Jun 12, 2026).
- **Editor theme:** Synced with the admin panel via the shared `admin-theme` localStorage key + `admin-theme-change` CustomEvent — toggling theme anywhere in the admin panel (including the editor) updates all pages consistently. No separate `editor-theme` key (Jun 12, 2026).
- **Author selector:** Custom dropdown above SEO fields — shows avatar pip + name; default "Sharpable News"
- **SEO sidebar:** Editable slug, meta description, tag chips
- **Quality report panel:** Collapsible. Verdict + score + required fixes + corrections + original pre-revision report
- **Sources list:** Read-only. `<cite>` tags stripped. Titles are clickable links when `url` field present
- **Save buttons:** "Simpan Draf" + "Terbit Sekarang" (with ConfirmationModal). `stripPlaceholders()` runs on publish
- **Mobile:** Tab layout (Kandungan / SEO & Meta / Semakan). Tab font: `var(--font-sans)` (DM Sans)
- **Dirty state:** Amber dot + beforeunload warning
- **Auto-scroll drag:** When dragging image nodes, cursor within 80px of viewport edge scrolls proportionally

---

## Admin Panel Pages

| Page | Route | What it does |
|---|---|---|
| Dashboard | `/admin` | Metrics strip (published/draft/generating/7-day), 7-day bar chart (responsive), 5 recent articles |
| Articles | `/admin/artikel` | Article table — status badges (mobile-responsive), edit links; Cancel button on generating/awaiting articles |
| Generate | `/admin/jana` | Two-step topic selection: direction input → 3 topic cards → full generation progress |
| Editor | `/admin/editor/[id]` | Full article editor (see above) |
| Authors | `/admin/penulis` | Author card grid — add/edit (with 1:1 crop), delete |
| Subscribers | `/admin/langgan` | Subscriber table (desktop) / cards (mobile) — search by email, CSV export, delete via ConfirmationModal |
| Settings | `/admin/tetapan` | System info, pipeline overview, configurable generation settings |

**Status badges** (`ArtikelClient.js` STATUS_CFG):
- `generating` — amber "Menjana"
- `awaiting_topic_selection` — blue "Pilih Topik"
- `ready_to_review` — green "Siap Semak"
- `published` — dark "Diterbitkan"
- `draft` — grey "Draf"
- `failed` — red "Gagal"

**Light/dark mode:** Single shared `admin-theme` localStorage key (`'dark'` | `'light'`). Toggled from `AdminSidebar.js`, which sets the key and dispatches `admin-theme-change` (CustomEvent). All admin components — including `AdminSidebar.js` itself and `EditorClient.js` — listen for `admin-theme-change` and switch CSS vars via an `lm` boolean. (Jun 12, 2026: fixed `AdminSidebar.js` which previously only read `admin-theme` on mount and didn't listen for the change event, causing the sidebar/page background to stay on the stale theme — e.g. dark sidebar + light panels — after toggling theme from the editor and navigating back.)

**Articles table checkboxes** (`ArtikelClient.js` `.cb-box`): always-visible, subtle single-ring outline style (`--cb-border` CSS var per theme) instead of opacity-based hover reveal (Jun 11–12, 2026).

### Settings page configuration (`/admin/tetapan` — `site_settings` table via `/api/settings`)
All settings use the `draft`/`saved`/`pendingKeys` pattern — edits are staged, then saved via `Promise.all` POSTs to `/api/settings` (one row per key, `onConflict: 'key'`).

| Setting | DB key(s) | UI control | Wired into pipeline? |
|---|---|---|---|
| Min Quality Score | `quality_score_threshold` | Slider 70–90, default 85 | Saves only — not yet read by `lib/` |
| Target Article Length | `target_article_length` | Pill buttons (short/standard/long) | Saves only — not yet read by `lib/` |
| Failure Notification Email | `notification_email` | Email input | Saves only — not yet read by `lib/` |
| Site Tagline | `site_tagline` | Text input | Saves only — not yet read by `lib/` |
| Social Links | `social_x`, `social_facebook`, `social_instagram` | 3 text inputs | Saves only — not yet read by `lib/` |
| Pinned Categories | `pinned_categories` | Text input (comma-separated) | **Wired** — read by `app/api/categories/route.js` and `PublicNavbarServer.js` for public nav/categories |
| **Body Images Per Article** (new, Jun 12, 2026) | `image_count_min`, `image_count_max` | Custom dual-handle range slider, 1–8, default min 3 / max 5 | Saves only — not yet read by `lib/` |
| **Editorial Instructions** (new, Jun 12, 2026) | `editorial_instructions` | Large textarea, placeholder pre-filled with style-guide-derived default text | Saves only — not yet read by `lib/` |

**Note:** Per CRITICAL RULES, none of the new/existing settings are wired into `lib/inngest-functions.js` or `lib/agents/` yet — that would require a dedicated, focused pipeline-only change.

**Light mode design:** #f8f8f8 page, #f1f1f1 sidebar, #1a1a1a primary text, #4b5563 secondary, #e5e7eb borders. Status badge colors are contrast-safe on both themes.

**Admin navigation loader:** `AdminLoader.js` shows a circular amber-arc spinner + "Sharpable News" wordmark on admin page navigation (300ms minimum display, instant fade-in).

---

## Public Website

### Navbar (`app/components/PublicNavbar.js`)
- Used on both homepage and article pages
- `position: fixed`, always dark regardless of page theme
- Order: Langgan → Search icon → Theme toggle
- **Search:** Click icon → full-screen dark overlay with large Fraunces input → debounced 300ms search against Supabase (`/api/search`) → results with thumbnail, tag, date. Escape or click outside closes
- **Theme toggle:** Adds `.theme-transitioning` class for 380ms (smooth color transitions)
- Homepage scroll: `scrolled` class added after 60px for border effect

### Page Transitions (`app/components/PageLoader.js`)
- Intercepts `<a>` link clicks (skips external, `#`, `/admin`, `target=_blank`)
- Shows Sharpable logo + amber 3px progress bar (crawls to 78%, then jumps to 100% on navigation complete)
- Fade in: 0.5s ease. Fade out: 0.9s cubic-bezier. Hide delay: 1000ms
- Always in DOM at `opacity:0` so fade-in has a starting value (prevents instant flash)

### Article Page (`app/artikel/[slug]/page.js`)
- PublicNavbar (sticky)
- Tags, headline, deck, byline (author photo + name + "·" + date OR "Sharpable News · date")
- Featured image
- Article body (TipTap HTML render; placeholders have `style:display:none` if any remain)
- **Author bio card** (amber left border, #d4a853; amber tinted background) — only if article has author
- **Related articles** (`RelatedArticles.js`):
  - Desktop (≥769px): 3-column grid
  - Mobile: CSS scroll-snap carousel, progress bar indicators (amber fill animation 5s)
- Footer

### Search API (`/api/search`)
- Public endpoint (no auth)
- `GET /api/search?q=query` — ilike on title + meta_description, max 5 results
- Optional FTS index: `supabase/migrations/006_fts_index.sql`

---

## Author System

### Admin (`/admin/penulis`)
- Card grid: photo, name, bio, Edit/Padam buttons
- Add/Edit modal: name input, one-sentence bio (180 char limit), photo upload with **1:1 circular crop** (ReactCrop + `circularCrop`)
- Delete uses ConfirmationModal
- Photos stored in `authors` Supabase Storage bucket

### Article Editor
- Author dropdown above SEO section (custom styled, not native `<select>`)
- Shows avatar pip + name; "Sharpable News" is the null/default option
- `author_id` saved in every article PATCH

### Public Article Page
- Byline: 28px avatar + name (underlined, subtle) + "·" separator + date
- Author bio card at bottom: amber border + amber tinted bg + "Tentang Penulis" label
- Falls back to "Sharpable News" if no author assigned

---

## Subscribers / Newsletter System (Jun 10, 2026)

### `subscribers` table (migration 009)
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| email | text | Unique, lowercased before insert |
| source | text | Defaults to `'homepage'` |
| subscribed_at | timestamptz | |
| created_at | timestamptz | |

RLS enabled with no public policies — only the service role (server-side) can read/write.

### Public signup (`POST /api/subscribe`)
- Validates email format, lowercases + trims
- Uses a direct `createClient()` with `SUPABASE_SERVICE_ROLE_KEY` (NOT the anon client) to bypass RLS for the insert
- Unique violation (`error.code === '23505'`) → "Emel ini sudah berdaftar." (409)
- BM error messages throughout

### Admin (`/admin/langgan`)
- `LanggananClient.js` — desktop table (Email / Source / Date Subscribed / Delete) + mobile card layout, matches the styling pattern of the Articles table
- Search input filters by email (client-side)
- **CSV export** — client-side `Blob` download (`subscribers-YYYY-MM-DD.csv`); the download `<a>` click is dispatched as `bubbles: false` so the global `PageLoader` document click-listener doesn't intercept it and get stuck mid-progress
- Delete via `ConfirmationModal` → `DELETE /api/subscribers/[id]`
- Light/dark theme support via the same `admin-theme-change` CustomEvent pattern as other admin pages
- Sidebar nav order: Authors → **Subscribers** → Settings (`AdminSidebar.js`)

---

## Style Guide (`lib/agents/style-guide.js`)

Imported by `article-writer` and `revision`. Contains:

**Writing rules (PANDUAN GAYA):**
- Word count: **700–900 patah perkataan** (article-writer prompt), **600–800** (revision prompt)
- 5 mandatory sections: Hook → Fakta & Konteks → Impak Tempatan → Soalan Kritikal → Penutup
- **Named-person hook:** MUST open with a real named individual + direct quote in first 2 paragraphs
- **Bookending:** Return to same person mid/end of article
- 3–5 subheadings (H2), each descriptive and specific
- 3 headline options (under 70 chars each)
- Forbidden phrases: "Dalam era digital ini", "Tidak dapat dinafikan", "Hal ini demikian kerana"

**Reference articles:** 10 full BERNAMA/Astro AWANI articles for TONE and LANGUAGE reference only — NOT for structure copying. These cover: product launches, policy news, expert analysis, government statements, opinion/kolumnis.

**Usage:** Reference articles calibrate authentic BM news register, attribution style ("katanya"/"berkata"), and sentence rhythm. The writing RULES above define structure.

---

## ImagePlaceholder Extension (`app/admin/editor/[id]/ImagePlaceholderExtension.js`)

Custom TipTap block node. Factory: `createImagePlaceholderExtension(articleId)`.

```js
// Injected into article body by save-article step via injectImagePlaceholders()
{
  type: 'imagePlaceholder',
  attrs: { description: 'Short image description', placement: 'after-paragraph-2' }
}
```

**Render:**
- Amber dashed border (`rgba(212,168,83,0.38)`), compact, amber tinted bg
- Shows "Cadangan Imej AI" label + description text
- "Muat Naik" button → uploads to Supabase, replaces node with `<img>` at exact position
- "Langkau" button → deletes node

**Publish:** `stripPlaceholders()` in `save()` runs regex on HTML to remove all `data-type="image-placeholder"` divs before saving published articles.

---

## Key Bugs Fixed

### Generation timing glitch (FIXED)
`save-article` progress row written; JanaClient requires all required agents done/failed before declaring completion.

### Quality score 0/100 (FIXED)
Raised quality-checker maxTokens to 2500 (now 2000 with cost controls). Added score floors (never 0). Explicit scoring rules in system prompt.

### `<cite>` tags in sources (FIXED)
`.replace(/<cite[^>]*>(.*?)<\/cite>/gi, '$1')` in EditorClient sources display.

### `childCount` crash in TipTap editor (FIXED)
Guard: `if (depth < 1) { setImgMove(null); return }` and `if (!parent) return`.

### Inline image squishing on public page (FIXED)
`.article-figure img { width: auto; max-width: 100%; height: auto; margin: 0 auto 8px }` in globals.css.

### Mobile metrics overflow (FIXED)
`!important` overrides on `.metrics-strip > div` in AdminClient.js.

### Optional DB columns missing (FIXED)
Two-phase save: core fields in one UPDATE (throws on failure), optional fields in separate UPDATE (console.warn on error).

### Generation fails with network/500 errors (FIXED)
`_client.js` now retries on 500, 503, 502, network errors (status 0), timeout, ECONNREFUSED — not just 429/529.

### Generation stuck as 'generating' forever on failure (FIXED)
Permanent-failure catch block in `inngest-functions.js` (on attempt ≥ 1): marks article `failed`, writes `failed` progress rows for all pending agents so JanaClient card resolves.

### Image brief not appearing (Cadangan AI missing) (FIXED)
Raised `image-brief.js` maxTokens from 1000 to 2000. JSON truncation caused `heroImage` to be null. (Now back at 1000 — monitor if issue returns.)

### White flash on admin navigation (FIXED)
`html, body { background-color: #0c0b0a }` in globals.css. `AdminLoader` shows instantly (no fade-in transition). Admin layout wrapper has dark background.

### Trend scout returning 0 topics (FIXED — Jun 2026)
**Root cause:** `maxTokens: 1500` was too low. Model generates ~1200-1400 tokens of JSON for 7 topics. Token truncation caused `parseJSON()` to fail → returned `{ raw: text }` → `result.trends` undefined → `[]`. Fixed by raising to 2000. **Warning:** Do NOT lower below 2000.

### Pipeline hanging 24h when 0 topics returned (FIXED — Jun 2026)
If `topicOptions.length === 0` after topic-selector, pipeline would reach `waitForEvent` and sit idle for 24h. Fixed with fail-fast guard immediately after topic-selector step.

### Supabase CHECK constraint blocking new statuses (FIXED — Jun 2026)
Original CHECK only allowed 4 statuses. `migration 008_status_constraint.sql` expands it to include `failed` and `awaiting_topic_selection`. Must be applied in Supabase SQL Editor.

### topicOptionsMap not showing on page load (FIXED — Jun 2026)
`topicOptionsMap` state was initialized as `{}`, causing 3s delay before options appeared after reload. Fixed by initializing from `initialArticles`: `useState(Object.fromEntries(initialArticles.filter(a => a.topic_options).map(a => [a.id, a.topic_options])))`.

### Topic direction input disappearing during search (FIXED — Jun 2026)
Input was cleared on search start. Fixed: input stays visible as read-only during `isSearching` + when awaiting articles exist. Only clears on `confirmCancel` success or `handleSelectTopic` success.

### POST /api/subscribe 500 error (FIXED — Jun 11, 2026)
Newsletter signup was failing with a 500. Fixed by using a direct Supabase service-role client (`createClient` with `SUPABASE_SERVICE_ROLE_KEY`) in `app/api/subscribe/route.js` instead of the anon client, so RLS-protected inserts to `subscribers` succeed.

### Trend scout STILL returning 0 topics after JSON-fence fix (FIXED — Jun 11, 2026)
**Root cause:** Same truncation pattern as the earlier "Trend scout returning 0 topics" fix, recurring at the (then-current) `maxTokens: 2000` cap. The model's per-topic `description` fields had grown to ~70 words (vs. the requested "2-3 sentences") across 10-15 requested topics, producing JSON too large for 2000 tokens — the response got cut off mid-structure, so even the new markdown-fence-stripping fallback couldn't parse it (the JSON itself was incomplete, not just fence-wrapped).
**Fix (trend-scout.js only):**
1. Raised `maxTokens` from 2000 → **3000**.
2. Tightened the prompt: descriptions capped at "1-2 sentences (max ~100 characters)".
3. Reduced requested candidates from "top 10-15" → "**top 8**".
`scripts/test-pipeline-health.mjs` assertions updated to match (`'top 8'`, `'3000'`). 20/20 passing.

### deep-researcher / article-writer returning blank/null content (FIXED — Jun 12, 2026)
**Root cause:** Same markdown-fence JSON issue as trend-scout, but the fence-stripping fallback had never been backported to `deep-researcher.js` or `article-writer.js`. When the model wrapped its JSON in ```` ```json ```` fences, `parseJSON()` returned `{ raw: text }`, and downstream context fields (`researchBrief`, `article`) ended up null/empty — causing 0-word articles.
**Fix:** Applied the same fence-stripping retry logic to both files. `scripts/test-pipeline-health.mjs` → 20/20 passing.

### Admin theme not syncing fully after toggling in editor (FIXED — Jun 12, 2026)
**Symptom:** Toggling light/dark mode in the article editor, then navigating back to the dashboard, showed a mixed state — sidebar/page background stuck on the old theme while individual panels switched to the new theme.
**Root cause:** `AdminSidebar.js` only read `admin-theme` from localStorage once on mount and never listened for the `admin-theme-change` CustomEvent, so its own `theme` state went stale on client-side navigation (the sidebar/layout persists across route changes).
**Fix:** `AdminSidebar.js` now also subscribes to `admin-theme-change` and updates its `theme` state immediately, matching every other admin component. Confirmed `admin-theme` is the single shared key across all 8 admin files (no `editor-theme` remains); normalized `PenulisClient.js`'s theme-init fallback to `|| 'dark'` for consistency.

---

## CRITICAL RULES

1. **`lib/inngest-functions.js` and `lib/agents/` are the most sensitive files.** Never modify them as part of UI, translation, or styling prompts — pipeline changes must be in dedicated focused prompts only.
2. **Always specify exact file paths in prompts** — never use broad directory sweeps on `lib/`.
3. **After any prompt touching pipeline files, verify the context object fields being passed into `save-article` are intact.**

---

## Important Rules / Gotchas

1. **Never use the anon Supabase client for server-side writes** — always `createAdminSupabaseClient()`.
2. **Model ID is `claude-sonnet-4-5`** — not the dated format (returns 404).
3. **Inngest MUST be running on port 8288** for generation to work. Restart after changing `inngest-functions.js` OR any agent file.
4. **maxTokens are carefully tuned** — see table in Agent Helpers section. trend-scout MUST be ≥3000 (raised from 2000 on Jun 11, 2026). Do not lower any of them without understanding the truncation risk.
5. **TipTap body format:** Stored as TipTap JSON in DB. `editor.getHTML()` used for save; body column holds the JSON.
6. **65s sleeps between agents** — intentional rate-limit protection. Do not remove.
7. **STYLE_GUIDE** — imported by article-writer AND revision. Named-person hook mandatory. Reference articles for BM register only.
8. **Image uploads** — hero: `/api/upload-image` (16:9 crop, `article-images` bucket). Inline: `/api/upload-inline-image`. Author photo: `/api/upload-author-photo` (`authors` bucket).
9. **`!important` in admin CSS** — MetricCell and some components use inline styles. Media query overrides need `!important`.
10. **Theme transitions** — `toggleTheme` in both `PublicNavbar.js` and `AdminSidebar.js` add `.theme-transitioning` class for 380ms. Defined in `globals.css`. Only applies during toggle, not page load.
11. **Sources have URLs** — `deep-researcher.js` prompt captures `sourceUrl` per source. Stored in `sources` jsonb array. Editor shows clickable titles when URL present.
12. **Quality threshold is 85** — not 80. Revision agent explicitly aims for 85+. Up to 2 revision attempts before accepting whatever score was achieved.
13. **Inngest step memoization** — Completed step results are cached PER RUN. If a run's trend-scout returned 0 topics, cancelling and starting a NEW article creates a new run — no contamination. But a stuck article's run permanently memoizes the bad result; it must be cancelled.
14. **Migration 008 must be applied** — if you see "invalid input value for enum" or CHECK constraint errors when creating articles, run `supabase/migrations/008_status_constraint.sql` in Supabase SQL Editor.
15. **topic/selected event** — Inngest pipeline pauses on `waitForEvent('wait-for-topic-selection', { event: 'topic/selected', timeout: '24h', match: 'data.articleId' })`. Cancel sends this event with `cancelled: true`. If pipeline times out (24h), article auto-marks failed.
16. **Pipeline failure counter resets per run** — `pipelineFailures` is a local variable in `generateArticle`. Each new article run starts at 0. Abort triggers on ≥3 failures within a single run only.
17. **Article length setting values** — site_settings `target_article_length` uses `brief`/`standard`/`detailed` (NOT short/standard/long — renamed Jun 13). Article Writer maps these to 600/750/900w. Actual output ~150-200w longer due to TipTap headings/structure.
18. **Image Brief settings** — reads `image_count_min` and `image_count_max` from site_settings. Both use `createAdminSupabaseClient()` at agent start — same pattern for future settings wiring.
19. **topic_direction column** — added to articles table via Migration 010. If missing, run: `ALTER TABLE articles ADD COLUMN topic_direction text;`
20. **Canonical tags table** — `canonical_tags` stores the approved tag list. SEO agent should read from this table. Article editor tag picker shows only canonical tags. Free-text tags from before this system show with amber warning in editor.
21. **Settings wiring status** — brief/standard/detailed → WIRED (article-writer.js). image_count_min/max → WIRED (image-brief.js). quality_score_threshold → saves only, not wired. notification_email → saves only, Coming Soon. site_tagline/social links → saves only, Coming Soon. editorial_instructions → saves only, Coming Soon. pinned_categories → wired to public navbar only.
22. **Never batch pipeline file changes with UI changes** — keep them in separate prompts in separate chats. Always add "Show me a diff of every line you changed" to any agent file prompt to catch silent edits.

---

## What Is Complete

- [x] Full public website (homepage, article pages, responsive)
- [x] Shared PublicNavbar (sticky, always dark, functional full-screen search)
- [x] Page transition loader (smooth fade overlay with progress bar)
- [x] Footer component (shared between homepage + article pages)
- [x] Related articles section (snap carousel mobile / 3-col grid desktop, progress bar indicators)
- [x] Full admin panel (dashboard, article list, generator, editor, authors, settings)
- [x] All 9 AI agents fully implemented
- [x] Article generation pipeline (Inngest) end-to-end with quality loop (up to 2 revisions)
- [x] Live generation progress tracking with failure detection
- [x] TipTap article editor with sticky toolbar, image upload, crop, inline images
- [x] Image hover controls (edit/delete/move with ConfirmationModal)
- [x] Auto-scroll during drag, mobile touch controls for images
- [x] ImagePlaceholder extension (inline image suggestions, upload/skip, strip on publish)
- [x] Featured hero image upload with 16:9 crop
- [x] Author management system (CRUD, circular crop, Supabase Storage)
- [x] Author assignment in editor + author byline + bio card on public pages
- [x] SEO fields editor
- [x] Quality report panel (collapsible, score/verdict/fixes/corrections/original report)
- [x] Sources list with clickable links (URL from web search)
- [x] Light/dark mode — admin panel (proper contrast hierarchy) + public site
- [x] Admin page transition loader (AdminLoader)
- [x] Loading skeletons for admin tabs
- [x] Confirmation modals (logout, publish, remove image, remove inline image, remove author)
- [x] Dirty state tracking + unsaved changes warning
- [x] Style guide with 10 BERNAMA reference articles + writing rules
- [x] Named-person hook + bookending + 700–900 word target enforced
- [x] Functional article search (full-screen overlay, Supabase ilike, results with thumbnail)
- [x] Bar chart responsive (mobile X-axis label reduction)
- [x] Netlify deployment config present
- [x] **Human-in-the-loop topic selection** — two-step Jana flow, 3 topic cards, cancel support (Jun 2026)
- [x] **Cost controls** — token caps, 90s timeout, 1 retry max, 3-failure pipeline abort (Jun 2026)
- [x] **Migration 007** — topic_options + selected_topic columns (Jun 2026)
- [x] **Migration 008** — expanded status CHECK constraint (Jun 2026)
- [x] **Migration 009** — subscribers table for newsletter signups (Jun 10, 2026)
- [x] **Subscribers/Newsletter system** — public signup API (`/api/subscribe`), admin management page (`/admin/langgan`) with search/CSV export/delete (Jun 10, 2026)
- [x] **Trend-scout reliability fixes** — markdown-fence JSON fallback + diagnostic logging, maxTokens raised to 3000, top-8 candidates with capped description length (Jun 11, 2026)
- [x] **deep-researcher/article-writer markdown-fence JSON fallback** — fixes blank/null article generation (Jun 12, 2026)
- [x] **Editor UI polish** — thumbnail caption always visible, 9:16 aspect ratio option + icon-based aspect selectors for hero/inline image modals, subtle always-visible table checkboxes, brightened dark-mode text contrast (Jun 11–12, 2026)
- [x] **image-brief prompt overhaul** — Malaysian faceless subjects, cinematic photorealistic framing, banned abstract/graphic/face-visible suggestions (Jun 12, 2026)
- [x] **Unified admin theme system** — single `admin-theme` localStorage key + `admin-theme-change` event across all admin pages and the article editor, including AdminSidebar sync fix (Jun 12, 2026)
- [x] **New settings: Body Images Per Article** (`image_count_min`/`image_count_max`, dual-range slider 1–8, default 3/5) and **Editorial Instructions** (`editorial_instructions`, large textarea) added to `/admin/tetapan` (Jun 12, 2026) — saved to `site_settings`, not yet wired into the pipeline
- [x] **target_article_length wired to Article Writer** — reads brief/standard/detailed from site_settings, maps to 600/750/900w targets with style guide override protection (Jun 13, 2026)
- [x] **image_count_min/max wired to Image Brief** — reads range from site_settings, picks random count in range, falls back to 5 silently (Jun 13, 2026)
- [x] **topic_direction persisted to articles table** — saved in save-topic-options step, displays correctly in editor Generation Context (Jun 13, 2026). Migration 010 required: `ALTER TABLE articles ADD COLUMN topic_direction text;`
- [x] **Coming Soon badges** — added to Min Quality Score, Failure Notification Email, Site Tagline, Social Links, Editorial Instructions in settings page (Jun 13, 2026)
- [x] **Article length options renamed** — short/standard/long → brief/standard/detailed in both UI and site_settings DB values (Jun 13, 2026)
- [x] **Body image delete reverts to original placeholder** — stores suggestionDescription on image node at upload time, restores on delete. Only works for images uploaded after this fix; older images revert to empty placeholder (Jun 13, 2026)
- [x] **Status dropdown in articles tab** — inline clickable dropdown per row, uses React portal to fix overflow clipping. Generating/failed statuses are read-only (Jun 2026)
- [x] **Bulk selection in articles tab** — checkbox selection mode, sticky action banner, bulk publish/draft/delete with ConfirmationModal (Jun 2026)
- [x] **Preview button in articles tab** — eye icon opens published article in new tab (Jun 2026)
- [x] **Subscribers admin page** — /admin/langgan, English UI, mobile card layout, CSV export, search, delete with ConfirmationModal (Jun 2026)
- [x] **Canonical tags system** — canonical_tags table, /admin/topik management page, article editor multi-select picker, SEO agent constraint (Jun 2026) — run SQL: `CREATE TABLE public.canonical_tags (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, name text UNIQUE NOT NULL, slug text UNIQUE NOT NULL, description text, created_at timestamptz DEFAULT now());`

## What Could Be Next

- [ ] Wire remaining admin settings into pipeline (dedicated focused lib/ changes only): `quality_score_threshold` (risky — touches branching logic in inngest-functions.js, do last), `editorial_instructions` (medium risk — inject into article-writer + topic-selector system prompts), `notification_email` (requires email integration, Coming Soon)
- [ ] Apply migration 006 (optional FTS index) for faster search at scale
- [ ] Scheduled article generation (cron via Inngest)
- [ ] Unsplash API integration (auto-fetch hero image from image_brief query)
- [ ] Article search / filter on public homepage
- [ ] Category pages on public site
- [ ] Reading time display on articles
- [ ] Analytics (page views, most read)
- [ ] Multiple admin users / role-based access
- [ ] Email notification when article ready to review
- [ ] Full Netlify deployment with Inngest cloud (requires INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY)
- [ ] Article Writer paragraph structure improvements — shorter paragraphs (2-4 sentences max), sentence variation, subheading frequency rules
- [ ] Style guide additions — extracted writing patterns from Astro Awani/Says.com references
- [ ] Canonical tags SEO agent wiring — seo-metadata.js reads from canonical_tags table (pipeline change, fresh chat, git commit first)
- [ ] Category pages on public site (/kategori/[tag])
- [ ] Homepage real article slot redistribution fix (1x3 grid, no duplicates, Akan Datang placeholders)
