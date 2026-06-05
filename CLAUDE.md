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

**Important:** After any code changes to `inngest-functions.js`, restart BOTH servers to ensure Inngest picks up the latest function definitions.

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
│   │   │   ├── ArtikelClient.js         # Article table — status badges, edit links
│   │   │   └── loading.js
│   │   ├── jana/
│   │   │   ├── page.js                  # Generate article server page
│   │   │   ├── JanaClient.js            # Single "Jana Artikel Baru" button + live progress cards
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
│   │   └── login/
│   │       ├── page.js
│   │       └── LoginClient.js
│   └── api/
│       ├── inngest/route.js             # Inngest serve handler (GET/POST/PUT)
│       ├── generate/route.js            # POST: creates article row + fires Inngest event
│       ├── progress/route.js            # GET: returns progress rows + article status by articleId
│       ├── search/route.js              # GET: public article search (?q=query) — max 5 results
│       ├── articles/
│       │   ├── route.js                 # GET: all articles for admin table
│       │   └── [id]/route.js            # GET + PATCH + DELETE for single article
│       ├── authors/
│       │   ├── route.js                 # GET all authors + POST create
│       │   └── [id]/route.js            # PATCH + DELETE single author
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
│   │   ├── _client.js                   # Shared Claude API helper: ask() + askWithSearch()
│   │   ├── style-guide.js               # Editorial style rules + 10 BERNAMA reference articles
│   │   ├── trend-scout.js               # Agent 1: finds trending topics via web search
│   │   ├── topic-selector.js            # Agent 2: picks best topic, deduplicates vs last 30 articles
│   │   ├── deep-researcher.js           # Agent 3: gathers facts + source URLs via web search
│   │   ├── article-writer.js            # Agent 4: writes full BM article (injects STYLE_GUIDE)
│   │   ├── seo-metadata.js              # Agent 5: generates slug, meta description, tags
│   │   ├── image-brief.js               # Agent 6: hero image prompt + 3 inline image suggestions
│   │   ├── quality-checker.js           # Agent 7: fact-checks via web search, scores 1–100 (publish threshold: 85)
│   │   └── revision.js                  # Agent 7b: fixes issues, aims to reach 85+
│   ├── db/
│   │   └── supabase-admin.js            # Admin Supabase client (service role, server-only)
│   ├── inngest.js                       # Inngest client init
│   └── inngest-functions.js             # generateArticle — orchestrates all agents + quality loop
│
├── supabase/migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_featured_image.sql
│   ├── 003_original_quality_flags.sql
│   ├── 004_similar_articles.sql
│   ├── 005_authors.sql                  # authors table + author_id FK on articles
│   └── 006_fts_index.sql               # Optional: GIN index for full-text search performance
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
| status | text | `generating` → `ready_to_review` → `published` → `draft` → `failed` |
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

**Pending migration:** Run `supabase/migrations/005_authors.sql` in Supabase SQL Editor if authors feature shows errors.

---

## AI Pipeline — Complete Flow

**Trigger:** `POST /api/generate` → creates blank article row (`status: generating`) → fires Inngest event `article/generate`

**Pipeline steps in `inngest-functions.js`:**

| Step | Agent | Sleep after | What it does |
|---|---|---|---|
| 1 | `trend-scout` | 65s | Web search for trending AI/tech topics (last 48h); returns sourceName + sourceUrl per trend |
| 2 | `topic-selector` | 65s | Picks best topic; checks last 30 published for duplicates; retries up to 3x |
| 3 | `deep-researcher` | 65s | Web search for facts, key players, timeline, Malaysian context; captures source URLs |
| 4 | `article-writer` | 65s | Writes 600–700 word BM article in TipTap JSON; injects full STYLE_GUIDE |
| 5 | `seo-metadata` | 65s | Slug, meta description, tags |
| 6 | `image-brief` | 65s | Hero image prompt (Midjourney-style) + Unsplash query + 3 inline image suggestions |
| 7 | `quality-checker` | — or 65s | Fact-checks via web search; scores 1–100; publish threshold is **85** |
| 7b | `revision-agent` | — or 65s | Runs if score < 85; aims to bring article to 85+; up to 2 revision attempts |
| 7c | `quality-checker-2` | — | Re-checks after first revision |
| 7d | `revision-agent-2` | — | Runs if score still < 85 after first revision |
| 8 | `save-article` | — | Saves to Supabase, injects ImagePlaceholder nodes, status → `ready_to_review` |

**Quality scoring thresholds:**
- `publish` → score ≥ 85
- `review` → score 60–84
- `reject` → score < 60
- Fallback floors: publish=87, review=70, reject=35 (never 0)

**Permanent failure handler:** When all Inngest retries (2 total) are exhausted, the catch block marks article as `failed` and writes `failed` progress rows for all pending agents so JanaClient detects completion.

**Total runtime:** ~10–13 minutes per article (up to 2 revision cycles).

**Topic dedup:** Topic-selector receives last 30 published articles. If all topics are duplicates, retries up to 3x before failing with "Tiada topik baharu dijumpai."

---

## The Agent Helpers (`lib/agents/_client.js`)

```js
ask(systemPrompt, userPrompt, maxTokens = 4096)
// → calls Claude, extracts JSON from response, retries up to 4x on errors

askWithSearch(systemPrompt, userPrompt, maxTokens = 4096)
// → same but with web_search_20250305 tool enabled (live internet)
```

**Retry logic (`MAX_RETRIES = 4`):** Retries on 429, 529, 500, 503, 502, network errors (status 0), timeout, ECONNREFUSED, ENOTFOUND, "fetch failed". Delays: 5s, 10s, 20s, 40s.

Agents using `askWithSearch`: trend-scout, deep-researcher, quality-checker
Agents using `ask`: topic-selector, article-writer, seo-metadata, image-brief, revision

**maxTokens by agent:**
- quality-checker: **2500** (web search synthesis needs headroom)
- image-brief: **2000** (heroImage prompt + 3 suggestions)
- all others: default 4096

---

## Style Guide (`lib/agents/style-guide.js`)

Imported by `article-writer` and `revision`. Contains:

**Writing rules (PANDUAN GAYA):**
- Word count: **600–700 patah perkataan**
- 5 mandatory sections: Hook → Fakta & Konteks → Impak Tempatan → Soalan Kritikal → Penutup
- **Named-person hook:** MUST open with a real named individual + direct quote in first 2 paragraphs
- **Bookending:** Return to same person mid/end of article
- 3–5 subheadings (H2), each descriptive and specific
- 3 headline options (under 70 chars each)
- Forbidden phrases: "Dalam era digital ini", "Tidak dapat dinafikan", "Hal ini demikian kerana"

**Reference articles:** 10 full BERNAMA/Astro AWANI articles for TONE and LANGUAGE reference only — NOT for structure copying. These cover: product launches, policy news, expert analysis, government statements, opinion/kolumnis.

**Usage:** Reference articles calibrate authentic BM news register, attribution style ("katanya"/"berkata"), and sentence rhythm. The writing RULES above define structure.

---

## Context Flow Between Agents

```
{}
→ { trends, scoutedAt }
→ { trends, scoutedAt, selectedTopic, articleAngle, isDuplicate, similarArticles }
→ { ...above, researchBrief }
→ { ...above, article }                          ← TipTap JSON body
→ { ...above, seo }
→ { ...above, images: { heroImage, suggestions } }
→ { ...above, qualityReport, qualityPassed }
→ { ...above, revisionCorrectionsMade }          ← only if revision ran
```

The `save-article` step uses `ctxFinal` (final merged context). After save, `injectImagePlaceholders()` inserts ImagePlaceholder nodes at the paragraphIndex positions from `images.suggestions`.

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
- **InlineImageModal:** Upload + crop (ReactCrop, free aspect ratio) or URL. Lazy upload on insert.
- **Featured image (hero):** Drag-drop or click. CropModal forces 16:9 (1280×720). Stored in `article-images` bucket.
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
| Articles | `/admin/artikel` | Article table — status badges (mobile-responsive), edit links |
| Generate | `/admin/jana` | Single "Jana Artikel Baru" button + live progress cards |
| Editor | `/admin/editor/[id]` | Full article editor (see above) |
| Authors | `/admin/penulis` | Author card grid — add/edit (with 1:1 crop), delete |
| Settings | `/admin/tetapan` | System info, pipeline overview |

**Light/dark mode:** `admin-theme-change` CustomEvent dispatched by AdminSidebar. All admin components listen and switch CSS vars via `lm` boolean.

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
Raised quality-checker maxTokens to 2500. Added score floors (never 0). Explicit scoring rules in system prompt.

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
Raised `image-brief.js` maxTokens from 1000 to 2000. JSON truncation caused `heroImage` to be null.

### White flash on admin navigation (FIXED)
`html, body { background-color: #0c0b0a }` in globals.css. `AdminLoader` shows instantly (no fade-in transition). Admin layout wrapper has dark background.

---

## Important Rules / Gotchas

1. **Never use the anon Supabase client for server-side writes** — always `createAdminSupabaseClient()`.
2. **Model ID is `claude-sonnet-4-5`** — not the dated format (returns 404).
3. **Inngest MUST be running on port 8288** for generation to work. Restart after changing `inngest-functions.js`.
4. **maxTokens:** quality-checker=2500, image-brief=2000, others=4096. Don't lower them.
5. **TipTap body format:** Stored as TipTap JSON in DB. `editor.getHTML()` used for save; body column holds the JSON.
6. **65s sleeps between agents** — intentional rate-limit protection. Do not remove.
7. **STYLE_GUIDE** — imported by article-writer AND revision. 600–700 words target. Named-person hook mandatory. Reference articles for BM register only.
8. **Image uploads** — hero: `/api/upload-image` (16:9 crop, `article-images` bucket). Inline: `/api/upload-inline-image`. Author photo: `/api/upload-author-photo` (`authors` bucket).
9. **`!important` in admin CSS** — MetricCell and some components use inline styles. Media query overrides need `!important`.
10. **Theme transitions** — `toggleTheme` in both `PublicNavbar.js` and `AdminSidebar.js` add `.theme-transitioning` class for 380ms. Defined in `globals.css`. Only applies during toggle, not page load.
11. **Author migration** — `supabase/migrations/005_authors.sql` must be applied for the authors feature and article page author joins to work without errors.
12. **Sources have URLs** — `deep-researcher.js` prompt captures `sourceUrl` per source. Stored in `sources` jsonb array. Editor shows clickable titles when URL present.
13. **Quality threshold is 85** — not 80. Revision agent explicitly aims for 85+. Up to 2 revision attempts before accepting whatever score was achieved.

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
- [x] Topic deduplication with retry logic
- [x] Style guide with 10 BERNAMA reference articles + writing rules
- [x] Named-person hook + bookending + 600–700 word target enforced
- [x] Functional article search (full-screen overlay, Supabase ilike, results with thumbnail)
- [x] Bar chart responsive (mobile X-axis label reduction)
- [x] Netlify deployment config present

## What Could Be Next

- [ ] Apply migration 005 if authors feature not yet working
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
