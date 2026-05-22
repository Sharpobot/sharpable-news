# Article Editor Design Spec
**Date:** 2026-05-22
**Feature:** Admin article editor view at `app/admin/editor/[id]/page.js`

---

## Overview

A full-page article editor for reviewing and publishing AI-generated articles. Accessible from the admin panel when an article has `status = 'ready_to_review'`. Follows the dark editorial design system (DM Sans, Fraunces, `#0c0b0a` background, amber accent).

---

## Architecture

**Pattern:** Server component page + client editor island (mirrors existing `AdminPage` → `AdminClient` pattern).

- `app/admin/editor/[id]/page.js` — server component, auth-gated via cookie, fetches full article from Supabase with service role key, passes as props to `EditorClient`
- `app/admin/editor/[id]/EditorClient.js` — client component, owns all edit state, calls PATCH API to save
- `app/api/articles/[id]/route.js` — GET + PATCH for single article
- `app/admin/AdminClient.js` — modified to link `ready_to_review` article titles to the editor

**Dependencies to install:**
```
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
```

---

## Layout

Two-column layout. Left main column (~65%), right sticky sidebar (~35%).

### Left Column

1. **Headline Picker**
   - 3 radio buttons, one per item in `headline_options[]`
   - Free-text "Tajuk Custom" input below the radios
   - Selecting a radio clears the custom field; typing in custom clears the radio selection
   - The active selection (radio or custom) is what gets saved as `title`

2. **TipTap Rich Text Editor**
   - Pre-loaded with `article.body` (HTML string)
   - Toolbar: Bold, Italic, H2, H3, Bullet List, Ordered List
   - Saves HTML string back to `body`

3. **Image Section**
   - Read-only styled callout showing `image_brief` text (the AI's image description + Unsplash query)
   - Dashed placeholder upload area below (non-functional UI chrome for now)

4. **Sources List**
   - Read-only numbered list from `sources[]`
   - Each source: title (bold) + description

### Right Sidebar (sticky)

1. **SEO Fields**
   - Text input: `slug`
   - Textarea: `meta_description`
   - Tag input: `tags[]` — comma-separated entry, rendered as removable pills

2. **Quality Flags Panel**
   - `quality_flags.verdict` displayed prominently with colour coding: `publish` → green (`#10b981`), `review` → amber (`#d4a853`), `reject` → red (`#ef4444`)
   - `quality_flags.overall_score` out of 100
   - `quality_flags.required_fixes[]` as a bulleted list (if any)

3. **Action Buttons**
   - **"Simpan Draf"** — PATCH with `{ title, body, slug, meta_description, tags, status: 'draft' }`
   - **"Terbit Sekarang"** — PATCH with same fields + `status: 'published'`
   - Both show "Tersimpan ✓" on success, "Ralat" on failure, with loading spinner during request

---

## API

### `GET /api/articles/[id]`
- Auth-gated (admin cookie check)
- Fetches full article row from Supabase (all columns)
- Returns `{ article }`

### `PATCH /api/articles/[id]`
- Auth-gated
- Body: `{ title?, body?, slug?, meta_description?, tags?, status? }`
- Updates article row in Supabase
- Returns `{ article }` with updated data

---

## Admin List Link

In `AdminClient.js`, articles with `status === 'ready_to_review'` have their title wrapped in:
```jsx
<Link href={`/admin/editor/${article.id}`}>…</Link>
```
All other statuses remain plain text (no link).

---

## Data Flow

1. User navigates to `/admin/editor/[id]`
2. `page.js` fetches article via Supabase service role (no round-trip, instant render)
3. `EditorClient` initialises local state from article props
4. User edits headline, body, SEO fields
5. User clicks "Simpan Draf" or "Terbit Sekarang"
6. Client calls `PATCH /api/articles/[id]` with current state
7. On success: button shows "Tersimpan ✓" briefly

---

## Design System Compliance

- Background: `#0c0b0a` / `#111010` / `#161412`
- Text: `#ede8df` (primary), `#8c857c` (secondary), `#56514d` (meta)
- Accent: `#d4a853` (amber gold) — used for active radio, publish button, score highlight
- Border: `rgba(237,232,223,0.07)` / `rgba(237,232,223,0.11)`
- Font: DM Sans (UI), Fraunces (headings)
- Border radius: max 4px on inputs, 8px on buttons
- All UI text in Bahasa Malaysia

---

## Out of Scope

- Actual image upload (placeholder UI only)
- Unsplash image fetching
- Public article pages
