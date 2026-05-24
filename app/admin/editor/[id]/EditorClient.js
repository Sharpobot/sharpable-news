'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import ConfirmationModal from '@/components/admin/ConfirmationModal'

/* ── Spinner ───────────────────────────────────────────────── */
function Spinner({ size = 13 }) {
  return (
    <span style={{
      display: 'inline-block', width: `${size}px`, height: `${size}px`,
      border: '2px solid #2a2a2a', borderTopColor: '#d4a853',
      borderRadius: '50%', animation: 'editor-spin 0.75s linear infinite', flexShrink: 0,
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
      display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 10px',
      borderRadius: '4px', border: '1px solid rgba(237,232,223,0.11)',
      background: '#0e0d0c', cursor: 'text', minHeight: '42px', alignItems: 'center',
    }}>
      {tags.map((tag, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          background: '#1e1c1a', border: '1px solid rgba(237,232,223,0.11)',
          color: '#ede8df', fontSize: '12px', padding: '2px 8px', borderRadius: '3px',
        }}>
          {tag}
          <button onClick={() => onChange(tags.filter((_, j) => j !== i))}
            style={{ background: 'none', border: 'none', color: '#8c857c', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '14px' }}>×</button>
        </span>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
        onBlur={() => { if (input.trim()) add(input) }}
        placeholder={tags.length ? '' : 'Taip tag + Enter…'}
        style={{ flex: 1, minWidth: '100px', background: 'none', border: 'none', outline: 'none', color: '#ede8df', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}
      />
    </div>
  )
}

/* ── TipTap toolbar ────────────────────────────────────────── */
function Toolbar({ editor }) {
  if (!editor) return null
  const btn = (label, action, isActive) => (
    <button key={label} onMouseDown={e => { e.preventDefault(); action() }} style={{
      padding: '4px 10px', borderRadius: '3px', fontSize: '12.5px', fontWeight: 600,
      cursor: 'pointer', border: '1px solid rgba(237,232,223,0.11)',
      background: isActive ? '#2a2520' : 'transparent',
      color: isActive ? '#d4a853' : '#8c857c',
      fontFamily: "'DM Sans', sans-serif",
    }}>{label}</button>
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
function verdictColor(v) {
  if (!v) return '#8c857c'
  const lv = v.toLowerCase()
  if (lv === 'publish') return '#10b981'
  if (lv === 'review')  return '#d4a853'
  if (lv === 'reject')  return '#ef4444'
  return '#8c857c'
}

/* ── Section label ─────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#56514d', marginBottom: '8px' }}>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: '4px',
  border: '1px solid rgba(237,232,223,0.11)', background: '#0e0d0c',
  color: '#ede8df', fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box',
}

/* ── Mobile AI Brief bottom sheet ─────────────────────────── */
function AIBriefModal({ brief, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#161412', border: '1px solid rgba(237,232,223,0.11)', borderRadius: '12px 12px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: '600px', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#56514d' }}>Cadangan AI</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#56514d', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '4px' }}>×</button>
        </div>
        <p style={{ margin: 0, fontSize: '14px', color: '#8c857c', lineHeight: 1.7 }}>{brief}</p>
      </motion.div>
    </motion.div>
  )
}

/* ── Save / SEO / Quality content blocks (reused in both layouts) ── */
function SEOFields({ slug, setSlug, metaDescription, setMetaDescription, tags, setTags }) {
  return (
    <section style={{ marginBottom: '32px' }}>
      <SectionLabel>SEO</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '11.5px', color: '#56514d', marginBottom: '5px' }}>Slug</div>
          <input type="text" value={slug} onChange={e => setSlug(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: '11.5px', color: '#56514d', marginBottom: '5px' }}>Meta Deskripsi</div>
          <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        </div>
        <div>
          <div style={{ fontSize: '11.5px', color: '#56514d', marginBottom: '5px' }}>Tag</div>
          <TagInput tags={tags} onChange={setTags} />
        </div>
      </div>
    </section>
  )
}

function QualityPanel({ qf }) {
  if (!Object.keys(qf).length) return null
  return (
    <section style={{ marginBottom: '32px' }}>
      <SectionLabel>Laporan Kualiti</SectionLabel>
      <div style={{ background: '#111010', border: '1px solid rgba(237,232,223,0.07)', borderRadius: '4px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'capitalize', color: verdictColor(qf.verdict) }}>
            {qf.verdict ?? '—'}
          </span>
          {qf.overall_score != null && (
            <span style={{ fontSize: '22px', fontWeight: 700, fontFamily: "'Fraunces', serif", color: qf.overall_score >= 70 ? '#10b981' : qf.overall_score >= 50 ? '#d4a853' : '#ef4444' }}>
              {qf.overall_score}<span style={{ fontSize: '13px', color: '#56514d' }}>/100</span>
            </span>
          )}
        </div>
        {qf.required_fixes?.length > 0 && (
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#56514d', marginBottom: '6px' }}>Perlu Diperbaiki</div>
            <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {qf.required_fixes.map((fix, i) => (
                <li key={i} style={{ fontSize: '12.5px', color: '#8c857c', lineHeight: 1.5 }}>{fix}</li>
              ))}
            </ul>
          </div>
        )}
        {qf.publish_readiness != null && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#56514d' }}>
            Kesediaan terbit: <span style={{ color: '#8c857c' }}>{qf.publish_readiness}</span>
          </div>
        )}
      </div>
    </section>
  )
}

function SaveButtons({ saveStatus, onDraft, onPublish }) {
  return (
    <section>
      <SectionLabel>Tindakan</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button onClick={onDraft} disabled={saveStatus === 'saving'} style={{
          width: '100%', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
          border: '1px solid rgba(237,232,223,0.11)', background: 'transparent', color: '#8c857c',
          cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {saveStatus === 'saving' && <Spinner size={12} />}
          Simpan Draf
        </button>
        <button onClick={onPublish} disabled={saveStatus === 'saving'} style={{
          width: '100%', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
          border: 'none', background: saveStatus === 'saving' ? '#3a3020' : '#d4a853',
          color: saveStatus === 'saving' ? '#8c7040' : '#0c0b0a',
          cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {saveStatus === 'saving' && <Spinner size={12} />}
          Terbit Sekarang
        </button>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════
   Main EditorClient
══════════════════════════════════════════════════════════════ */
export default function EditorClient({ article }) {
  const router    = useRouter()
  const headlines = article.headline_options ?? []

  const initIdx = headlines.indexOf(article.title)
  const [selectedIdx,    setSelectedIdx]    = useState(initIdx >= 0 ? initIdx : 0)
  const [customHeadline, setCustomHeadline] = useState(initIdx < 0 && article.title ? article.title : '')

  const [slug,            setSlug]            = useState(article.slug ?? '')
  const [metaDescription, setMetaDescription] = useState(article.meta_description ?? '')
  const [tags,            setTags]            = useState(article.tags ?? [])

  const [featuredImage, setFeaturedImage] = useState(article.featured_image ?? null)
  const [uploadStatus,  setUploadStatus]  = useState('idle')
  const [isDragging,    setIsDragging]    = useState(false)
  const fileInputRef = useRef(null)

  const [saveStatus, setSaveStatus] = useState('idle')
  const [isDirty,    setIsDirty]    = useState(false)
  const savedStateRef = useRef({ slug, metaDescription, tags, featuredImage })

  const [modal,       setModal]       = useState(null)
  const [pendingNav,  setPendingNav]  = useState(null)
  const [showBrief,   setShowBrief]   = useState(false)

  // Mobile tab state — tabs only affect mobile layout; desktop ignores this
  const [activeTab, setActiveTab] = useState('kandungan')

  const editor = useEditor({
    extensions: [StarterKit],
    content: article.body ?? '',
    onUpdate: () => setIsDirty(true),
  })

  useEffect(() => {
    const saved = savedStateRef.current
    if (slug !== saved.slug || metaDescription !== saved.metaDescription ||
        JSON.stringify(tags) !== JSON.stringify(saved.tags) ||
        featuredImage !== saved.featuredImage) {
      setIsDirty(true)
    }
  }, [slug, metaDescription, tags, featuredImage])

  useEffect(() => {
    const h = (e) => { if (!isDirty) return; e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [isDirty])

  const getTitle = useCallback(() => {
    if (customHeadline.trim()) return customHeadline.trim()
    return headlines[selectedIdx] ?? article.title ?? ''
  }, [customHeadline, selectedIdx, headlines, article.title])

  const save = async (newStatus) => {
    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: getTitle(), body: editor?.getHTML() ?? article.body ?? '',
          slug, meta_description: metaDescription, tags,
          featured_image: featuredImage, status: newStatus,
        }),
      })
      if (!res.ok) throw new Error()
      setIsDirty(false)
      savedStateRef.current = { slug, metaDescription, tags, featuredImage }
      setSaveStatus('idle')
      toast.success(newStatus === 'published' ? 'Artikel diterbitkan!' : 'Draf disimpan.')
    } catch {
      setSaveStatus('idle')
      toast.error('Gagal menyimpan artikel.')
    }
  }

  const uploadImage = async (file) => {
    setUploadStatus('uploading')
    const tid = toast.loading('Memuat naik gambar…')
    try {
      const fd = new FormData()
      fd.append('file', file); fd.append('articleId', article.id)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const { url, error } = await res.json()
      if (!res.ok || error) throw new Error(error)
      setFeaturedImage(url)
      setUploadStatus('idle')
      toast.success('Gambar berjaya dimuat naik.', { id: tid })
    } catch {
      setUploadStatus('error')
      toast.error('Muat naik gagal. Cuba lagi.', { id: tid })
      setTimeout(() => setUploadStatus('idle'), 4000)
    }
  }

  const handleBackClick = (e) => {
    if (isDirty) { e.preventDefault(); setPendingNav('/admin'); setModal('unsaved') }
  }

  const qf      = article.quality_flags ?? {}
  const sources = article.sources ?? []

  // CSS class helpers — only take effect inside the @media (max-width: 768px) block
  const mob = (tab) => activeTab === tab ? 'mob-tab-show' : 'mob-tab-hide'

  return (
    <div style={{ minHeight: '100vh', background: '#0c0b0a', fontFamily: "'DM Sans', sans-serif", color: '#ede8df' }}>
      <style>{`
        @keyframes editor-spin { to { transform: rotate(360deg); } }

        .tiptap-editor { outline: none; min-height: 320px; font-size: 15px; line-height: 1.75; color: #ede8df; }
        .tiptap-editor h2 { font-family: 'Fraunces', serif; font-size: 22px; margin: 24px 0 8px; }
        .tiptap-editor h3 { font-family: 'Fraunces', serif; font-size: 18px; margin: 20px 0 6px; }
        .tiptap-editor p  { margin: 0 0 14px; }
        .tiptap-editor ul, .tiptap-editor ol { padding-left: 20px; margin: 0 0 14px; }
        .tiptap-editor strong { color: #f0ebe2; }
        .tiptap-editor em { color: #c0b8ae; }

        /* ── Header ── */
        .editor-header {
          padding: 0 32px; height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; background: #0c0b0a; z-index: 20;
          border-bottom: 1px solid rgba(237,232,223,0.07);
        }
        .editor-header-title { display: flex; align-items: center; gap: 16px; min-width: 0; }
        .editor-header-label { font-size: 13px; font-weight: 600; color: #8c857c; white-space: nowrap; }
        .editor-header-sep   { color: #2a2520; }
        .editor-save-btns    { display: flex; gap: 10px; flex-shrink: 0; }

        /* ── Mobile tab bar (hidden on desktop) ── */
        .editor-tab-bar { display: none; }
        .editor-tab-btn {
          flex: 1; padding: 12px 8px; border: none; background: none;
          color: #56514d; font-size: 13px; font-weight: 600;
          border-bottom: 2px solid transparent; cursor: pointer;
          transition: color 0.1s, border-color 0.1s;
          font-family: "'DM Sans', sans-serif"; white-space: nowrap;
        }
        .editor-tab-btn.tab-active { color: #d4a853; border-bottom-color: #d4a853; }

        /* ── Desktop two-column layout ── */
        .editor-layout { display: grid; grid-template-columns: 1fr 340px; max-width: 1400px; margin: 0 auto; }
        .editor-main   { padding: 36px 40px; border-right: 1px solid rgba(237,232,223,0.07); }
        .editor-aside  { padding: 36px 28px; position: sticky; top: 60px; align-self: start; height: calc(100vh - 60px); overflow-y: auto; }

        .dirty-dot { width: 6px; height: 6px; border-radius: 50%; background: #d4a853; flex-shrink: 0; }

        /* ── Mobile overrides ── */
        @media (max-width: 768px) {
          .editor-header { padding: 0 16px; height: auto; min-height: 52px; flex-wrap: wrap; gap: 8px; padding-top: 8px; padding-bottom: 8px; }
          .editor-header-title { width: 100%; }
          .editor-header-label, .editor-header-sep { display: none; }
          .editor-save-btns { display: none; } /* buttons move to Semakan tab on mobile */

          .editor-tab-bar { display: flex; border-bottom: 1px solid rgba(237,232,223,0.07); background: #0c0b0a; overflow-x: auto; }
          .editor-layout  { display: block; }
          .editor-main    { padding: 20px 16px; border-right: none; }
          .editor-aside   { position: static; height: auto; padding: 0; }

          /* Tab visibility — these classes only take effect here */
          .mob-tab-hide { display: none; }
          .mob-tab-show { display: block; }

          /* Aside sections need padding when visible */
          .aside-section { padding: 20px 16px; }
        }
      `}</style>

      {/* ── Confirmation modals ── */}
      <ConfirmationModal open={modal === 'removeImage'} title="Buang Gambar Utama?" message="Gambar semasa akan dibuang secara kekal."
        confirmLabel="Ya, Buang" cancelLabel="Batal" confirmColor="red"
        onConfirm={() => { setFeaturedImage(null); setModal(null) }} onCancel={() => setModal(null)} />
      <ConfirmationModal open={modal === 'publish'} title="Terbitkan Artikel?" message="Artikel akan diterbitkan dan dapat dilihat oleh orang awam."
        confirmLabel="Ya, Terbitkan" cancelLabel="Semak Semula" confirmColor="amber"
        onConfirm={() => { setModal(null); save('published') }} onCancel={() => setModal(null)} />
      <ConfirmationModal open={modal === 'unsaved'} title="Perubahan Belum Disimpan" message="Perubahan anda akan hilang jika anda keluar tanpa menyimpan."
        confirmLabel="Keluar Tanpa Simpan" cancelLabel="Teruskan Edit" confirmColor="red"
        onConfirm={() => { setModal(null); setIsDirty(false); router.push(pendingNav ?? '/admin') }}
        onCancel={() => { setModal(null); setPendingNav(null) }} />

      <AnimatePresence>
        {showBrief && article.image_brief && (
          <AIBriefModal brief={article.image_brief} onClose={() => setShowBrief(false)} />
        )}
      </AnimatePresence>

      {/* ── Sticky header ── */}
      <header className="editor-header">
        <div className="editor-header-title">
          <Link href="/admin" onClick={handleBackClick}
            style={{ color: '#56514d', fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Admin
          </Link>
          {isDirty && <span className="dirty-dot" title="Ada perubahan belum disimpan" />}
          <span className="editor-header-sep">|</span>
          <span className="editor-header-label">Penyunting Artikel</span>
        </div>

        {/* Desktop save buttons (hidden on mobile — moved to Semakan tab) */}
        <div className="editor-save-btns">
          <button onClick={() => save('draft')} disabled={saveStatus === 'saving'} style={{
            padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
            border: '1px solid rgba(237,232,223,0.11)', background: 'transparent', color: '#8c857c',
            cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '7px',
          }}>
            {saveStatus === 'saving' && <Spinner size={12} />}
            Simpan Draf
          </button>
          <button onClick={() => setModal('publish')} disabled={saveStatus === 'saving'} style={{
            padding: '7px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
            border: 'none', background: saveStatus === 'saving' ? '#3a3020' : '#d4a853',
            color: saveStatus === 'saving' ? '#8c7040' : '#0c0b0a',
            cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '7px',
          }}>
            {saveStatus === 'saving' && <Spinner size={12} />}
            Terbit Sekarang
          </button>
        </div>
      </header>

      {/* ── Mobile tab bar (invisible on desktop via CSS) ── */}
      <div className="editor-tab-bar">
        {[
          { id: 'kandungan', label: 'Kandungan' },
          { id: 'seo',       label: 'SEO & Meta' },
          { id: 'semakan',   label: 'Semakan' },
        ].map(tab => (
          <button key={tab.id} className={`editor-tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Two-column layout (desktop) / tab-controlled blocks (mobile) ── */}
      <div className="editor-layout">

        {/* ── Left column / Kandungan tab ──
            On desktop: always visible (mob-tab-hide/show do nothing outside the @media block)
            On mobile: visible only when activeTab === 'kandungan' */}
        <main className={`editor-main ${mob('kandungan')}`}>

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
                  transition: 'border-color 0.15s, background 0.15s',
                }}>
                  <input type="radio" name="headline"
                    checked={selectedIdx === i && !customHeadline}
                    onChange={() => { setSelectedIdx(i); setCustomHeadline(''); setIsDirty(true) }}
                    style={{ marginTop: '2px', accentColor: '#d4a853', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '15px', lineHeight: 1.5, fontFamily: "'Fraunces', serif", color: '#ede8df' }}>{h}</span>
                </label>
              ))}
              <div style={{ marginTop: '4px' }}>
                <SectionLabel>Tajuk Custom</SectionLabel>
                <input type="text" value={customHeadline}
                  onChange={e => { setCustomHeadline(e.target.value); setIsDirty(true) }}
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

          {/* 2. Image section */}
          <section style={{ marginBottom: '40px' }}>
            <SectionLabel>Imej Hero</SectionLabel>

            {/* AI brief — desktop: inline; mobile: button */}
            {article.image_brief && (
              <>
                <div style={{ padding: '14px 16px', borderRadius: '4px', marginBottom: '12px', background: '#111010', border: '1px solid rgba(237,232,223,0.07)', borderLeft: '3px solid #d4a853' }}
                  className="hide-on-mobile">
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#56514d', marginBottom: '6px' }}>Cadangan AI</div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#8c857c', lineHeight: 1.6 }}>{article.image_brief}</p>
                </div>
                <button className="show-on-mobile" onClick={() => setShowBrief(true)} style={{
                  display: 'none', marginBottom: '12px', padding: '8px 14px', borderRadius: '6px',
                  border: '1px solid rgba(212,168,83,0.3)', background: 'rgba(212,168,83,0.06)',
                  color: '#d4a853', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  💡 Lihat Cadangan AI
                </button>
              </>
            )}

            {featuredImage ? (
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <img src={featuredImage} alt="Imej hero"
                  style={{ width: '100%', borderRadius: '4px', display: 'block', maxHeight: '300px', objectFit: 'cover' }} />
                <button onClick={() => setModal('removeImage')} style={{
                  position: 'absolute', top: '10px', right: '10px',
                  background: 'rgba(12,11,10,0.8)', border: '1px solid rgba(237,232,223,0.15)',
                  color: '#ede8df', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer',
                }}>× Tukar</button>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={async e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) await uploadImage(f) }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? '#d4a853' : 'rgba(237,232,223,0.11)'}`,
                  borderRadius: '4px', padding: '36px 24px', textAlign: 'center',
                  cursor: 'pointer', background: isDragging ? '#1a160e' : '#0e0d0c',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                {uploadStatus === 'uploading' ? (
                  <div style={{ color: '#8c857c', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Spinner size={14} />Memuat naik…
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.4 }}>↑</div>
                    <div style={{ fontSize: '13.5px', color: '#8c857c', marginBottom: '4px' }}>Seret & lepas imej, atau klik untuk pilih</div>
                    <div style={{ fontSize: '11.5px', color: '#3a3530' }}>JPG, PNG, WebP · Maks 8 MB</div>
                    {uploadStatus === 'error' && <div style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444' }}>Muat naik gagal. Cuba lagi.</div>}
                  </>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={async e => { const f = e.target.files?.[0]; if (f) await uploadImage(f); e.target.value = '' }} />
          </section>

          {/* 3. TipTap body editor
              IMPORTANT: always mounted (CSS show/hide) so content is never lost on tab switch */}
          <section style={{ marginBottom: '40px' }}>
            <SectionLabel>Kandungan Artikel</SectionLabel>
            <div style={{ border: '1px solid rgba(237,232,223,0.11)', borderRadius: '4px', background: '#0e0d0c', padding: '16px' }}>
              <Toolbar editor={editor} />
              <div style={{ borderTop: '1px solid rgba(237,232,223,0.07)', paddingTop: '16px' }}>
                <EditorContent editor={editor} className="tiptap-editor" />
              </div>
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
                    {src.description && <div style={{ fontSize: '12.5px', color: '#56514d', lineHeight: 1.5 }}>{src.description}</div>}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </main>

        {/* ── Right sidebar ──
            On desktop: always shown as a sticky column
            On mobile: split into two tabs ('seo' and 'semakan') via mob-tab-hide/show on each section */}
        <aside className="editor-aside">

          {/* SEO — desktop: always visible; mobile: visible on 'seo' tab */}
          <div className={`aside-section ${mob('seo')}`}>
            <SEOFields slug={slug} setSlug={setSlug} metaDescription={metaDescription}
              setMetaDescription={setMetaDescription} tags={tags} setTags={setTags} />
          </div>

          {/* Quality + Save — desktop: always visible; mobile: visible on 'semakan' tab */}
          <div className={`aside-section ${mob('semakan')}`}>
            <QualityPanel qf={qf} />
            <SaveButtons saveStatus={saveStatus}
              onDraft={() => save('draft')}
              onPublish={() => setModal('publish')} />
          </div>
        </aside>
      </div>

      {/* Global show/hide helpers for AI brief button */}
      <style>{`
        .hide-on-mobile { display: block; }
        .show-on-mobile { display: none; }
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
          .show-on-mobile { display: block !important; }
        }
      `}</style>
    </div>
  )
}
