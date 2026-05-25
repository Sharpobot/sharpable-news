'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
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
function Toolbar({ editor, onInsertImage }) {
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
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'center' }}>
      {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      {btn('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
      {btn('• Senarai', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
      {btn('1. Senarai', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
      {/* Image insert button */}
      <button onMouseDown={e => { e.preventDefault(); onInsertImage() }} title="Sisip Imej" style={{
        padding: '4px 8px', borderRadius: '3px', cursor: 'pointer',
        border: '1px solid rgba(237,232,223,0.11)', background: 'transparent', color: '#8c857c',
        display: 'flex', alignItems: 'center', lineHeight: 1,
      }}>
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </button>
    </div>
  )
}

/* ── Quality flags helpers ─────────────────────────────────── */
function verdictColor(v) {
  if (!v) return '#8c857c'
  const lv = v.toLowerCase()
  if (lv === 'publish') return '#10b981'
  if (lv === 'review')  return '#d4a853'
  if (lv === 'reject')  return '#ef4444'
  return '#8c857c'
}

const VERDICT_LABEL = {
  publish: 'Lulus Semak',
  review:  'Perlu Semakan',
  reject:  'Gagal Semak',
}

/* ── Fix item with WAJIB highlight + truncate ─────────────── */
function FixItem({ text }) {
  const [expanded, setExpanded] = useState(false)
  const isWajib   = text.startsWith('WAJIB:')
  const truncate  = text.length > 100 && !expanded
  const btnStyle  = {
    background: 'none', border: 'none', color: '#56514d', cursor: 'pointer',
    fontSize: '11.5px', padding: '0 0 0 4px', fontFamily: "'DM Sans', sans-serif",
  }

  if (isWajib) {
    const rest = text.slice('WAJIB:'.length)
    const restDisplay = truncate ? rest.slice(0, 94) + '…' : rest
    return (
      <li style={{ fontSize: '12.5px', lineHeight: 1.55, color: '#8c857c' }}>
        <span style={{ color: '#d4a853', fontWeight: 700 }}>WAJIB:</span>
        {restDisplay}
        {text.length > 100 && (
          <button onClick={() => setExpanded(v => !v)} style={btnStyle}>
            {expanded ? 'Tutup' : 'Baca lagi'}
          </button>
        )}
      </li>
    )
  }

  return (
    <li style={{ fontSize: '12.5px', lineHeight: 1.55, color: '#8c857c' }}>
      {truncate ? text.slice(0, 100) + '…' : text}
      {text.length > 100 && (
        <button onClick={() => setExpanded(v => !v)} style={btnStyle}>
          {expanded ? 'Tutup' : 'Baca lagi'}
        </button>
      )}
    </li>
  )
}

/* ── Quality flags panel (progressive disclosure) ──────────── */
function QualityPanel({ qf, originalQf }) {
  if (!qf || !Object.keys(qf).length) return null

  const [expanded,        setExpanded]        = useState(false)
  const [correctionsOpen, setCorrectionsOpen] = useState(false)

  const hasRevision    = !!(originalQf && Object.keys(originalQf).length)
  const score          = qf.overall_score
  const scoreColor     = score >= 70 ? '#10b981' : score >= 50 ? '#d4a853' : '#ef4444'
  const verdictLabel   = VERDICT_LABEL[qf.verdict] ?? qf.verdict ?? '—'

  const attentionItems = qf.required_fixes ?? []
  const correctionItems = hasRevision ? (qf.corrections_made ?? []) : []

  // Summary line
  const issuesFound    = hasRevision
    ? (originalQf.required_fixes?.length ?? 0)
    : attentionItems.length
  const corrsMade      = correctionItems.length
  const remaining      = attentionItems.length

  const summaryParts = []
  if (issuesFound > 0)   summaryParts.push(`${issuesFound} isu ditemui`)
  if (corrsMade > 0)     summaryParts.push(`${corrsMade} diperbetulkan`)
  if (remaining > 0)     summaryParts.push(`${remaining} perlu perhatian`)
  else if (issuesFound > 0) summaryParts.push('semua diperbetulkan')
  const summaryLine = summaryParts.join(' · ') || 'Tiada isu ditemui'

  return (
    <section style={{ marginBottom: '32px' }}>
      <SectionLabel>Laporan Kualiti</SectionLabel>
      <div style={{ background: '#111010', border: '1px solid rgba(237,232,223,0.07)', borderRadius: '6px', padding: '16px' }}>

        {/* Compact header — always visible */}
        {/* Row 1: verdict label + toggle button (no score here — avoids wrapping) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: verdictColor(qf.verdict), minWidth: 0 }}>
            {verdictLabel}
          </span>
          <button onClick={() => setExpanded(v => !v)} style={{
            flexShrink: 0, background: 'none', border: '1px solid rgba(237,232,223,0.11)',
            color: '#56514d', fontSize: '11px', cursor: 'pointer', padding: '4px 10px',
            borderRadius: '4px', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
          }}>
            {expanded ? 'Tutup' : 'Lihat Laporan'}
          </button>
        </div>
        {/* Row 2: score */}
        {score != null && (
          <div style={{ marginBottom: '4px' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: '12px', color: '#56514d', fontWeight: 400, marginLeft: '2px' }}>/100</span>
          </div>
        )}
        {/* Row 3: summary */}
        <div style={{ fontSize: '11.5px', color: '#56514d' }}>{summaryLine}</div>

        {/* Expanded detail */}
        {expanded && (
          <div style={{ marginTop: '16px', borderTop: '1px solid rgba(237,232,223,0.07)', paddingTop: '16px' }}>

            {/* Perlu Perhatian Anda */}
            <div style={{ marginBottom: hasRevision && correctionItems.length > 0 ? '14px' : 0 }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#d4a853', marginBottom: '8px' }}>
                Perlu Perhatian Anda
              </div>
              {attentionItems.length > 0 ? (
                <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {attentionItems.map((fix, i) => <FixItem key={i} text={fix} />)}
                </ul>
              ) : (
                <div style={{ fontSize: '12.5px', color: '#10b981' }}>Tiada isu kritikal</div>
              )}
            </div>

            {/* Diperbetulkan oleh AI — only if revision ran and made corrections */}
            {hasRevision && correctionItems.length > 0 && (
              <div>
                <button onClick={() => setCorrectionsOpen(v => !v)} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                  color: '#10b981', fontSize: '10.5px', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif",
                }}>
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                    style={{ transition: 'transform 0.15s', transform: correctionsOpen ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  Diperbetulkan oleh AI ({correctionItems.length})
                </button>
                {correctionsOpen && (
                  <ul style={{ margin: '6px 0 0', padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {correctionItems.map((c, i) => (
                      <li key={i} style={{ fontSize: '12px', color: '#10b981', lineHeight: 1.5 }}>
                        {c.length > 120 ? c.slice(0, 120) + '…' : c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
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

/* ── Image Crop Modal ──────────────────────────────────────── */
function CropModal({ src, onConfirm, onCancel }) {
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const imgRef = useRef(null)

  const onImageLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    const c = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 16 / 9, w, h), w, h)
    setCrop(c)
  }

  const handleConfirm = () => {
    if (!completedCrop || !imgRef.current) return
    const canvas = document.createElement('canvas')
    const img = imgRef.current
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height
    canvas.width  = 1280
    canvas.height = 720
    const ctx = canvas.getContext('2d')
    ctx.drawImage(
      img,
      completedCrop.x * scaleX, completedCrop.y * scaleY,
      completedCrop.width * scaleX, completedCrop.height * scaleY,
      0, 0, 1280, 720,
    )
    canvas.toBlob((blob) => {
      if (blob) onConfirm(new File([blob], 'featured-image.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9100, background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '20px', fontFamily: "'DM Sans', sans-serif",
      }}>
      <div style={{ background: '#1e1c1a', border: '1px solid rgba(237,232,223,0.15)', borderRadius: '10px', padding: '20px', width: '100%', maxWidth: '700px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8c857c', marginBottom: '12px' }}>
          Potong Imej — Nisbah 16:9
        </div>
        <div style={{
          background: '#111010', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px',
        }}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={16 / 9}
            style={{ maxWidth: '100%' }}
          >
            <img ref={imgRef} src={src} onLoad={onImageLoad}
              style={{ maxWidth: '100%', maxHeight: '52vh', display: 'block', margin: '0 auto' }}
              alt="Potong imej" />
          </ReactCrop>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '8px 18px', borderRadius: '6px', border: '1px solid rgba(237,232,223,0.11)',
            background: 'transparent', color: '#8c857c', fontSize: '13px', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>Batal</button>
          <button onClick={handleConfirm} style={{
            padding: '8px 18px', borderRadius: '6px', border: 'none',
            background: '#d4a853', color: '#0c0b0a', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>Gunakan Imej</button>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Inline Image Modal ────────────────────────────────────── */
function InlineImageModal({ articleId, onInsert, onClose }) {
  const [tab,       setTab]       = useState('upload') // 'upload' | 'url'
  const [url,       setUrl]       = useState('')
  const [alt,       setAlt]       = useState('')
  const [caption,   setCaption]   = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handleFileUpload = async (file) => {
    if (!file) return
    setUploading(true); setUploadErr('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('articleId', articleId)
    try {
      const res = await fetch('/api/upload-inline-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Muat naik gagal')
      setUrl(data.url)
    } catch (err) {
      setUploadErr(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleInsert = () => {
    const src = url.trim()
    if (!src) return
    onInsert({ src, alt: alt.trim(), caption: caption.trim() })
    onClose()
  }

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)} style={{
      padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
      background: 'none', borderBottom: `2px solid ${tab === id ? '#d4a853' : 'transparent'}`,
      color: tab === id ? '#d4a853' : '#56514d', fontFamily: "'DM Sans', sans-serif",
      transition: 'color 0.1s, border-color 0.1s',
    }}>{label}</button>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'DM Sans', sans-serif" }}>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#1a1816', border: '1px solid rgba(237,232,223,0.13)', borderRadius: '10px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(237,232,223,0.07)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#56514d' }}>Sisip Imej</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#56514d', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '4px' }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(237,232,223,0.07)', paddingLeft: '8px' }}>
          {tabBtn('upload', 'Muat Naik')}
          {tabBtn('url', 'URL')}
        </div>

        <div style={{ padding: '20px' }}>

          {tab === 'upload' && (
            <div>
              {url ? (
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <img src={url} alt="preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '4px', display: 'block' }} />
                  <button onClick={() => setUrl('')} style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'rgba(12,11,10,0.8)', border: '1px solid rgba(237,232,223,0.15)',
                    color: '#ede8df', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer',
                  }}>× Tukar</button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: '2px dashed rgba(237,232,223,0.11)', borderRadius: '4px', padding: '32px',
                    textAlign: 'center', cursor: 'pointer', marginBottom: '12px', background: '#0e0d0c',
                  }}>
                  {uploading ? (
                    <div style={{ color: '#8c857c', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Spinner size={13} /> Memuat naik…
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '24px', marginBottom: '6px', opacity: 0.4 }}>↑</div>
                      <div style={{ fontSize: '13px', color: '#8c857c' }}>Klik untuk pilih imej</div>
                      <div style={{ fontSize: '11.5px', color: '#3a3530', marginTop: '3px' }}>JPG, PNG, WebP · Maks 8 MB</div>
                    </>
                  )}
                </div>
              )}
              {uploadErr && <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '10px' }}>{uploadErr}</div>}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = '' }} />
            </div>
          )}

          {tab === 'url' && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11.5px', color: '#56514d', marginBottom: '5px' }}>URL Imej</div>
              <input
                type="url" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://..."
                style={{ ...inputStyle, marginBottom: url ? '10px' : 0 }}
              />
              {url && (
                <img src={url} alt="preview"
                  style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px', marginTop: '8px', display: 'block' }}
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
              )}
            </div>
          )}

          {/* Shared fields */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '11.5px', color: '#56514d', marginBottom: '5px' }}>Teks Alt (untuk aksesibiliti)</div>
            <input type="text" value={alt} onChange={e => setAlt(e.target.value)}
              placeholder="Huraikan imej ini…" style={inputStyle} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11.5px', color: '#56514d', marginBottom: '5px' }}>Kapsyen (pilihan)</div>
            <input type="text" value={caption} onChange={e => setCaption(e.target.value)}
              placeholder="Kapsyen di bawah imej…" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{
              padding: '8px 18px', borderRadius: '6px', border: '1px solid rgba(237,232,223,0.11)',
              background: 'transparent', color: '#8c857c', fontSize: '13px', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>Batal</button>
            <button onClick={handleInsert} disabled={!url.trim()} style={{
              padding: '8px 20px', borderRadius: '6px', border: 'none',
              background: url.trim() ? '#d4a853' : '#2a2520',
              color: url.trim() ? '#0c0b0a' : '#56514d', fontSize: '13px', fontWeight: 700,
              cursor: url.trim() ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif",
            }}>Sisip Imej</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Save / SEO content blocks ─────────────────────────────── */
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

  // Crop state
  const [cropSrc, setCropSrc] = useState(null)

  // Inline image modal state
  const [showInlineImageModal, setShowInlineImageModal] = useState(false)

  const [saveStatus, setSaveStatus] = useState('idle')
  const [isDirty,    setIsDirty]    = useState(false)
  const savedStateRef = useRef({ slug, metaDescription, tags, featuredImage })

  const [modal,       setModal]       = useState(null)
  const [pendingNav,  setPendingNav]  = useState(null)
  const [showBrief,   setShowBrief]   = useState(false)

  // Mobile tab state
  const [activeTab, setActiveTab] = useState('kandungan')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
    ],
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

  const uploadFeaturedImage = async (file) => {
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

  const handleFileSelect = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setCropSrc(e.target.result)
    reader.readAsDataURL(file)
  }

  // Insert inline image at cursor
  const insertInlineImage = ({ src, alt, caption }) => {
    if (!editor) return
    editor.chain().focus()
      .setImage({ src, alt: alt || undefined, title: caption || undefined })
      .run()
    setIsDirty(true)
  }

  // ── Image move (↑↓) state ───────────────────────────────────
  const editorContainerRef = useRef(null)
  const [imgMove, setImgMove] = useState(null) // {top, canUp, canDown}

  useEffect(() => {
    if (!editor) return
    const update = () => {
      const selectedImg = document.querySelector('.tiptap-editor img.ProseMirror-selectednode')
      if (!selectedImg || !editorContainerRef.current) { setImgMove(null); return }
      const containerRect = editorContainerRef.current.getBoundingClientRect()
      const imgRect = selectedImg.getBoundingClientRect()
      const top = imgRect.top - containerRect.top + imgRect.height / 2 - 28
      const { selection, doc } = editor.state
      const $pos = doc.resolve(selection.from)
      const index = $pos.index($pos.depth - 1)
      const parent = $pos.node($pos.depth - 1)
      setImgMove({ top, canUp: index > 0, canDown: index < parent.childCount - 1 })
    }
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => { editor.off('selectionUpdate', update); editor.off('transaction', update) }
  }, [editor])

  const moveImage = (direction) => {
    if (!editor) return
    const { state, dispatch } = editor.view
    const { doc, tr, selection } = state
    const $pos = doc.resolve(selection.from)
    const index = $pos.index($pos.depth - 1)
    const parent = $pos.node($pos.depth - 1)
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= parent.childCount) return
    const minIdx = Math.min(index, targetIndex)
    const maxIdx = Math.max(index, targetIndex)
    let startPos = $pos.start($pos.depth - 1)
    for (let i = 0; i < minIdx; i++) startPos += parent.child(i).nodeSize
    const nodeA = parent.child(minIdx)
    const nodeB = parent.child(maxIdx)
    dispatch(tr.replaceWith(startPos, startPos + nodeA.nodeSize + nodeB.nodeSize, [nodeB, nodeA]))
    setIsDirty(true)
  }

  const handleBackClick = (e) => {
    if (isDirty) { e.preventDefault(); setPendingNav('/admin'); setModal('unsaved') }
  }

  const qf         = article.quality_flags ?? {}
  const originalQf = article.original_quality_flags ?? {}
  const sources    = article.sources ?? []

  const mob = (tab) => activeTab === tab ? 'mob-tab-show' : 'mob-tab-hide'

  return (
    <div style={{ minHeight: '100vh', background: '#0c0b0a', fontFamily: "'DM Sans', sans-serif", color: '#ede8df' }}>
      <style>{`
        @keyframes editor-spin { to { transform: rotate(360deg); } }

        .tiptap-editor { outline: none; min-height: 320px; font-size: 15px; line-height: 1.75; color: #ede8df; }
        .tiptap-editor h2 { font-family: 'DM Sans', sans-serif; font-size: 20px; font-weight: 700; margin: 24px 0 8px; }
        .tiptap-editor h3 { font-family: 'DM Sans', sans-serif; font-size: 17px; font-weight: 700; margin: 20px 0 6px; }
        .tiptap-editor p  { margin: 0 0 14px; }
        .tiptap-editor ul, .tiptap-editor ol { padding-left: 20px; margin: 0 0 14px; }
        .tiptap-editor strong { color: #f0ebe2; }
        .tiptap-editor em { color: #c0b8ae; }
        .tiptap-editor img { max-width: 100%; width: auto; height: auto; max-height: 500px; border-radius: 4px; display: block; margin: 16px auto 4px; cursor: default; }
        .tiptap-editor img.ProseMirror-selectednode { outline: 2px solid #d4a853; border-radius: 4px; }
        .tiptap-editor img[title]::after { content: attr(title); }
        .img-move-btn { display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:4px; border:1px solid rgba(237,232,223,0.18); background:#1e1c1a; color:#ede8df; cursor:pointer; font-size:14px; line-height:1; transition:background 0.1s; }
        .img-move-btn:hover { background:#2a2824; }
        .img-move-btn:disabled { opacity:0.25; cursor:default; }

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

        /* ── Mobile tab bar ── */
        .editor-tab-bar {
          display: none;
          position: sticky; top: 52px; z-index: 15;
          background: #0c0b0a;
          border-bottom: 1px solid rgba(237,232,223,0.07);
        }
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

        /* react-image-crop overrides */
        .ReactCrop__crop-selection { border-color: #d4a853; }
        .ReactCrop__drag-handle::after { background: #d4a853; border-color: #d4a853; }

        /* ── Mobile overrides ── */
        @media (max-width: 768px) {
          .editor-header { padding: 0 16px; height: auto; min-height: 52px; flex-wrap: wrap; gap: 8px; padding-top: 8px; padding-bottom: 8px; }
          .editor-header-title { width: 100%; }
          .editor-header-label, .editor-header-sep { display: none; }
          .editor-save-btns { display: none; }

          .editor-tab-bar { display: flex; }
          .editor-layout  { display: block; }
          .editor-main    { padding: 20px 16px; border-right: none; }
          .editor-aside   { position: static; height: auto; padding: 0; }

          .mob-tab-hide { display: none; }
          .mob-tab-show { display: block; }

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
          <AIBriefModal key="brief" brief={article.image_brief} onClose={() => setShowBrief(false)} />
        )}
        {cropSrc && (
          <CropModal
            key="crop"
            src={cropSrc}
            onConfirm={async (file) => { setCropSrc(null); await uploadFeaturedImage(file) }}
            onCancel={() => { setCropSrc(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
          />
        )}
        {showInlineImageModal && (
          <InlineImageModal
            key="inline-img"
            articleId={article.id}
            onInsert={insertInlineImage}
            onClose={() => setShowInlineImageModal(false)}
          />
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

      {/* ── Mobile tab bar ── */}
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

      {/* ── Two-column layout ── */}
      <div className="editor-layout">

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
                  <span style={{ fontSize: '15px', lineHeight: 1.5, color: '#ede8df' }}>{h}</span>
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
                    fontSize: '15px',
                  }}
                />
              </div>
            </div>
          </section>

          {/* 2. Featured image section */}
          <section style={{ marginBottom: '40px' }}>
            <SectionLabel>Imej Hero</SectionLabel>

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
                  Lihat Cadangan AI
                </button>
              </>
            )}

            {featuredImage ? (
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <img src={featuredImage} alt="Imej hero"
                  style={{ width: '100%', borderRadius: '4px', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }} />
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
                onDrop={async e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFileSelect(f) }}
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
                    <div style={{ fontSize: '11.5px', color: '#3a3530' }}>JPG, PNG, WebP · Nisbah 16:9 akan dipotong · Maks 8 MB</div>
                    {uploadStatus === 'error' && <div style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444' }}>Muat naik gagal. Cuba lagi.</div>}
                  </>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = '' }} />
          </section>

          {/* 3. TipTap body editor */}
          <section style={{ marginBottom: '40px' }}>
            <SectionLabel>Kandungan Artikel</SectionLabel>
            <div style={{ border: '1px solid rgba(237,232,223,0.11)', borderRadius: '4px', background: '#0e0d0c', padding: '16px' }}>
              <Toolbar editor={editor} onInsertImage={() => setShowInlineImageModal(true)} />
              <div ref={editorContainerRef} style={{ borderTop: '1px solid rgba(237,232,223,0.07)', paddingTop: '16px', position: 'relative' }}>
                <EditorContent editor={editor} className="tiptap-editor" />
                {/* ↑↓ move buttons — appear when an image is selected */}
                {imgMove && (
                  <div style={{
                    position: 'absolute', right: '-40px', top: `${imgMove.top}px`,
                    display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 10,
                  }}>
                    <button className="img-move-btn" disabled={!imgMove.canUp}
                      onMouseDown={e => { e.preventDefault(); moveImage('up') }} title="Gerak imej ke atas">↑</button>
                    <button className="img-move-btn" disabled={!imgMove.canDown}
                      onMouseDown={e => { e.preventDefault(); moveImage('down') }} title="Gerak imej ke bawah">↓</button>
                  </div>
                )}
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

        <aside className="editor-aside">
          <div className={`aside-section ${mob('seo')}`}>
            <SEOFields slug={slug} setSlug={setSlug} metaDescription={metaDescription}
              setMetaDescription={setMetaDescription} tags={tags} setTags={setTags} />
          </div>

          <div className={`aside-section ${mob('semakan')}`}>
            <QualityPanel qf={qf} originalQf={originalQf} />
            <SaveButtons saveStatus={saveStatus}
              onDraft={() => save('draft')}
              onPublish={() => setModal('publish')} />
          </div>
        </aside>
      </div>

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
