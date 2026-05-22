'use client'
import { useState, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from 'next/link'
import toast from 'react-hot-toast'

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

  // Featured image
  const [featuredImage, setFeaturedImage]   = useState(article.featured_image ?? null)
  const [uploadStatus,  setUploadStatus]    = useState('idle') // idle | uploading | error
  const [isDragging,    setIsDragging]      = useState(false)
  const fileInputRef = useRef(null)

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
      setSaveStatus('idle')
      toast.success(newStatus === 'published' ? 'Artikel diterbitkan' : 'Draf disimpan')
    } catch {
      setSaveStatus('idle')
      toast.error('Gagal menyimpan artikel.')
    }
  }

  const uploadImage = async (file) => {
    setUploadStatus('uploading')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('articleId', article.id)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const { url, error } = await res.json()
      if (!res.ok || error) throw new Error(error ?? 'Gagal')
      setFeaturedImage(url)
      setUploadStatus('idle')
    } catch {
      setUploadStatus('error')
      setTimeout(() => setUploadStatus('idle'), 4000)
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

        .editor-header { padding: 0 32px; height: 60px; display: flex; align-items: center; justify-content: space-between; }
        .editor-header-title { display: flex; align-items: center; gap: 16px; min-width: 0; }
        .editor-header-label { font-size: 13px; font-weight: 600; color: #8c857c; white-space: nowrap; }
        .editor-header-sep { color: #2a2520; }
        .editor-save-buttons { display: flex; gap: 10px; flex-shrink: 0; }
        .editor-layout { display: grid; grid-template-columns: 1fr 340px; max-width: 1400px; margin: 0 auto; }
        .editor-main { padding: 36px 40px; border-right: 1px solid rgba(237,232,223,0.07); }
        .editor-aside { padding: 36px 28px; position: sticky; top: 60px; align-self: start; height: calc(100vh - 60px); overflow-y: auto; }

        @media (max-width: 768px) {
          .editor-header { padding: 0 16px; height: auto; min-height: 56px; flex-wrap: wrap; gap: 10px; padding-top: 10px; padding-bottom: 10px; }
          .editor-header-title { width: 100%; }
          .editor-header-label { display: none; }
          .editor-header-sep { display: none; }
          .editor-save-buttons { width: 100%; }
          .editor-save-buttons button { flex: 1; justify-content: center; padding: 9px 8px !important; font-size: 12px !important; }
          .editor-layout { grid-template-columns: 1fr; }
          .editor-main { padding: 20px 16px; border-right: none; border-bottom: 1px solid rgba(237,232,223,0.07); }
          .editor-aside { position: static; height: auto; padding: 20px 16px; overflow-y: visible; }
        }
      `}</style>

      {/* Header */}
      <header className="editor-header" style={{
        borderBottom: '1px solid rgba(237,232,223,0.07)',
        position: 'sticky', top: 0, background: '#0c0b0a', zIndex: 20,
      }}>
        <div className="editor-header-title">
          <Link href="/admin" style={{ color: '#56514d', fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            ← Admin
          </Link>
          <span className="editor-header-sep">|</span>
          <span className="editor-header-label">Penyunting Artikel</span>
        </div>

        {/* Save buttons */}
        <div className="editor-save-buttons">
          <button
            onClick={() => save('draft')}
            disabled={saveStatus === 'saving'}
            style={{
              padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
              border: '1px solid rgba(237,232,223,0.11)', background: 'transparent',
              color: '#8c857c',
              cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
            }}
          >
            {saveStatus === 'saving' && <Spinner size={12} />}
            Simpan Draf
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
      <div className="editor-layout">

        {/* ── Left column ── */}
        <main className="editor-main">

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

            {/* AI brief callout */}
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

            {/* Current image preview */}
            {featuredImage && (
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <img
                  src={featuredImage}
                  alt="Imej hero"
                  style={{ width: '100%', borderRadius: '4px', display: 'block', maxHeight: '340px', objectFit: 'cover' }}
                />
                <button
                  onClick={() => setFeaturedImage(null)}
                  style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'rgba(12,11,10,0.8)', border: '1px solid rgba(237,232,223,0.15)',
                    color: '#ede8df', borderRadius: '4px', padding: '4px 10px',
                    fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  × Tukar
                </button>
              </div>
            )}

            {/* Drop zone */}
            {!featuredImage && (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={async e => {
                  e.preventDefault()
                  setIsDragging(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) await uploadImage(file)
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? '#d4a853' : 'rgba(237,232,223,0.11)'}`,
                  borderRadius: '4px', padding: '40px 24px', textAlign: 'center',
                  cursor: 'pointer', background: isDragging ? '#1a160e' : '#0e0d0c',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                {uploadStatus === 'uploading' ? (
                  <div style={{ color: '#8c857c', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Spinner size={14} />
                    Memuat naik…
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.4 }}>↑</div>
                    <div style={{ fontSize: '13.5px', color: '#8c857c', marginBottom: '4px' }}>
                      Seret & lepas imej di sini, atau klik untuk pilih
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#3a3530' }}>
                      JPG, PNG, WebP · Maks 8 MB
                    </div>
                    {uploadStatus === 'error' && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444' }}>
                        Muat naik gagal. Cuba lagi.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async e => {
                const file = e.target.files?.[0]
                if (file) await uploadImage(file)
                e.target.value = ''
              }}
            />
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
        <aside className="editor-aside">

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

          {/* Sidebar save buttons */}
          <section>
            <SectionLabel>Tindakan</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => save('draft')}
                disabled={saveStatus === 'saving'}
                style={{
                  width: '100%', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                  border: '1px solid rgba(237,232,223,0.11)', background: 'transparent',
                  color: '#8c857c',
                  cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                }}
              >
                {saveStatus === 'saving' && <Spinner size={12} />}
                Simpan Draf
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
