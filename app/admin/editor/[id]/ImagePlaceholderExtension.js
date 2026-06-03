'use client'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState, useRef } from 'react'

/* ── React NodeView component ── */
function ImagePlaceholderNodeView({ node, getPos, editor, extension }) {
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const fileRef   = useRef(null)
  const articleId = extension.options.articleId

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('articleId', articleId || 'placeholder')
      const res  = await fetch('/api/upload-inline-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Muat naik gagal')

      // Replace placeholder with a real image node
      const pos  = getPos()
      const imgNode = editor.schema.nodes.image.create({
        src: data.url,
        alt: node.attrs.description || undefined,
      })
      editor.view.dispatch(editor.state.tr.replaceWith(pos, pos + 1, imgNode))
    } catch (err) {
      setError(err.message)
      setUploading(false)
    }
  }

  const handleSkip = () => {
    const pos = getPos()
    editor.view.dispatch(editor.state.tr.delete(pos, pos + 1))
  }

  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        style={{
          border: '2px dashed rgba(212,168,83,0.38)',
          borderRadius: '6px',
          padding: '10px 14px',
          margin: '12px 0',
          background: 'rgba(212,168,83,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          userSelect: 'none',
        }}
      >
        {/* Image icon */}
        <svg width="18" height="18" fill="none" stroke="rgba(212,168,83,0.45)" strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>

        {/* Description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(212,168,83,0.45)', marginBottom: '2px', fontFamily: "'DM Sans',sans-serif" }}>
            Cadangan Imej AI
          </div>
          <div style={{ fontSize: '12px', color: '#56514d', lineHeight: 1.4, fontFamily: "'DM Sans',sans-serif" }}>
            {node.attrs.description}
          </div>
          {error && (
            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px', fontFamily: "'DM Sans',sans-serif" }}>
              {error}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
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
            onClick={handleSkip}
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
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }} />
      </div>
    </NodeViewWrapper>
  )
}

/* ── Extension factory ── */
export function createImagePlaceholderExtension(articleId = '') {
  return Node.create({
    name: 'imagePlaceholder',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: false,

    addOptions() { return { articleId } },

    addAttributes() {
      return {
        description: { default: '' },
        placement:   { default: '' },
      }
    },

    parseHTML() {
      return [{ tag: 'div[data-type="image-placeholder"]' }]
    },

    renderHTML({ node, HTMLAttributes }) {
      // Renders as a hidden div — stripped from body on publish via save logic
      return ['div', mergeAttributes(HTMLAttributes, {
        'data-type':        'image-placeholder',
        'data-description': node.attrs.description,
        'data-placement':   node.attrs.placement,
        style:              'display:none',
      })]
    },

    addNodeView() {
      return ReactNodeViewRenderer(ImagePlaceholderNodeView)
    },
  })
}
