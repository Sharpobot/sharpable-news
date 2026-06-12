'use client'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
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
  const [isDragOver,    setIsDragOver]    = useState(false)
  const fileRef     = useRef(null)
  const articleId   = extension.options.articleId
  const onOpenModal = extension.options.onOpenModal

  const handleCopy = () => {
    navigator.clipboard.writeText(node.attrs.description || '').then(() => {
      toast.success('Suggestion copied to clipboard.', { duration: 2000 })
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
      if (!res.ok || data.error) throw new Error(data.error || 'Upload failed')
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

  const handleDroppedFile = (f) => {
    if (!f || !f.type?.startsWith('image/')) return
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

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const f = e.dataTransfer?.files?.[0]
    handleDroppedFile(f)
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
          transition: border-color 0.15s, background 0.15s;
        }
        .imgph-block.drag-over {
          border-color: rgba(212,168,83,0.9);
          background: rgba(212,168,83,0.1);
        }
        .imgph-content {
          flex: 1;
          min-width: 0;
        }
        .imgph-label {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(212,168,83,0.45);
          font-family: 'DM Sans', sans-serif;
          margin-bottom: 3px;
        }
        .imgph-desc {
          font-size: 12px;
          color: #7a7269;
          line-height: 1.45;
          font-family: 'DM Sans', sans-serif;
        }
        .imgph-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .imgph-copy {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          padding: 0;
          border-radius: 4px;
          border: 1px solid rgba(237,232,223,0.1);
          background: transparent;
          color: rgba(212,168,83,0.45);
          cursor: pointer;
          flex-shrink: 0;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
        .imgph-copy:hover {
          color: rgba(212,168,83,0.85);
          border-color: rgba(212,168,83,0.28);
          background: rgba(212,168,83,0.06);
        }
        @media (max-width: 640px) {
          .imgph-block {
            flex-wrap: wrap;
            align-items: flex-start;
            padding: 10px 12px;
            gap: 10px;
          }
          .imgph-content {
            flex: 1 1 calc(100% - 34px);
            min-width: 0;
          }
          .imgph-desc {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            overflow: hidden;
          }
          .imgph-actions {
            width: 100%;
            justify-content: flex-end;
          }
          .imgph-actions .imgph-upload,
          .imgph-actions .imgph-skip {
            flex: 1;
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>

      <ConfirmationModal
        open={showSkipModal}
        title="Skip Image Suggestion?"
        message="This image suggestion will be removed and won't appear in the published article."
        confirmLabel="Yes, Skip"
        cancelLabel="Cancel"
        confirmColor="amber"
        onConfirm={handleSkipConfirmed}
        onCancel={() => setShowSkipModal(false)}
      />

      <div
        className={`imgph-block${isDragOver ? ' drag-over' : ''}`}
        contentEditable={false}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Image icon */}
        <svg width="18" height="18" fill="none" stroke="rgba(212,168,83,0.45)" strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>

        {/* Description */}
        <div className="imgph-content">
          <div className="imgph-label">AI Image Suggestion</div>
          <div className="imgph-desc">{node.attrs.description}</div>
          {error && (
            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px', fontFamily: "'DM Sans',sans-serif" }}>
              {error}
            </div>
          )}
        </div>

        {/* Actions: copy + upload + skip */}
        <div className="imgph-actions">
          <button
            type="button"
            className="imgph-copy"
            onClick={handleCopy}
            title="Copy description"
          >
            <CopyIcon />
          </button>
          <button
            type="button"
            className="imgph-upload"
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
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <button
            type="button"
            className="imgph-skip"
            onClick={() => setShowSkipModal(true)}
            style={{
              padding: '4px 9px', borderRadius: '4px',
              border: '1px solid rgba(237,232,223,0.1)',
              background: 'transparent', color: '#7a7269',
              fontSize: '11.5px', cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Skip
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
