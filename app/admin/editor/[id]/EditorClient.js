'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { createImagePlaceholderExtension } from './ImagePlaceholderExtension'
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
const TB_SEP = <span style={{ width: '1px', height: '14px', background: 'rgba(237,232,223,0.1)', margin: '0 2px', flexShrink: 0, alignSelf: 'center' }} />

function Toolbar({ editor, onInsertImage }) {
  if (!editor) return null

  const btnStyle = (isActive) => ({
    height: '28px', padding: '0 9px', borderRadius: '4px',
    border: 'none',
    background: isActive ? 'rgba(212,168,83,0.14)' : 'rgba(237,232,223,0.05)',
    color: isActive ? '#d4a853' : '#9c948c',
    boxShadow: isActive ? 'inset 0 0 0 1px rgba(212,168,83,0.28)' : 'none',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '12px', fontWeight: 600, letterSpacing: '0.025em',
    cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    whiteSpace: 'nowrap', flexShrink: 0,
    transition: 'background 0.1s ease, color 0.1s ease, box-shadow 0.1s ease, transform 0.08s ease',
  })

  const btn = (label, action, isActive) => (
    <button key={label}
      className="editor-tb-btn"
      onMouseDown={e => { e.preventDefault(); action() }}
      style={btnStyle(isActive)}>
      {label}
    </button>
  )

  return (
    <div className="toolbar-sticky" style={{
      display: 'flex', gap: '2px', flexWrap: 'nowrap', overflowX: 'auto',
      marginBottom: '14px', alignItems: 'center',
      position: 'sticky', top: '60px', zIndex: 18,
      background: '#161310',
      paddingTop: '5px', paddingBottom: '5px', paddingLeft: '2px', paddingRight: '2px',
      borderTop: '1px solid rgba(212,168,83,0.18)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
      scrollbarWidth: 'none',
    }}>
      {/* Text formatting */}
      {btn('B',  () => editor.chain().focus().toggleBold().run(),    editor.isActive('bold'))}
      {btn('I',  () => editor.chain().focus().toggleItalic().run(),  editor.isActive('italic'))}
      {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      {btn('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
      {TB_SEP}
      {/* Lists */}
      {btn('• Senarai',  () => editor.chain().focus().toggleBulletList().run(),  editor.isActive('bulletList'))}
      {btn('1. Senarai', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
      {TB_SEP}
      {/* Image */}
      <button
        className="editor-tb-btn"
        onMouseDown={e => { e.preventDefault(); onInsertImage() }}
        title="Sisip Imej"
        style={btnStyle(false)}>
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
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

/* ── Author dropdown ───────────────────────────────────────── */
function AuthorSelect({ authors, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selected = authors.find(a => a.id === value) ?? null

  const Pip = ({ author, size = 22 }) => author?.photo_url ? (
    <img src={author.photo_url} alt={author.name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: '#2a2520', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#d4a853', fontSize: Math.round(size * 0.42) + 'px', fontWeight: 700,
    }}>
      {author?.name?.[0] ?? 'S'}
    </div>
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '9px 40px 9px 12px', borderRadius: '4px',
          border: `1px solid ${open ? 'rgba(237,232,223,0.22)' : 'rgba(237,232,223,0.11)'}`,
          background: '#0e0d0c', color: selected ? '#ede8df' : '#56514d',
          fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
          cursor: 'pointer', textAlign: 'left', position: 'relative', boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', gap: '9px',
          transition: 'border-color 0.12s',
        }}
      >
        {selected ? (
          <>
            <Pip author={selected} size={20} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</span>
          </>
        ) : (
          <span>Sharpable News</span>
        )}
        {/* Chevron — pulled in from right edge */}
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"
          style={{
            position: 'absolute', right: '14px', top: '50%',
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            transition: 'transform 0.15s', color: '#56514d', flexShrink: 0, pointerEvents: 'none',
          }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, zIndex: 200,
          background: '#161412',
          border: '1px solid rgba(237,232,223,0.14)',
          borderRadius: '6px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.65)',
          overflow: 'hidden',
        }}>
          {/* Sharpable News (null) option */}
          <button type="button" onClick={() => { onChange(null); setOpen(false) }} style={{
            width: '100%', padding: '9px 14px', border: 'none',
            borderBottom: '1px solid rgba(237,232,223,0.06)',
            background: !value ? 'rgba(212,168,83,0.07)' : 'transparent',
            color: !value ? '#d4a853' : '#8c857c',
            fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: '9px',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => { if (value) e.currentTarget.style.background = 'rgba(237,232,223,0.04)' }}
          onMouseLeave={e => { if (value) e.currentTarget.style.background = 'transparent' }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: '#1e1c1a', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#56514d', fontSize: '8px', fontWeight: 700, letterSpacing: '0.02em',
            }}>SN</div>
            <span>Sharpable News</span>
          </button>

          {/* Author options */}
          {authors.map(a => (
            <button key={a.id} type="button" onClick={() => { onChange(a.id); setOpen(false) }} style={{
              width: '100%', padding: '9px 14px', border: 'none',
              background: value === a.id ? 'rgba(212,168,83,0.07)' : 'transparent',
              color: value === a.id ? '#d4a853' : '#ede8df',
              fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: '9px',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { if (value !== a.id) e.currentTarget.style.background = 'rgba(237,232,223,0.04)' }}
            onMouseLeave={e => { if (value !== a.id) e.currentTarget.style.background = 'transparent' }}>
              <Pip author={a} size={20} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
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
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#161412',
          border: '1px solid rgba(237,232,223,0.1)',
          borderTop: '3px solid #d4a853',
          borderRadius: '12px 12px 0 0',
          padding: '22px 24px 36px',
          width: '100%', maxWidth: '600px',
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 -16px 64px rgba(0,0,0,0.5)',
        }}>
        {/* Drag handle */}
        <div style={{ width: '36px', height: '3px', background: 'rgba(237,232,223,0.15)', borderRadius: '999px', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#56514d', marginBottom: '4px' }}>Cadangan AI</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ede8df' }}>Imej Hero</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(237,232,223,0.05)', border: '1px solid rgba(237,232,223,0.09)',
            color: '#8c857c', cursor: 'pointer', padding: '6px', borderRadius: '6px',
            display: 'flex', alignItems: 'center', flexShrink: 0,
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <p style={{
          margin: 0, fontSize: '14px', color: '#8c857c', lineHeight: 1.7,
          borderLeft: '3px solid rgba(212,168,83,0.3)', paddingLeft: '14px',
        }}>
          {brief}
        </p>
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
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9100,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '20px', fontFamily: "'DM Sans', sans-serif",
      }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ type: 'spring', stiffness: 480, damping: 34 }}
        style={{
          background: '#161412',
          border: '1px solid rgba(237,232,223,0.12)',
          borderTop: '3px solid #d4a853',
          borderRadius: '10px', padding: '22px',
          width: '100%', maxWidth: '700px',
          boxShadow: '0 32px 96px rgba(0,0,0,0.7)',
        }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ede8df', marginBottom: '2px' }}>Potong Imej Hero</div>
            <div style={{ fontSize: '11.5px', color: '#56514d' }}>Nisbah 16:9 · Resolusi output 1280×720</div>
          </div>
          <button onClick={onCancel} style={{
            background: 'none', border: 'none', color: '#56514d', cursor: 'pointer',
            padding: '4px', fontSize: '20px', lineHeight: 1, display: 'flex',
          }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {/* Crop area */}
        <div style={{
          background: '#0c0b0a', borderRadius: '6px', overflow: 'hidden', marginBottom: '18px',
          border: '1px solid rgba(237,232,223,0.07)',
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
        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '9px 18px', borderRadius: '6px',
            border: '1px solid rgba(237,232,223,0.11)',
            background: 'transparent', color: '#8c857c', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            transition: 'border-color 0.12s, color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(237,232,223,0.25)'; e.currentTarget.style.color = '#ede8df' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(237,232,223,0.11)'; e.currentTarget.style.color = '#8c857c' }}
          >Batal</button>
          <button onClick={handleConfirm} style={{
            padding: '9px 20px', borderRadius: '6px', border: 'none',
            background: '#d4a853', color: '#0c0b0a', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#c49640' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#d4a853' }}
          >Gunakan Imej</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Inline Image Modal ────────────────────────────────────── */
function InlineImageModal({
  articleId, onInsert, onClose,
  initialSrc = '', initialAlt = '', initialCaption = '', mode = 'insert',
}) {
  const [tab,          setTab]          = useState('upload')
  const [url,          setUrl]          = useState(mode === 'edit' ? initialSrc : '')
  const [alt,          setAlt]          = useState(initialAlt)
  const [caption,      setCaption]      = useState(initialCaption)
  const [uploading,    setUploading]    = useState(false)
  const [uploadErr,    setUploadErr]    = useState('')
  const fileRef = useRef(null)

  // Crop state — previewDataUrl is either a local data: URL (new file) or existing src (edit mode)
  const [previewDataUrl, setPreviewDataUrl] = useState(mode === 'edit' ? initialSrc : '')
  const [rawFile,       setRawFile]       = useState(null)
  const [crop,          setCrop]          = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const imgRef = useRef(null)

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // File selected — read as dataURL for preview/crop; actual upload happens on insert
  const handleFileSelect = (file) => {
    if (!file) return
    setUploadErr('')
    setCrop(undefined)
    setCompletedCrop(undefined)
    setRawFile(file)
    const reader = new FileReader()
    reader.onload = (e) => { setPreviewDataUrl(e.target.result); setUrl('') }
    reader.readAsDataURL(file)
  }

  const uploadFile = async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('articleId', articleId)
    const res = await fetch('/api/upload-inline-image', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error || 'Muat naik gagal')
    return data.url
  }

  // Returns a cropped File if a crop was drawn, otherwise null
  const getCroppedFile = () => new Promise((resolve) => {
    if (!completedCrop?.width || !imgRef.current) { resolve(null); return }
    const canvas = document.createElement('canvas')
    const img = imgRef.current
    const scaleX = img.naturalWidth  / img.width
    const scaleY = img.naturalHeight / img.height
    canvas.width  = Math.round(completedCrop.width  * scaleX)
    canvas.height = Math.round(completedCrop.height * scaleY)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img,
      completedCrop.x * scaleX, completedCrop.y * scaleY,
      completedCrop.width * scaleX, completedCrop.height * scaleY,
      0, 0, canvas.width, canvas.height,
    )
    canvas.toBlob(
      (blob) => resolve(blob ? new File([blob], 'inline-image.jpg', { type: 'image/jpeg' }) : null),
      'image/jpeg', 0.92,
    )
  })

  const handleInsert = async () => {
    setUploadErr('')
    setUploading(true)
    try {
      // Determine final URL to use
      let finalUrl = url.trim() || previewDataUrl  // url tab OR existing preview (edit mode)
      if (rawFile) {
        // New file was selected — apply optional crop then upload
        const croppedFile = await getCroppedFile()
        finalUrl = await uploadFile(croppedFile ?? rawFile)
      }
      if (!finalUrl) return
      onInsert({ src: finalUrl, alt: alt.trim(), caption: caption.trim() })
      onClose()
    } catch (err) {
      setUploadErr(err.message)
    } finally {
      setUploading(false)
    }
  }

  const clearPreview = () => {
    setPreviewDataUrl('')
    setRawFile(null); setUrl(''); setCrop(undefined); setCompletedCrop(undefined)
  }

  const hasPreview  = !!(previewDataUrl || url.trim())
  const previewSrc  = previewDataUrl || url.trim()
  const canInsert   = hasPreview && !uploading

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)} style={{
      padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
      background: 'none', borderBottom: `2px solid ${tab === id ? '#d4a853' : 'transparent'}`,
      color: tab === id ? '#d4a853' : '#56514d', fontFamily: "'DM Sans', sans-serif",
      transition: 'color 0.1s, border-color 0.1s',
    }}>{label}</button>
  )

  const fieldLabel = {
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: '#56514d', marginBottom: '6px',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9200,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', fontFamily: "'DM Sans', sans-serif",
      }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ type: 'spring', stiffness: 480, damping: 34 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#161412',
          border: '1px solid rgba(237,232,223,0.1)',
          borderTop: '3px solid #d4a853',
          borderRadius: '10px', width: '100%', maxWidth: '460px',
          overflow: 'hidden', boxShadow: '0 32px 96px rgba(0,0,0,0.7)',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px 14px', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#ede8df', marginBottom: '1px' }}>
              {mode === 'edit' ? 'Edit Imej' : 'Sisip Imej'}
            </div>
            <div style={{ fontSize: '11.5px', color: '#56514d' }}>
              {mode === 'edit' ? 'Kemas kini imej, alt text atau kapsyen' : 'Muat naik fail atau masukkan URL'}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(237,232,223,0.05)', border: '1px solid rgba(237,232,223,0.09)',
            color: '#8c857c', cursor: 'pointer', padding: '6px', borderRadius: '6px',
            display: 'flex', alignItems: 'center', transition: 'background 0.1s',
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(237,232,223,0.07)', paddingLeft: '12px', flexShrink: 0 }}>
          {tabBtn('upload', 'Muat Naik')}
          {tabBtn('url', 'URL')}
        </div>

        <div style={{ padding: '20px 22px', overflowY: 'auto' }}>

          {tab === 'upload' && (
            <div style={{ marginBottom: '14px' }}>
              {hasPreview && tab === 'upload' ? (
                <div style={{ marginBottom: '8px' }}>
                  {/* Adaptive image viewer — no forced aspect ratio, shows full image */}
                  <div style={{
                    width: '100%',
                    background: '#0c0b0a', borderRadius: '7px',
                    border: '1px solid rgba(237,232,223,0.07)',
                    position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '6px',
                  }}>
                    {rawFile ? (
                      <ReactCrop
                        crop={crop}
                        onChange={c => setCrop(c)}
                        onComplete={c => setCompletedCrop(c)}
                        style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}
                      >
                        <img ref={imgRef} src={previewDataUrl}
                          onLoad={e => {
                            const { width, height } = e.currentTarget
                            const full = { unit: 'px', x: 0, y: 0, width, height }
                            setCrop(full)
                            setCompletedCrop(full)
                          }}
                          style={{ maxWidth: '100%', maxHeight: '60vh', display: 'block', margin: '0 auto' }}
                          alt="preview" />
                      </ReactCrop>
                    ) : (
                      <img src={previewSrc}
                        style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                        alt="preview"
                        onError={e => { e.currentTarget.style.display = 'none' }}
                      />
                    )}
                    <button onClick={clearPreview} style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'rgba(12,11,10,0.85)', border: '1px solid rgba(237,232,223,0.18)',
                      color: '#ede8df', borderRadius: '5px', padding: '4px 10px',
                      fontSize: '11.5px', cursor: 'pointer', fontWeight: 600,
                    }}>Tukar</button>
                  </div>
                  {rawFile && (
                    <div style={{ fontSize: '11px', color: '#3d3830', textAlign: 'center', marginBottom: '2px' }}>
                      Seret untuk memilih kawasan potong (pilihan)
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${uploading ? 'rgba(212,168,83,0.3)' : 'rgba(237,232,223,0.1)'}`,
                    borderRadius: '7px', padding: '28px 20px',
                    textAlign: 'center', cursor: 'pointer',
                    background: '#0e0d0c',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => { if (!uploading) e.currentTarget.style.borderColor = 'rgba(237,232,223,0.2)' }}
                  onMouseLeave={e => { if (!uploading) e.currentTarget.style.borderColor = 'rgba(237,232,223,0.1)' }}
                >
                  <>
                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                      <svg width="28" height="28" fill="none" stroke="rgba(237,232,223,0.2)" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <div style={{ fontSize: '13px', color: '#8c857c', marginBottom: '3px' }}>Klik untuk pilih imej</div>
                    <div style={{ fontSize: '11.5px', color: '#3a3530' }}>JPG, PNG, WebP · Maks 8 MB</div>
                  </>
                </div>
              )}
              {uploadErr && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', padding: '8px 10px', background: 'rgba(239,68,68,0.07)', borderRadius: '5px', border: '1px solid rgba(239,68,68,0.15)' }}>
                  {uploadErr}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = '' }} />
            </div>
          )}

          {tab === 'url' && (
            <div style={{ marginBottom: '14px' }}>
              <div style={fieldLabel}>URL Imej</div>
              <input
                type="url" value={url} onChange={e => { setUrl(e.target.value); setPreviewDataUrl(''); setRawFile(null) }}
                placeholder="https://…"
                style={{ ...inputStyle, marginBottom: url ? '10px' : 0 }}
              />
              {url && (
                <div style={{
                  width: '100%',
                  background: '#0c0b0a', borderRadius: '6px',
                  border: '1px solid rgba(237,232,223,0.07)',
                  marginTop: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <img src={url} alt="preview"
                    style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Shared fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div>
              <div style={fieldLabel}>Teks Alt <span style={{ color: '#3a3530', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(aksesibiliti)</span></div>
              <input type="text" value={alt} onChange={e => setAlt(e.target.value)}
                placeholder="Huraikan imej ini…" style={inputStyle} />
            </div>
            <div>
              <div style={fieldLabel}>Kapsyen <span style={{ color: '#3a3530', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(pilihan)</span></div>
              <input type="text" value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="Kapsyen di bawah imej…" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{
              padding: '9px 18px', borderRadius: '6px',
              border: '1px solid rgba(237,232,223,0.11)',
              background: 'transparent', color: '#8c857c',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'border-color 0.12s, color 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(237,232,223,0.25)'; e.currentTarget.style.color = '#ede8df' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(237,232,223,0.11)'; e.currentTarget.style.color = '#8c857c' }}
            >Batal</button>
            <button onClick={handleInsert} disabled={!canInsert} style={{
              padding: '9px 20px', borderRadius: '6px', border: 'none',
              background: canInsert ? '#d4a853' : '#1e1c1a',
              color: canInsert ? '#0c0b0a' : '#3a3530',
              fontSize: '13px', fontWeight: 700,
              cursor: canInsert ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'background 0.12s',
              display: 'flex', alignItems: 'center', gap: '7px',
            }}
            onMouseEnter={e => { if (canInsert) e.currentTarget.style.background = '#c49640' }}
            onMouseLeave={e => { if (canInsert) e.currentTarget.style.background = canInsert ? '#d4a853' : '#1e1c1a' }}
            >
              {uploading && <Spinner size={12} />}
              {mode === 'edit' ? 'Kemas Kini' : 'Sisip Imej'}
            </button>
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
export default function EditorClient({ article, authors = [] }) {
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
  const [showInlineImageModal,    setShowInlineImageModal]    = useState(false)
  const [editingInlineImageData,  setEditingInlineImageData]  = useState(null) // {src,alt,caption} when editing

  const [authorId, setAuthorId] = useState(article.author_id ?? null)

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
      createImagePlaceholderExtension(article.id),
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

  /** Strip imagePlaceholder nodes from HTML body — used when publishing */
  const stripPlaceholders = (html) => {
    if (!html) return html
    return html.replace(/<div[^>]*data-type="image-placeholder"[^>]*>\s*<\/div>/g, '')
               .replace(/<div[^>]*data-type="image-placeholder"[^>]*\/>/g, '')
  }

  const save = async (newStatus) => {
    setSaveStatus('saving')
    try {
      const rawHtml = editor?.getHTML() ?? article.body ?? ''
      // Strip placeholder nodes when publishing — they must never appear on public page
      const body = newStatus === 'published' ? stripPlaceholders(rawHtml) : rawHtml

      const res = await fetch(`/api/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: getTitle(), body,
          slug, meta_description: metaDescription, tags,
          featured_image: featuredImage, status: newStatus,
          author_id: authorId ?? null,
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

  // Insert or update inline image
  const insertInlineImage = ({ src, alt, caption }) => {
    if (!editor) return
    if (hoverEditPosRef.current !== null) {
      // Hover-edit: replace node at stored position (no selection required)
      const pos  = hoverEditPosRef.current
      hoverEditPosRef.current = null
      const node = editor.state.schema.nodes.image.create({
        src, alt: alt || undefined, title: caption || undefined,
      })
      editor.view.dispatch(editor.state.tr.replaceWith(pos, pos + 1, node))
    } else if (editingInlineImageData !== null) {
      // Click-toolbar edit: update attributes of currently selected image node
      editor.chain().focus().updateAttributes('image', {
        src, alt: alt || undefined, title: caption || undefined,
      }).run()
      setEditingInlineImageData(null)
    } else {
      editor.chain().focus()
        .setImage({ src, alt: alt || undefined, title: caption || undefined })
        .run()
    }
    setIsDirty(true)
  }

  const openEditImage = () => {
    if (!imgMove) return
    setEditingInlineImageData({ src: imgMove.src, alt: imgMove.alt, caption: imgMove.caption })
    setShowInlineImageModal(true)
  }

  const removeSelectedImage = () => {
    if (!editor) return
    editor.chain().focus().deleteSelection().run()
    setImgMove(null)
    setIsDirty(true)
  }

  // ── Image move (↑↓) + hover overlay state ──────────────────
  const editorContainerRef = useRef(null)
  const [imgMove, setImgMove] = useState(null) // {top, canUp, canDown}

  // Hover controls (edit / delete / move) shown when mouse is over an image
  const imgHoverTimer = useRef(null)
  const hoverEditPosRef = useRef(null)
  const [imgHover, setImgHover] = useState(null) // {top,left,width,height,src,alt,caption,pos,canUp,canDown}

  useEffect(() => {
    if (!editor) return
    const update = () => {
      const selectedImg = document.querySelector('.tiptap-editor img.ProseMirror-selectednode')
      if (!selectedImg || !editorContainerRef.current) { setImgMove(null); return }
      const containerRect = editorContainerRef.current.getBoundingClientRect()
      const imgRect = selectedImg.getBoundingClientRect()
      const top = imgRect.top - containerRect.top + imgRect.height / 2 - 28
      const { selection, doc } = editor.state
      const $pos  = doc.resolve(selection.from)
      const depth = $pos.depth
      // Guard: if depth < 1 we can't access parent node safely
      if (depth < 1) { setImgMove(null); return }
      const parent = $pos.node(depth - 1)
      if (!parent) { setImgMove(null); return }
      const index    = $pos.index(depth - 1)
      const imgAttrs = selection.node?.type?.name === 'image' ? selection.node.attrs : {}
      // Position toolbar as horizontal overlay at bottom-left of the image (inside container)
      const toolbarTop  = imgRect.bottom - containerRect.top - 42
      const toolbarLeft = imgRect.left   - containerRect.left + 8
      setImgMove({
        top: toolbarTop, left: toolbarLeft,
        canUp: index > 0, canDown: index < parent.childCount - 1,
        src: imgAttrs.src ?? '', alt: imgAttrs.alt ?? '', caption: imgAttrs.title ?? '',
      })
    }
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => { editor.off('selectionUpdate', update); editor.off('transaction', update) }
  }, [editor])

  /* ── Hover detection for inline images (desktop + mobile) ── */
  useEffect(() => {
    const container = editorContainerRef.current
    if (!container || !editor) return

    const buildHoverData = (img) => {
      const cRect = container.getBoundingClientRect()
      const iRect = img.getBoundingClientRect()
      let imgPos = null, canUp = false, canDown = false
      editor.state.doc.descendants((node, pos) => {
        if (imgPos !== null) return false
        if (node.type.name === 'image' && node.attrs.src === img.getAttribute('src')) imgPos = pos
      })
      if (imgPos !== null) {
        try {
          const $p = editor.state.doc.resolve(imgPos)
          const d  = $p.depth
          if (d >= 1) {
            const parent = $p.node(d - 1)
            const idx    = $p.index(d - 1)
            canUp   = idx > 0
            canDown = idx < parent.childCount - 1
          }
        } catch {}
      }
      return {
        top: iRect.top - cRect.top, left: iRect.left - cRect.left,
        width: iRect.width, height: iRect.height,
        src: img.getAttribute('src') ?? '', alt: img.getAttribute('alt') ?? '',
        caption: img.getAttribute('title') ?? '', pos: imgPos, canUp, canDown,
      }
    }

    const showHover = (img) => { clearTimeout(imgHoverTimer.current); setImgHover(buildHoverData(img)) }
    const startHide = () => { imgHoverTimer.current = setTimeout(() => setImgHover(null), 180) }

    // Desktop
    const onOver  = (e) => { if (e.target.tagName === 'IMG') showHover(e.target) }
    const onOut   = (e) => { if (e.target.tagName === 'IMG') startHide() }
    // Mobile tap: show overlay; tap elsewhere = hide
    const onTouch = (e) => { if (e.target.tagName === 'IMG' && container.contains(e.target)) showHover(e.target) }
    const onDocTouch = (e) => { if (!e.target.closest('[data-img-hover-overlay]')) setImgHover(null) }

    container.addEventListener('mouseover', onOver)
    container.addEventListener('mouseout',  onOut)
    container.addEventListener('touchstart', onTouch, { passive: true })
    document.addEventListener('touchstart', onDocTouch, { passive: true })
    return () => {
      container.removeEventListener('mouseover', onOver)
      container.removeEventListener('mouseout',  onOut)
      container.removeEventListener('touchstart', onTouch)
      document.removeEventListener('touchstart', onDocTouch)
      clearTimeout(imgHoverTimer.current)
    }
  }, [editor])

  /* ── Auto-scroll while dragging an image (desktop) ── */
  useEffect(() => {
    const container = editorContainerRef.current
    if (!container || !editor) return
    let dragging = false, rafId = null

    const scrollStep = (dir, speed) => {
      window.scrollBy(0, dir * speed)
      rafId = requestAnimationFrame(() => scrollStep(dir, speed))
    }
    const onDrag = (e) => {
      if (!dragging || e.clientY === 0) return // clientY=0 = drag left window
      cancelAnimationFrame(rafId)
      const threshold = 80, h = window.innerHeight, y = e.clientY
      if (y < threshold)          scrollStep(-1, Math.ceil(((threshold - y) / threshold) * 14))
      else if (y > h - threshold) scrollStep(+1, Math.ceil(((y - (h - threshold)) / threshold) * 14))
    }
    const onDragStart = () => { dragging = true }
    const onDragEnd   = () => { dragging = false; cancelAnimationFrame(rafId) }

    container.addEventListener('dragstart', onDragStart)
    document.addEventListener('dragend',   onDragEnd)
    container.addEventListener('drag',     onDrag)
    return () => {
      container.removeEventListener('dragstart', onDragStart)
      document.removeEventListener('dragend',   onDragEnd)
      container.removeEventListener('drag',     onDrag)
      cancelAnimationFrame(rafId)
    }
  }, [editor])

  /* ── Hover edit/delete actions ── */
  const openHoverEditImage = () => {
    if (!editor || !imgHover) return
    hoverEditPosRef.current = imgHover.pos
    setEditingInlineImageData({ src: imgHover.src, alt: imgHover.alt, caption: imgHover.caption })
    setShowInlineImageModal(true)
    setImgHover(null)
  }

  const deleteHoverImage = () => {
    if (!editor || imgHover?.pos == null) return
    const pos  = imgHover.pos
    const node = editor.state.doc.nodeAt(pos)
    if (node?.type.name === 'image') {
      editor.view.dispatch(editor.state.tr.delete(pos, pos + node.nodeSize))
    }
    setImgHover(null); setIsDirty(true)
  }

  /* Move image by position (used by hover ↑↓ on mobile/tap) */
  const moveImageAtPos = (direction) => {
    if (!editor || imgHover?.pos == null) return
    const { doc, tr } = editor.state
    const $pos  = doc.resolve(imgHover.pos)
    const depth = $pos.depth
    if (depth < 1) return
    const parent = $pos.node(depth - 1)
    if (!parent) return
    const index = $pos.index(depth - 1)
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= parent.childCount) return
    const minIdx = Math.min(index, target), maxIdx = Math.max(index, target)
    let startPos = $pos.start(depth - 1)
    for (let i = 0; i < minIdx; i++) startPos += parent.child(i).nodeSize
    const nodeA = parent.child(minIdx), nodeB = parent.child(maxIdx)
    editor.view.dispatch(tr.replaceWith(startPos, startPos + nodeA.nodeSize + nodeB.nodeSize, [nodeB, nodeA]))
    setImgHover(null); setIsDirty(true)
  }

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
        .img-move-btn { display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:4px; border:1px solid rgba(237,232,223,0.18); background:#1e1c1a; color:#ede8df; cursor:pointer; font-size:14px; line-height:1; transition:background 0.1s, transform 0.1s; }
        .img-move-btn:hover { background:#2a2824; }
        .img-move-btn:active { transform:scale(0.91); }
        .img-move-btn:disabled { opacity:0.25; cursor:default; }
        /* Toolbar button hover + press */
        .editor-tb-btn:hover {
          background: rgba(237,232,223,0.10) !important;
          color: #ccc4ba !important;
          box-shadow: none !important;
        }
        .editor-tb-btn:active {
          transform: scale(0.88) !important;
          background: rgba(237,232,223,0.15) !important;
        }
        /* Section labels animate in */
        .editor-section-fade { animation: editorFadeUp 0.22s ease both; }
        @keyframes editorFadeUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }

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
          transition: color 0.15s, border-color 0.15s, background 0.12s;
          font-family: var(--font-sans); white-space: nowrap;
        }
        .editor-tab-btn:hover { color: #8c857c; background: rgba(237,232,223,0.03); }
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

          /* On mobile: grey hairline instead of amber (avoids clash with tab underline) */
          .toolbar-sticky {
            top: 96px !important;
            border-top: 1px solid rgba(237,232,223,0.07) !important;
            box-shadow: 0 3px 10px rgba(0,0,0,0.5) !important;
          }
          .toolbar-sticky::-webkit-scrollbar { display: none; }
        }
      `}</style>

      {/* ── Confirmation modals ── */}
      <ConfirmationModal open={modal === 'removeImage'} title="Buang Gambar Utama?" message="Gambar semasa akan dibuang secara kekal."
        confirmLabel="Ya, Buang" cancelLabel="Batal" confirmColor="red"
        onConfirm={() => { setFeaturedImage(null); setModal(null) }} onCancel={() => setModal(null)} />
      <ConfirmationModal open={modal === 'removeInlineImage'} title="Buang Imej?" message="Imej dalam artikel ini akan dibuang."
        confirmLabel="Ya, Buang" cancelLabel="Batal" confirmColor="red"
        onConfirm={() => { removeSelectedImage(); setModal(null) }} onCancel={() => setModal(null)} />
      <ConfirmationModal open={modal === 'removeHoverImage'} title="Buang Imej?" message="Imej dalam artikel ini akan dibuang secara kekal."
        confirmLabel="Ya, Buang" cancelLabel="Batal" confirmColor="red"
        onConfirm={() => { deleteHoverImage(); setModal(null) }} onCancel={() => { setModal(null); setImgHover(null) }} />
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
            key={editingInlineImageData ? 'inline-img-edit' : 'inline-img-insert'}
            articleId={article.id}
            onInsert={insertInlineImage}
            onClose={() => { setShowInlineImageModal(false); setEditingInlineImageData(null) }}
            initialSrc={editingInlineImageData?.src ?? ''}
            initialAlt={editingInlineImageData?.alt ?? ''}
            initialCaption={editingInlineImageData?.caption ?? ''}
            mode={editingInlineImageData ? 'edit' : 'insert'}
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
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#56514d', marginBottom: '6px' }}>Cadangan AI — Imej Hero</div>
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
                {/* Image toolbar — horizontal overlay at bottom of selected image */}
                {imgMove && (
                  <div style={{
                    position: 'absolute',
                    left: `${imgMove.left}px`,
                    top: `${imgMove.top}px`,
                    display: 'flex', flexDirection: 'row', gap: '3px', zIndex: 20,
                    background: 'rgba(12,11,10,0.9)',
                    border: '1px solid rgba(237,232,223,0.15)',
                    borderRadius: '6px', padding: '4px',
                    boxShadow: '0 3px 12px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                  }}>
                    <button className="img-move-btn" disabled={!imgMove.canUp}
                      onMouseDown={e => { e.preventDefault(); moveImage('up') }} title="Gerak ke atas">↑</button>
                    <button className="img-move-btn" disabled={!imgMove.canDown}
                      onMouseDown={e => { e.preventDefault(); moveImage('down') }} title="Gerak ke bawah">↓</button>
                    <div style={{ width: '1px', background: 'rgba(237,232,223,0.1)', margin: '2px 1px' }} />
                    <button className="img-move-btn"
                      onMouseDown={e => { e.preventDefault(); openEditImage() }} title="Edit imej"
                      style={{ fontSize: '13px', gap: '4px', paddingLeft: '6px', paddingRight: '6px', width: 'auto' }}>
                      ✏ <span style={{ fontSize: '11px', fontWeight: 600 }}>Edit</span>
                    </button>
                    <button className="img-move-btn"
                      onMouseDown={e => { e.preventDefault(); setModal('removeInlineImage') }} title="Buang imej"
                      style={{ color: '#ef4444', borderColor: 'transparent', fontSize: '16px', lineHeight: 1 }}>×</button>
                  </div>
                )}

                {/* ── Hover controls: ↑↓ (mobile) + edit + delete ── */}
                {imgHover && (
                  <div
                    data-img-hover-overlay="true"
                    style={{
                      position: 'absolute',
                      top: `${imgHover.top + 7}px`,
                      left: `${imgHover.left + imgHover.width - 7}px`,
                      transform: 'translateX(-100%)',
                      zIndex: 25,
                      display: 'flex', flexDirection: 'row', gap: '4px', padding: '3px',
                    }}
                    onMouseEnter={() => clearTimeout(imgHoverTimer.current)}
                    onMouseLeave={() => { imgHoverTimer.current = setTimeout(() => setImgHover(null), 180) }}
                  >
                    {/* ↑↓ move buttons — always visible (essential on mobile, convenient on desktop) */}
                    {imgHover.canUp && (
                      <button onMouseDown={e => { e.preventDefault(); moveImageAtPos('up') }} title="Pindah ke atas"
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(237,232,223,0.22)', background: 'rgba(12,11,10,0.82)', color: '#ede8df', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', fontSize: '14px', lineHeight: 1 }}>↑</button>
                    )}
                    {imgHover.canDown && (
                      <button onMouseDown={e => { e.preventDefault(); moveImageAtPos('down') }} title="Pindah ke bawah"
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(237,232,223,0.22)', background: 'rgba(12,11,10,0.82)', color: '#ede8df', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', fontSize: '14px', lineHeight: 1 }}>↓</button>
                    )}
                    {(imgHover.canUp || imgHover.canDown) && (
                      <div style={{ width: '1px', background: 'rgba(237,232,223,0.15)', margin: '4px 1px' }} />
                    )}
                    {/* Edit */}
                    <button onMouseDown={e => { e.preventDefault(); openHoverEditImage() }} title="Edit imej"
                      style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(237,232,223,0.22)', background: 'rgba(12,11,10,0.82)', color: '#ede8df', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'background 0.12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30,28,26,0.92)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(12,11,10,0.82)' }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    {/* Delete — opens ConfirmationModal */}
                    <button onMouseDown={e => { e.preventDefault(); setModal('removeHoverImage') }} title="Padam imej"
                      style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(237,232,223,0.22)', background: 'rgba(12,11,10,0.82)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'background 0.12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30,28,26,0.92)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(12,11,10,0.82)' }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/>
                      </svg>
                    </button>
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
                    {src.url ? (
                      <a href={src.url} target="_blank" rel="noopener noreferrer" style={{
                        fontSize: '13.5px', fontWeight: 600, color: '#ede8df', marginBottom: '2px',
                        display: 'block', textDecoration: 'underline', textUnderlineOffset: '3px',
                        textDecorationColor: 'rgba(237,232,223,0.3)',
                      }}>
                        {src.title}
                      </a>
                    ) : (
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#ede8df', marginBottom: '2px' }}>{src.title}</div>
                    )}
                    {src.description && (
                      <div style={{ fontSize: '12.5px', color: '#56514d', lineHeight: 1.5 }}>
                        {src.description.replace(/<cite[^>]*>(.*?)<\/cite>/gi, '$1').trim()}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </main>

        <aside className="editor-aside">
          <div className={`aside-section ${mob('seo')}`}>
            {/* Author selector */}
            {authors.length > 0 && (
              <section style={{ marginBottom: '32px' }}>
                <SectionLabel>Penulis</SectionLabel>
                <AuthorSelect
                  authors={authors}
                  value={authorId}
                  onChange={(id) => { setAuthorId(id); setIsDirty(true) }}
                />
              </section>
            )}
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
