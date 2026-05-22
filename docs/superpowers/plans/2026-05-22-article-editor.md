# Article Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-page article editor at `/admin/editor/[id]` for reviewing and publishing AI-generated articles.

**Architecture:** Server component page fetches full article from Supabase (service role), passes to a client `EditorClient` component that owns all edit state and saves via `PATCH /api/articles/[id]`. Matches existing `AdminPage` → `AdminClient` pattern.

**Tech Stack:** Next.js 15 App Router, TipTap (rich text), Supabase (service role), Tailwind-free inline styles (matching existing admin panel).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/api/articles/[id]/route.js` | Create | GET + PATCH single article |
| `app/admin/editor/[id]/page.js` | Create | Server component — auth + data fetch |
| `app/admin/editor/[id]/EditorClient.js` | Create | All edit state + TipTap + save logic |
| `app/admin/AdminClient.js` | Modify | Link `ready_to_review` titles to editor |

---

## Task 1: Install TipTap

**Files:** `package.json` (modified by npm)

- [ ] **Step 1: Install packages**

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
```

Expected output: `added N packages` with no errors.

- [ ] **Step 2: Verify install**

```bash
node -e "require('@tiptap/react'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install TipTap rich text editor"
```

---

## Task 2: Create `GET` + `PATCH` API route for single article

**Files:**
- Create: `app/api/articles/[id]/route.js`

- [ ] **Step 1: Create the route file**

Create `app/api/articles/[id]/route.js` with this exact content:

```js
import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { cookies } from 'next/headers'

async function isAuthed() {
  const cookieStore = await cookies()
  return cookieStore.get('admin-auth')?.value === 'true'
}

export async function GET(request, { params }) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = createAdminSupabaseClient()
  const { data, error } = await db
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 404 })
  return Response.json({ article: data })
}

export async function PATCH(request, { params }) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const allowed = ['title', 'body', 'slug', 'meta_description', 'tags', 'status']
  const patch = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  const db = createAdminSupabaseClient()
  const { data, error } = await db
    .from('articles')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ article: data })
}
```

- [ ] **Step 2: Verify route file exists**

```bash
ls app/api/articles/[id]/route.js
```

- [ ] **Step 3: Manual test — GET**

With Next.js dev server running (`npm run dev`), open a browser and navigate to `/admin` first to get the auth cookie. Then in DevTools console:

```js
// Replace with a real article ID from your Supabase articles table
fetch('/api/articles/YOUR-ARTICLE-ID')
  .then(r => r.json())
  .then(console.log)
```

Expected: `{ article: { id: "...", title: "...", body: "...", ... } }`

- [ ] **Step 4: Manual test — PATCH**

```js
fetch('/api/articles/YOUR-ARTICLE-ID', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'draft' })
}).then(r => r.json()).then(console.log)
```

Expected: `{ article: { ..., status: "draft" } }`

- [ ] **Step 5: Commit**

```bash
git add app/api/articles/
git commit -m "feat: add GET + PATCH API route for single article"
```

---

## Task 3: Create server page component

**Files:**
- Create: `app/admin/editor/[id]/page.js`

- [ ] **Step 1: Create the page**

Create `app/admin/editor/[id]/page.js` with this exact content:

```js
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import LoginForm from '@/app/admin/LoginForm'
import EditorClient from './EditorClient'

export const dynamic = 'force-dynamic'

export default async function EditorPage({ params }) {
  const cookieStore = await cookies()
  const isAuth = cookieStore.get('admin-auth')?.value === 'true'

  if (!isAuth) return <LoginForm />

  const { id } = await params
  const supabase = createAdminSupabaseClient()
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !article) redirect('/admin')

  return <EditorClient article={article} />
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/editor/
git commit -m "feat: add article editor server page"
```

---

## Task 4: Create `EditorClient` — the full editor UI

**Files:**
- Create: `app/admin/editor/[id]/EditorClient.js`

This is the main client component. It renders the two-column layout: left column (headline picker, TipTap editor, image section, sources list) and right sticky sidebar (SEO fields, quality flags, action buttons).

- [ ] **Step 1: Create `EditorClient.js`**

Create `app/admin/editor/[id]/EditorClient.js` with this exact content:

```js
'use client'
import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from 'next/link'

/* ── Spinner (matches admin panel) ────────────────────────── */
function Spinner({ size = 13 }) {
  return (
    <span style={{
      display: 'inline-block',
      width: `${size}px`, height: `${size}px`,
      border: '2px solid #2a2a2a',
      borderTopColor: '#d4a853',
      borderRadius: '50%',
      animation: 'editor-spin 0.75s linear infinite',
      flexShrink: 0,
    }} />
  )
}

/* ── Tag pill input ────────────────────────────────────────── */
function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')

  const add = (raw) => {
    const val = raw.trim().replace(/,$/, '')
    if (val && !tags.includes(val)) onChange([...tags, val])
    setInput('')
  }

  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
    if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1))
  }

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '6px',
      padding: '8px 10px', borderRadius: '4px',
      border: '1px solid rgba(237,232,223,0.11)',
      background: '#0e0d0c', cursor: 'text',
      minHeight: '42px', alignItems: 'center',
    }}>
      {tags.map((tag, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          background: '#1e1c1a', border: '1px solid rgba(237,232,223,0.11)',
          color: '#ede8df', fontSize: '12px', padding: '2px 8px', borderRadius: '3px',
        }}>
          {tag}
          <button
            onClick={() => onChange(tags.filter((_, j) => j !== i))}
            style={{ background: 'none', border: 'none', color: '#8c857c', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '14px' }}
          >×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => { if (input.trim()) add(input) }}
        placeholder={tags.length ? '' : 'Taip tag + Enter…'}
        style={{
          flex: 1, minWidth: '100px', background: 'none', border: 'none', outline: 'none',
          color: '#ede8df', fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
        }}
      />
    </div>
  )
}

/* ── TipTap toolbar ────────────────────────────────────────── */
function Toolbar({ editor }) {
  if (!editor) return null

  const btn = (label, action, isActive) => (
    <button
      key={label}
      onMouseDown={e => { e.preventDefault(); action() }}
      style={{
        padding: '4px 10px', borderRadius: '3px', fontSize: '12.5px', fontWeight: 600,
        cursor: 'pointer', border: '1px solid rgba(237,232,223,0.11)',
        background: isActive ? '#2a2520' : 'transparent',
        color: isActive ? '#d4a853' : '#8c857c',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >{label}</button>
  )

  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
      {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      {btn('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
      {btn('• Senarai', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
      {btn('1. Senarai', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
    </div>
  )
}

/* ── Quality flags verdict colour ──────────────────────────── */
function verdictColor(verdict) {
  if (!verdict) return '#8c857c'
  const v = verdict.toLowerCase()
  if (v === 'publish') return '#10b981'
  if (v === 'review') return '#d4a853'
  if (v === 'reject') return '#ef4444'
  return '#8c857c'
}

/* ── Section label ─────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: '#56514d', marginBottom: '8px',
    }}>
      {children}
    </div>
  )
}

/* ── Input styles ──────────────────────────────────────────── */
const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: '4px',
  border: '1px solid rgba(237,232,223,0.11)', background: '#0e0d0c',
  color: '#ede8df', fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box',
}

/* ── Main EditorClient component ───────────────────────────── */
export default function EditorClient({ article }) {
  const headlines = article.headline_options ?? []

  // Determine initial selected index
  const initIdx = headlines.indexOf(article.title)
  const [selectedIdx, setSelectedIdx] = useState(initIdx >= 0 ? initIdx : 0)
  const [customHeadline, setCustomHeadline] = useState(
    initIdx < 0 && article.title ? article.title : ''
  )

  // SEO fields
  const [slug, setSlug] = useState(article.slug ?? '')
  const [metaDescription, setMetaDescription] = useState(article.meta_description ?? '')
  const [tags, setTags] = useState(article.tags ?? [])

  // Save state
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | error

  // TipTap
  const editor = useEditor({
    extensions: [StarterKit],
    content: article.body ?? '',
  })

  const getTitle = () => {
    if (customHeadline.trim()) return customHeadline.trim()
    return headlines[selectedIdx] ?? article.title ?? ''
  }

  const save = async (newStatus) => {
    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: getTitle(),
          body: editor?.getHTML() ?? article.body ?? '',
          slug,
          meta_description: metaDescription,
          tags,
          status: newStatus,
        }),
      })
      if (!res.ok) throw new Error('Gagal')
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const qf = article.quality_flags ?? {}
  const sources = article.sources ?? []

  return (
    <div style={{ minHeight: '100vh', background: '#0c0b0a', fontFamily: "'DM Sans', sans-serif", color: '#ede8df' }}>
      <style>{`
        @keyframes editor-spin { to { transform: rotate(360deg); } }
        .tiptap-editor { outline: none; min-height: 400px; font-size: 15px; line-height: 1.75; color: #ede8df; }
        .tiptap-editor h2 { font-family: 'Fraunces', serif; font-size: 22px; margin: 24px 0 8px; color: #ede8df; }
        .tiptap-editor h3 { font-family: 'Fraunces', serif; font-size: 18px; margin: 20px 0 6px; color: #ede8df; }
        .tiptap-editor p { margin: 0 0 14px; }
        .tiptap-editor ul, .tiptap-editor ol { padding-left: 20px; margin: 0 0 14px; }
        .tiptap-editor strong { color: #f0ebe2; }
        .tiptap-editor em { color: #c0b8ae; }
        .tiptap-editor p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #3a3530; pointer-events: none; float: left; height: 0; }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(237,232,223,0.07)',
        padding: '0 32px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, background: '#0c0b0a', zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin" style={{ color: '#56514d', fontSize: '13px', textDecoration: 'none' }}>
            ← Admin
          </Link>
          <span style={{ color: '#2a2520' }}>|</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#8c857c' }}>
            Penyunting Artikel
          </span>
        </div>

        {/* Save buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => save('draft')}
            disabled={saveStatus === 'saving'}
            style={{
              padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
              border: '1px solid rgba(237,232,223,0.11)', background: 'transparent',
              color: saveStatus === 'error' ? '#ef4444' : saveStatus === 'saved' ? '#10b981' : '#8c857c',
              cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
            }}
          >
            {saveStatus === 'saving' && <Spinner size={12} />}
            {saveStatus === 'saved' ? 'Tersimpan ✓' : saveStatus === 'error' ? 'Ralat ✗' : 'Simpan Draf'}
          </button>
          <button
            onClick={() => save('published')}
            disabled={saveStatus === 'saving'}
            style={{
              padding: '7px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
              border: 'none', background: saveStatus === 'saving' ? '#3a3020' : '#d4a853',
              color: saveStatus === 'saving' ? '#8c7040' : '#0c0b0a',
              cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
            }}
          >
            {saveStatus === 'saving' && <Spinner size={12} />}
            Terbit Sekarang
          </button>
        </div>
      </header>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '0', maxWidth: '1400px', margin: '0 auto' }}>

        {/* ── Left column ── */}
        <main style={{ padding: '36px 40px', borderRight: '1px solid rgba(237,232,223,0.07)' }}>

          {/* 1. Headline picker */}
          <section style={{ marginBottom: '40px' }}>
            <SectionLabel>Pilih Tajuk</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {headlines.map((h, i) => (
                <label key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px 16px', borderRadius: '4px', cursor: 'pointer',
                  border: `1px solid ${selectedIdx === i && !customHeadline ? '#d4a853' : 'rgba(237,232,223,0.07)'}`,
                  background: selectedIdx === i && !customHeadline ? '#1a160e' : '#111010',
                }}>
                  <input
                    type="radio"
                    name="headline"
                    checked={selectedIdx === i && !customHeadline}
                    onChange={() => { setSelectedIdx(i); setCustomHeadline('') }}
                    style={{ marginTop: '2px', accentColor: '#d4a853', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '15px', lineHeight: 1.5, fontFamily: "'Fraunces', serif", color: '#ede8df' }}>
                    {h}
                  </span>
                </label>
              ))}

              {/* Custom headline */}
              <div style={{ marginTop: '4px' }}>
                <SectionLabel>Tajuk Custom</SectionLabel>
                <input
                  type="text"
                  value={customHeadline}
                  onChange={e => setCustomHeadline(e.target.value)}
                  placeholder="Tulis tajuk sendiri…"
                  style={{
                    ...inputStyle,
                    border: `1px solid ${customHeadline ? '#d4a853' : 'rgba(237,232,223,0.11)'}`,
                    background: customHeadline ? '#1a160e' : '#0e0d0c',
                    fontSize: '15px', fontFamily: "'Fraunces', serif",
                  }}
                />
              </div>
            </div>
          </section>

          {/* 2. TipTap body editor */}
          <section style={{ marginBottom: '40px' }}>
            <SectionLabel>Kandungan Artikel</SectionLabel>
            <div style={{
              border: '1px solid rgba(237,232,223,0.11)', borderRadius: '4px',
              background: '#0e0d0c', padding: '16px',
            }}>
              <Toolbar editor={editor} />
              <div style={{ borderTop: '1px solid rgba(237,232,223,0.07)', paddingTop: '16px' }}>
                <EditorContent editor={editor} className="tiptap-editor" />
              </div>
            </div>
          </section>

          {/* 3. Image section */}
          <section style={{ marginBottom: '40px' }}>
            <SectionLabel>Imej Hero</SectionLabel>
            {article.image_brief && (
              <div style={{
                padding: '14px 16px', borderRadius: '4px', marginBottom: '12px',
                background: '#111010', border: '1px solid rgba(237,232,223,0.07)',
                borderLeft: '3px solid #d4a853',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#56514d', marginBottom: '6px' }}>
                  Cadangan AI
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#8c857c', lineHeight: 1.6 }}>
                  {article.image_brief}
                </p>
              </div>
            )}
            <div style={{
              border: '2px dashed rgba(237,232,223,0.07)', borderRadius: '4px',
              padding: '32px', textAlign: 'center', color: '#3a3530',
              fontSize: '13px', background: '#0e0d0c',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>↑</div>
              Muat naik imej (akan datang)
            </div>
          </section>

          {/* 4. Sources */}
          {sources.length > 0 && (
            <section style={{ marginBottom: '40px' }}>
              <SectionLabel>Sumber ({sources.length})</SectionLabel>
              <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sources.map((src, i) => (
                  <li key={i}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#ede8df', marginBottom: '2px' }}>{src.title}</div>
                    {src.description && (
                      <div style={{ fontSize: '12.5px', color: '#56514d', lineHeight: 1.5 }}>{src.description}</div>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </main>

        {/* ── Right sidebar ── */}
        <aside style={{ padding: '36px 28px', position: 'sticky', top: '60px', alignSelf: 'start', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>

          {/* SEO fields */}
          <section style={{ marginBottom: '32px' }}>
            <SectionLabel>SEO</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: '#56514d', marginBottom: '5px' }}>Slug</div>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: '#56514d', marginBottom: '5px' }}>Meta Deskripsi</div>
                <textarea
                  value={metaDescription}
                  onChange={e => setMetaDescription(e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: '#56514d', marginBottom: '5px' }}>Tag</div>
                <TagInput tags={tags} onChange={setTags} />
              </div>
            </div>
          </section>

          {/* Quality flags */}
          {Object.keys(qf).length > 0 && (
            <section style={{ marginBottom: '32px' }}>
              <SectionLabel>Laporan Kualiti</SectionLabel>
              <div style={{
                background: '#111010', border: '1px solid rgba(237,232,223,0.07)',
                borderRadius: '4px', padding: '14px 16px',
              }}>
                {/* Verdict + score */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '13px', fontWeight: 700, textTransform: 'capitalize',
                    color: verdictColor(qf.verdict),
                  }}>
                    {qf.verdict ?? '—'}
                  </span>
                  {qf.overall_score != null && (
                    <span style={{
                      fontSize: '22px', fontWeight: 700, fontFamily: "'Fraunces', serif",
                      color: qf.overall_score >= 70 ? '#10b981' : qf.overall_score >= 50 ? '#d4a853' : '#ef4444',
                    }}>
                      {qf.overall_score}<span style={{ fontSize: '13px', color: '#56514d' }}>/100</span>
                    </span>
                  )}
                </div>

                {/* Required fixes */}
                {qf.required_fixes?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#56514d', marginBottom: '6px' }}>
                      Perlu Diperbaiki
                    </div>
                    <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {qf.required_fixes.map((fix, i) => (
                        <li key={i} style={{ fontSize: '12.5px', color: '#8c857c', lineHeight: 1.5 }}>{fix}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Publish readiness */}
                {qf.publish_readiness != null && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#56514d' }}>
                    Kesediaan terbit: <span style={{ color: '#8c857c' }}>{qf.publish_readiness}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Mobile-accessible save buttons (duplicate for sidebar) */}
          <section>
            <SectionLabel>Tindakan</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => save('draft')}
                disabled={saveStatus === 'saving'}
                style={{
                  width: '100%', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                  border: '1px solid rgba(237,232,223,0.11)', background: 'transparent',
                  color: saveStatus === 'error' ? '#ef4444' : saveStatus === 'saved' ? '#10b981' : '#8c857c',
                  cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                }}
              >
                {saveStatus === 'saving' && <Spinner size={12} />}
                {saveStatus === 'saved' ? 'Tersimpan ✓' : saveStatus === 'error' ? 'Ralat ✗' : 'Simpan Draf'}
              </button>
              <button
                onClick={() => save('published')}
                disabled={saveStatus === 'saving'}
                style={{
                  width: '100%', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                  border: 'none', background: saveStatus === 'saving' ? '#3a3020' : '#d4a853',
                  color: saveStatus === 'saving' ? '#8c7040' : '#0c0b0a',
                  cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                }}
              >
                {saveStatus === 'saving' && <Spinner size={12} />}
                Terbit Sekarang
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify file exists**

```bash
ls "app/admin/editor/[id]/EditorClient.js"
```

- [ ] **Step 3: Commit**

```bash
git add "app/admin/editor/"
git commit -m "feat: add article editor client component"
```

---

## Task 5: Link ready_to_review articles from admin list

**Files:**
- Modify: `app/admin/AdminClient.js`

The article title cell currently renders as plain text. We need to wrap `ready_to_review` titles in a Next.js `Link` to `/admin/editor/[id]`.

- [ ] **Step 1: Add Link import at the top of AdminClient.js**

In `app/admin/AdminClient.js`, line 2 currently reads:
```js
import { useState, useEffect, useRef } from 'react'
```

Add the Link import after it:
```js
import Link from 'next/link'
```

- [ ] **Step 2: Replace the article title cell in the articles map**

Find this block (around line 361–368):
```jsx
<div>
  <div style={{ fontSize: '14px', fontWeight: 500, color: '#e0e0e0', lineHeight: 1.4 }}>
    {article.title ?? <span style={{ color: '#444', fontStyle: 'italic' }}>Tanpa tajuk</span>}
  </div>
  {article.slug && (
    <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>/artikel/{article.slug}</div>
  )}
</div>
```

Replace it with:
```jsx
<div>
  <div style={{ fontSize: '14px', fontWeight: 500, color: '#e0e0e0', lineHeight: 1.4 }}>
    {article.status === 'ready_to_review' && article.title ? (
      <Link
        href={`/admin/editor/${article.id}`}
        style={{ color: '#d4a853', textDecoration: 'none' }}
        onMouseEnter={e => e.target.style.textDecoration = 'underline'}
        onMouseLeave={e => e.target.style.textDecoration = 'none'}
      >
        {article.title}
      </Link>
    ) : (
      article.title ?? <span style={{ color: '#444', fontStyle: 'italic' }}>Tanpa tajuk</span>
    )}
  </div>
  {article.slug && (
    <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>/artikel/{article.slug}</div>
  )}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/AdminClient.js
git commit -m "feat: link ready_to_review articles to editor"
```

---

## Task 6: Manual end-to-end verification

- [ ] **Step 1: Start both dev servers**

Terminal 1:
```bash
npm run dev
```
Terminal 2:
```bash
npx inngest-cli@latest dev
```

- [ ] **Step 2: Log in to admin panel**

Navigate to `http://localhost:3000/admin` and log in with password `sharpable2025`.

- [ ] **Step 3: Verify editor link appears**

In the article list, any article with `status = 'ready_to_review'` should have its title rendered as an amber link. Click it — should navigate to `/admin/editor/[id]`.

- [ ] **Step 4: Verify editor loads correctly**

On the editor page, confirm:
- 3 headline radio buttons are shown (or the article's current title is preselected)
- TipTap editor is pre-loaded with article body content
- Sidebar shows slug, meta description, and tags fields populated
- Quality flags panel shows score and verdict (if `quality_flags` is populated)
- Sources list is visible (if `sources` is populated)

- [ ] **Step 5: Test headline selection**

Click each radio button — verify the border highlights amber on the selected one. Type in the custom headline field — verify it clears the radio selection.

- [ ] **Step 6: Test TipTap**

Click in the editor body area. Make a change (bold some text, add a heading). Verify toolbar buttons highlight when active.

- [ ] **Step 7: Test tag input**

Click the tag input area. Type a word and press Enter — verify a pill appears. Click `×` on a pill — verify it's removed.

- [ ] **Step 8: Test Save as Draft**

Click "Simpan Draf". Verify:
- Button shows spinner briefly
- Button shows "Tersimpan ✓" in green
- In Supabase dashboard, the article's `title`, `body`, `slug`, `meta_description`, `tags`, and `status = 'draft'` are updated

- [ ] **Step 9: Test Publish**

Click "Terbit Sekarang". Verify the article's `status` updates to `published` in Supabase.

- [ ] **Step 10: Test auth guard**

In a new incognito window, navigate directly to `/admin/editor/[some-id]` — should show the login form, not the editor.
