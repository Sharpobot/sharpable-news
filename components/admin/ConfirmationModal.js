'use client'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Reusable confirmation modal.
 *
 * Props:
 *   open         boolean  — whether modal is visible
 *   title        string   — modal heading
 *   message      string   — body text
 *   confirmLabel string   — confirm button label (default "Teruskan")
 *   cancelLabel  string   — cancel button label (default "Batal")
 *   confirmColor 'red'|'amber'  — confirm button colour (default 'amber')
 *   onConfirm    fn       — called when user confirms
 *   onCancel     fn       — called when user cancels or clicks backdrop
 */
export default function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel = 'Teruskan',
  cancelLabel  = 'Batal',
  confirmColor = 'amber',
  onConfirm,
  onCancel,
}) {
  // Trap Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onCancel?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  const confirmBg    = confirmColor === 'red'   ? '#ef4444' : '#d4a853'
  const confirmClr   = confirmColor === 'red'   ? '#fff'    : '#0c0b0a'
  const confirmHover = confirmColor === 'red'   ? '#dc2626' : '#c49640'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onCancel}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#161412', border: '1px solid rgba(237,232,223,0.11)',
              borderRadius: '10px', padding: '28px 28px 24px',
              width: '100%', maxWidth: '400px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <h2 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: 700, color: '#ede8df', fontFamily: "'Fraunces', serif" }}>
              {title}
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '13.5px', color: '#8c857c', lineHeight: 1.6 }}>
              {message}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={onCancel}
                style={{
                  padding: '9px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                  background: 'transparent', border: '1px solid rgba(237,232,223,0.11)',
                  color: '#8c857c', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(237,232,223,0.22)'; e.currentTarget.style.color = '#ede8df' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(237,232,223,0.11)'; e.currentTarget.style.color = '#8c857c' }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                style={{
                  padding: '9px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                  background: confirmBg, color: confirmClr, border: 'none',
                  cursor: 'pointer', transition: 'background 0.15s',
                  fontFamily: "'DM Sans', sans-serif",
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
