'use client'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export default function AdminLoader() {
  const pathname  = usePathname()
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const prevPath  = useRef(pathname)
  const delayRef  = useRef(null)
  const hideRef   = useRef(null)

  /* Show with 300 ms delay on admin link clicks (so fast transitions don't flash) */
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a')
      if (!a) return
      const href = a.getAttribute('href') || ''
      if (!href.startsWith('/admin')) return
      const dest = href.split('?')[0].split('#')[0]
      if (dest === window.location.pathname) return

      clearTimeout(delayRef.current)
      clearTimeout(hideRef.current)
      delayRef.current = setTimeout(() => {
        setLeaving(false)
        setVisible(true)
      }, 300)
    }

    document.addEventListener('click', onClick)
    return () => { document.removeEventListener('click', onClick); clearTimeout(delayRef.current) }
  }, [])

  /* Dismiss when pathname changes (navigation complete) */
  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname
    clearTimeout(delayRef.current) // cancel pending show if navigation was fast
    setLeaving(true)
    hideRef.current = setTimeout(() => { setVisible(false); setLeaving(false) }, 320)
  }, [pathname])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(12,11,10,0.82)',
      backdropFilter: 'blur(2px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      /* Always in DOM at opacity:0 so fade-in works (same trick as PageLoader) */
      opacity: !visible ? 0 : leaving ? 0 : 1,
      transition: leaving ? 'opacity 0.28s ease' : 'opacity 0.18s ease',
      pointerEvents: visible && !leaving ? 'all' : 'none',
    }}>
      {/* Thin amber-arc spinner */}
      <div style={{
        width: '38px', height: '38px',
        borderRadius: '50%',
        border: '2px solid rgba(212,168,83,0.12)',
        borderTop: '2px solid #d4a853',
        animation: 'al-spin 0.72s linear infinite',
        marginBottom: '14px',
      }} />

      {/* Wordmark */}
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '10px', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'rgba(212,168,83,0.42)',
      }}>
        Sharpable News
      </span>

      <style>{`@keyframes al-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
