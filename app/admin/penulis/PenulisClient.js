'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import toast from 'react-hot-toast'
import ConfirmationModal from '@/components/admin/ConfirmationModal'

/* ── Spinner ── */
function Spinner({ size = 13 }) {
  return (
    <span style={{
      display: 'inline-block', width: `${size}px`, height: `${size}px`,
      border: '2px solid #2a2a2a', borderTopColor: '#d4a853',
      borderRadius: '50%', animation: 'penulis-spin 0.75s linear infinite', flexShrink: 0,
    }} />
  )
}

/* ── Avatar placeholder ── */
function Avatar({ src, name, size = 52 }) {
  const [err, setErr] = useState(false)
  if (src && !err) {
    return (
      <img
        src={src} alt={name}
        onError={() => setErr(true)}
        style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: '50%',
      background: '#2a2520', flexShrink: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      color: '#d4a853', fontSize: `${Math.round(size * 0.38)}px`, fontWeight: 700,
    }}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: '4px',
  border: '1px solid rgba(237,232,223,0.11)', background: '#0e0d0c',
  color: '#ede8df', fontSize: '13.5px', fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box',
}
const fieldLabel = {
  fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#56514d', marginBottom: '6px',
}

/* ── Add / Edit Modal ── */
function AuthorModal({ author, onClose, onSaved }) {
  const isEdit = !!author
  const [name,          setName]          = useState(author?.name ?? '')
  const [bio,           setBio]           = useState(author?.bio ?? '')
  const [saving,        setSaving]        = useState(false)

  // Crop state
  const [rawFile,        setRawFile]        = useState(null)
  const [previewDataUrl, setPreviewDataUrl] = useState(author?.photo_url ?? null)
  const [crop,           setCrop]           = useState()
  const [completedCrop,  setCompletedCrop]  = useState()
  const imgRef  = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handleFile = (file) => {
    if (!file) return
    setRawFile(file)
    setCrop(undefined)
    setCompletedCrop(undefined)
    const reader = new FileReader()
    reader.onload = (e) => setPreviewDataUrl(e.target.result)
    reader.readAsDataURL(file)
  }

  const onImageLoad = useCallback((e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    const c = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 1, w, h), w, h)
    setCrop(c)
  }, [])

  const getCroppedFile = () => new Promise((resolve) => {
    if (!completedCrop?.width || !imgRef.current) { resolve(null); return }
    const canvas = document.createElement('canvas')
    const img    = imgRef.current
    const scaleX = img.naturalWidth  / img.width
    const scaleY = img.naturalHeight / img.height
    const size   = Math.round(completedCrop.width * scaleX) // square
    canvas.width  = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img,
      completedCrop.x * scaleX, completedCrop.y * scaleY,
      completedCrop.width * scaleX, completedCrop.height * scaleY,
      0, 0, size, size,
    )
    canvas.toBlob(
      (blob) => resolve(blob ? new File([blob], 'author-photo.jpg', { type: 'image/jpeg' }) : null),
      'image/jpeg', 0.92,
    )
  })

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Author name is required.'); return }
    setSaving(true)
    try {
      let photo_url = author?.photo_url ?? null

      // Upload photo if a new file was selected
      if (rawFile) {
        const croppedFile = await getCroppedFile()
        const fd = new FormData()
        fd.append('file', croppedFile ?? rawFile)
        const res = await fetch('/api/upload-author-photo', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error || 'Upload failed')
        photo_url = data.url
      }

      const payload = { name: name.trim(), bio: bio.trim() || null, photo_url }

      if (isEdit) {
        const res = await fetch(`/api/authors/${author.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update')
        toast.success('Author updated.')
        onSaved(data.author, 'edit')
      } else {
        const res = await fetch('/api/authors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create')
        toast.success('Author added.')
        onSaved(data.author, 'add')
      }
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
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
          borderRadius: '10px', width: '100%', maxWidth: '440px',
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 96px rgba(0,0,0,0.7)',
        }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#ede8df' }}>
            {isEdit ? 'Edit Author' : 'Add Author'}
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(237,232,223,0.05)', border: '1px solid rgba(237,232,223,0.09)',
            color: '#8c857c', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex',
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: '0 22px 22px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>

          {/* Photo upload + crop */}
          <div>
            <div style={fieldLabel}>Profile Photo</div>

            {previewDataUrl ? (
              <div style={{ marginBottom: '8px' }}>
                {/* Crop area — only shown when a new file is selected */}
                <div style={{
                  background: '#0c0b0a', borderRadius: '7px',
                  border: '1px solid rgba(237,232,223,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '6px', position: 'relative',
                }}>
                  {rawFile ? (
                    <ReactCrop
                      crop={crop}
                      onChange={c => setCrop(c)}
                      onComplete={c => setCompletedCrop(c)}
                      aspect={1}
                      circularCrop
                      style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}
                    >
                      <img
                        ref={imgRef}
                        src={previewDataUrl}
                        onLoad={onImageLoad}
                        style={{ maxWidth: '100%', maxHeight: '280px', display: 'block', margin: '0 auto' }}
                        alt="preview"
                      />
                    </ReactCrop>
                  ) : (
                    /* Edit mode — existing photo, no crop needed unless re-uploaded */
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px' }}>
                      <Avatar src={previewDataUrl} name={name || '?'} size={64} />
                      <div style={{ fontSize: '12.5px', color: '#56514d' }}>Current photo. Select a new one to change.</div>
                    </div>
                  )}
                </div>
                {rawFile && (
                  <div style={{ fontSize: '11px', color: '#3d3830', textAlign: 'center', marginBottom: '4px' }}>
                    Adjust the circular crop area
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    padding: '6px 14px', borderRadius: '5px', fontSize: '12px', fontWeight: 600,
                    border: '1px solid rgba(237,232,223,0.15)', background: 'transparent',
                    color: '#8c857c', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}>
                  Change Photo
                </button>
              </div>
            ) : (
              /* No photo yet — dropzone */
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: '2px dashed rgba(237,232,223,0.1)', borderRadius: '7px',
                  padding: '22px 16px', textAlign: 'center', cursor: 'pointer',
                  background: '#0e0d0c', marginBottom: '8px',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(237,232,223,0.22)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(237,232,223,0.1)' }}
              >
                <div style={{ fontSize: '24px', marginBottom: '6px', opacity: 0.3 }}>👤</div>
                <div style={{ fontSize: '12.5px', color: '#8c857c', marginBottom: '2px' }}>Click to select photo</div>
                <div style={{ fontSize: '11px', color: '#3a3530' }}>JPG, PNG, WebP · Max 4 MB</div>
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
          </div>

          {/* Name */}
          <div>
            <div style={fieldLabel}>Name <span style={{ color: '#ef4444' }}>*</span></div>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Author's full name…" style={inputStyle} />
          </div>

          {/* Bio */}
          <div>
            <div style={fieldLabel}>Bio <span style={{ color: '#3a3530', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(one sentence)</span></div>
            <input type="text" value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Technology writer specialising in AI and digital innovation…"
              style={inputStyle} maxLength={180} />
            <div style={{ fontSize: '11px', color: '#3a3530', marginTop: '4px', textAlign: 'right' }}>
              {bio.length}/180
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button onClick={onClose} style={{
              padding: '9px 18px', borderRadius: '6px', border: '1px solid rgba(237,232,223,0.11)',
              background: 'transparent', color: '#8c857c', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '9px 20px', borderRadius: '6px', border: 'none',
              background: saving ? '#3a3020' : '#d4a853',
              color: saving ? '#8c7040' : '#0c0b0a',
              fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', gap: '7px',
            }}>
              {saving && <Spinner size={12} />}
              {isEdit ? 'Save Changes' : 'Add Author'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Main page ── */
export default function PenulisClient({ initialAuthors }) {
  const [authors,       setAuthors]       = useState(initialAuthors)
  const [showModal,     setShowModal]     = useState(false)
  const [editingAuthor, setEditingAuthor] = useState(null)
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [deleting,      setDeleting]      = useState(false)

  const [lm, setLm] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem('admin-theme')
    setLm(saved === 'light')
    const h = (e) => setLm(e.detail === 'light')
    window.addEventListener('admin-theme-change', h)
    return () => window.removeEventListener('admin-theme-change', h)
  }, [])

  const C = lm ? {
    pageBg: '#f8f8f8', cardBg: '#ffffff', border: '#e5e7eb',
    text1: '#0d1117', text2: '#1f2937', text3: '#4b5563',
    btnBorder: '#e5e7eb', btnText: '#6b7280',
  } : {
    pageBg: '#0c0b0a', cardBg: '#111010', border: 'rgba(237,232,223,0.07)',
    text1: '#ede8df', text2: '#8c857c', text3: '#56514d',
    btnBorder: 'rgba(237,232,223,0.11)', btnText: '#8c857c',
  }

  const handleSaved = (author, mode) => {
    if (mode === 'add') {
      setAuthors(prev => [...prev, author].sort((a, b) => a.name.localeCompare(b.name)))
    } else {
      setAuthors(prev => prev.map(a => a.id === author.id ? author : a))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/authors/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to delete')
      }
      setAuthors(prev => prev.filter(a => a.id !== deleteTarget.id))
      toast.success('Author deleted.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="admin-page-content" style={{ background: C.pageBg, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes penulis-spin { to { transform: rotate(360deg); } }
        .author-card-btn {
          padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: background 0.12s, color 0.12s;
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>

      <ConfirmationModal
        open={!!deleteTarget}
        title="Delete Author?"
        message={`"${deleteTarget?.name}" will be deleted. Articles using this author will not be affected.`}
        confirmLabel={deleting ? 'Deleting…' : 'Yes, Delete'}
        cancelLabel="Cancel"
        confirmColor="red"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <AnimatePresence>
        {(showModal || editingAuthor) && (
          <AuthorModal
            key={editingAuthor?.id ?? 'new'}
            author={editingAuthor}
            onClose={() => { setShowModal(false); setEditingAuthor(null) }}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: C.text1, fontFamily: "'Fraunces', serif" }}>
            Authors
          </h1>
          <div style={{ fontSize: '13px', color: C.text3, marginTop: '4px' }}>
            {authors.length} {authors.length === 1 ? 'author' : 'authors'} registered
          </div>
        </div>
        <button
          onClick={() => { setEditingAuthor(null); setShowModal(true) }}
          style={{
            padding: '9px 18px', borderRadius: '6px', border: 'none',
            background: '#d4a853', color: '#0c0b0a',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex', alignItems: 'center', gap: '7px',
          }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Author
        </button>
      </div>

      {/* Empty state */}
      {authors.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: C.cardBg, border: `1px solid ${C.border}`,
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>✍️</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: C.text1, marginBottom: '6px' }}>No authors yet</div>
          <div style={{ fontSize: '13px', color: C.text3 }}>Add your first author to start assigning articles.</div>
        </div>
      )}

      {/* Author grid */}
      {authors.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {authors.map(author => (
            <motion.div
              key={author.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                background: C.cardBg, border: `1px solid ${C.border}`,
                borderRadius: '8px', padding: '20px',
                display: 'flex', flexDirection: 'column', gap: '14px',
              }}>
              {/* Top row: avatar + info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Avatar src={author.photo_url} name={author.name} size={52} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {author.name}
                  </div>
                  {author.bio && (
                    <div style={{ fontSize: '12px', color: C.text3, marginTop: '3px', lineHeight: 1.45,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {author.bio}
                    </div>
                  )}
                  {!author.bio && (
                    <div style={{ fontSize: '12px', color: C.text3, marginTop: '3px', fontStyle: 'italic' }}>
                      No bio
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', borderTop: `1px solid ${C.border}`, paddingTop: '14px' }}>
                <button
                  className="author-card-btn"
                  onClick={() => { setEditingAuthor(author); setShowModal(false) }}
                  style={{
                    flex: 1, border: `1px solid ${C.btnBorder}`,
                    background: 'transparent', color: C.btnText,
                  }}>
                  Edit
                </button>
                <button
                  className="author-card-btn"
                  onClick={() => setDeleteTarget(author)}
                  style={{
                    flex: 1, border: '1px solid rgba(239,68,68,0.2)',
                    background: 'transparent', color: '#ef4444',
                  }}>
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
