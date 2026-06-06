'use client'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState, useRef } from 'react'
import ConfirmationModal from '@/components/admin/ConfirmationModal'

/* ── Copy icon (Lucide-style) ── */
function CopyIcon() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

/* ── React NodeView component ── */
function ImagePlaceholderNodeView({ node, getPos, editor, extension }) {
  const [uploading,     setUploading]     = useState(false)
  const [error,         setError]         = useState('')
  const [showSkipModal, setShowSkipModal] = useState(false)
  const [copied,        setCopied]        = useState(false)
  const fileRef     = useRef(null)
  const articleId   = extension.options.articleId
  const onOpenModal = extension.options.onOpenModal

  const handleCopy = () => {
    navigator.clipboard.writeText(node.attrs.description || '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  // Direct upload fallback (used when no onOpenModal callback is provided)
  const handleDirectUpload = async (file) => {
    if (!file) return
    setUploading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('articleId', articleId || 'placeholder')
      const res  = await fetch('/api/upload-inline-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Muat naik gagal')
      const pos     = getPos()
      const imgNode = editor.schema.nodes.image.create({ src: data.url, alt: node.attrs.description || undefined })
      editor.view.dispatch(editor.state.tr.replaceWith(pos, pos + 1, imgNode))
    } catch (err) {
      setError(err.message)
      setUploading(false)
    }
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (onOpenModal) {
      onOpenModal({
        file:        f,
        pos:         getPos(),
        description: node.attrs.description || '',
        altText:     node.attrs.altText      || node.attrs.description || '',
        caption:     node.attrs.caption      || '',
      })
    } else {
      handleDirectUpload(f)
    }
  }

  const handleSkipConfirmed = () => {
    setShowSkipModal(false)
    const pos = getPos()
    editor.view.dispatch(editor.state.tr.delete(pos, pos + 1))
  }

  return (
    <NodeViewWrapper>
      <style>{`
        .imgph-block {
          border: 2px dashed rgba(212,168,83,0.38);
          border-radius: 6px;
          padding: 10px 14px;
          margin: 12px 0;
          background: rgba(212,168,83,0.03);
          display: flex;
          align-items: center;
          gap: 12px;
          user-select: none;
          box-sizing: border-box;
        }
        .imgph-desc {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-size: 12px;
          color: #56514d;
          line-height: 1.4;
          font-family: 'DM Sans', sans-serif;
        }
        .imgph-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        @media (max-width: 640px) {
          .imgph-block {
            flex-direction: column;
            align-items: flex-start;
            padding: 8px 10px;
            gap: 8px;
          }
          .imgph-desc {
            -webkit-line-clamp: 2;
          }
          .imgph-actions {
            width: 100%;
          }
          .imgph-actions button {
            flex: 1;
            justify-content: center;
          }
        }
        @media (min-width: 641px) {
          .imgph-desc {
            -webkit-line-clamp: unset;
          }
        }
      `}</style>

      <ConfirmationModal
        open={showSkipModal}
        title="Langkau Cadangan Imej?"
        message="Cadangan imej ini akan dibuang dan tidak akan muncul dalam artikel yang diterbitkan."
        confirmLabel="Ya, Langkau"
        cancelLabel="Batal"
        confirmColor="amber"
        onConfirm={handleSkipConfirmed}
        onCancel={() => setShowSkipModal(false)}
      />

      <div className="imgph-block" contentEditable={false}>
        {/* Image icon */}
        <svg width="18" height="18" fill="none" stroke="rgba(212,168,83,0.45)" strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>

        {/* Description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '2px' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(212,168,83,0.45)', fontFamily: "'DM Sans',sans-serif" }}>
              Cadangan Imej AI
            </div>
            {/* Copy button */}
            <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
              <button
                onClick={handleCopy}
                title="Salin penerangan"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                  color: copied ? '#d4a853' : 'rgba(212,168,83,0.35)',
                  display: 'flex', alignItems: 'center', borderRadius: '3px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { if (!copied) e.currentTarget.style.color = 'rgba(212,168,83,0.65)' }}
                onMouseLeave={e => { if (!copied) e.currentTarget.style.color = 'rgba(212,168,83,0.35)' }}
              >
                <CopyIcon />
              </button>
              {copied && (
                <span style={{
                  position: 'absolute', bottom: '100%', right: 0, marginBottom: '4px',
                  background: '#1e1c1a', border: '1px solid rgba(237,232,223,0.12)',
                  color: '#d4a853', fontSize: '10px', fontWeight: 600,
                  padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap',
                  fontFamily: "'DM Sans',sans-serif", pointerEvents: 'none',
                }}>
                  Disalin
                </span>
              )}
            </div>
          </div>
          <div className="imgph-desc">
            {node.attrs.description}
          </div>
          {error && (
            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px', fontFamily: "'DM Sans',sans-serif" }}>
              {error}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="imgph-actions">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '4px 11px', borderRadius: '4px', border: 'none',
              background: uploading ? 'rgba(212,168,83,0.1)' : 'rgba(212,168,83,0.14)',
              color: '#d4a853', fontSize: '11.5px', fontWeight: 600,
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {uploading ? 'Memuat…' : 'Muat Naik'}
          </button>
          <button
            onClick={() => setShowSkipModal(true)}
            style={{
              padding: '4px 9px', borderRadius: '4px',
              border: '1px solid rgba(237,232,223,0.1)',
              background: 'transparent', color: '#56514d',
              fontSize: '11.5px', cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Langkau
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={handleFileChange} />
      </div>
    </NodeViewWrapper>
  )
}

/* ── Extension factory ── */
export function createImagePlaceholderExtension(articleId = '', onOpenModal = null) {
  return Node.create({
    name: 'imagePlaceholder',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: false,

    addOptions() { return { articleId, onOpenModal } },

    addAttributes() {
      return {
        description: { default: '' },
        placement:   { default: '' },
        altText:     { default: '' },
        caption:     { default: '' },
      }
    },

    parseHTML() {
      return [{ tag: 'div[data-type="image-placeholder"]' }]
    },

    renderHTML({ node, HTMLAttributes }) {
      return ['div', mergeAttributes(HTMLAttributes, {
        'data-type':        'image-placeholder',
        'data-description': node.attrs.description,
        'data-placement':   node.attrs.placement,
        'data-alt-text':    node.attrs.altText,
        'data-caption':     node.attrs.caption,
        style:              'display:none',
      })]
    },

    addNodeView() {
      return ReactNodeViewRenderer(ImagePlaceholderNodeView)
    },
  })
}
