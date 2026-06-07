'use client'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Reusable confirmation modal.
 * Props:
 *   open         boolean
 *   title        string
 *   message      string
 *   confirmLabel string   (default "Teruskan")
 *   cancelLabel  string   (default "Batal")
 *   confirmColor 'red'|'amber'  (default 'amber')
 *   onConfirm    fn
 *   onCancel     fn
 */
export default function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel = 'Proceed',
  cancelLabel  = 'Cancel',
  confirmColor = 'amber',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onCancel?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  const isDestructive = confirmColor === 'red'
  const accentColor   = isDestructive ? '#ef4444' : '#d4a853'
  const confirmBg     = isDestructive ? '#ef4444' : '#d4a853'
  const confirmText   = isDestructive ? '#fff'    : '#0c0b0a'
  const confirmHover  = isDestructive ? '#dc2626' : '#c49640'
  const iconBg        = isDestructive ? 'rgba(239,68,68,0.1)' : 'rgba(212,168,83,0.1)'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onCancel}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#161412',
              border: '1px solid rgba(237,232,223,0.1)',
              borderTop: `3px solid ${accentColor}`,
              borderRadius: '10px',
              padding: '28px 28px 24px',
              width: '100%', maxWidth: '380px',
              boxShadow: '0 32px 96px rgba(0,0,0,0.75)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Icon badge */}
            <div style={{
              width: '38px', height: '38px', borderRadius: '8px',
              background: iconBg,
              border: `1px solid ${isDestructive ? 'rgba(239,68,68,0.2)' : 'rgba(212,168,83,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '16px', flexShrink: 0,
            }}>
              {isDestructive ? (
                <svg width="16" height="16" fill="none" stroke={accentColor} strokeWidth="2.2" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              ) : (
                <svg width="16" height="16" fill="none" stroke={accentColor} strokeWidth="2.2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              )}
            </div>

            <h2 style={{
              margin: '0 0 8px', fontSize: '16px', fontWeight: 700,
              color: '#ede8df', lineHeight: 1.3, letterSpacing: '-0.01em',
            }}>
              {title}
            </h2>
            <p style={{
              margin: '0 0 24px', fontSize: '13.5px',
              color: '#8c857c', lineHeight: 1.65,
            }}>
              {message}
            </p>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={onCancel}
                style={{
                  padding: '9px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                  background: 'transparent', border: '1px solid rgba(237,232,223,0.11)',
                  color: '#8c857c', cursor: 'pointer',
                  transition: 'border-color 0.12s, color 0.12s',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(237,232,223,0.25)'; e.currentTarget.style.color = '#ede8df' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(237,232,223,0.11)'; e.currentTarget.style.color = '#8c857c' }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                style={{
                  padding: '9px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                  background: confirmBg, color: confirmText, border: 'none',
                  cursor: 'pointer', transition: 'background 0.12s',
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = confirmHover }}
                onMouseLeave={e => { e.currentTarget.style.background = confirmBg }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
