'use client'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export default function AdminLoader() {
  const pathname  = usePathname()
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const prevPath  = useRef(pathname)
  const hideRef   = useRef(null)
  const showTime  = useRef(null)

  /* Show IMMEDIATELY on admin link clicks — covers the Next.js blank-page gap */
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a')
      if (!a) return
      const href = a.getAttribute('href') || ''
      if (!href.startsWith('/admin')) return
      const dest = href.split('?')[0].split('#')[0]
      if (dest === window.location.pathname) return

      // Cancel any pending hide from a previous navigation
      clearTimeout(hideRef.current)
      setLeaving(false)
      setVisible(true)
      showTime.current = Date.now()
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  /* Dismiss when pathname changes — but respect a 350ms minimum display time */
  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname

    const elapsed   = Date.now() - (showTime.current ?? 0)
    const MIN_SHOW  = 350
    const remaining = Math.max(0, MIN_SHOW - elapsed)

    hideRef.current = setTimeout(() => {
      setLeaving(true)
      setTimeout(() => { setVisible(false); setLeaving(false) }, 280)
    }, remaining)

    return () => clearTimeout(hideRef.current)
  }, [pathname])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(12,11,10,0.82)',
      backdropFilter: 'blur(2px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      /* Always in DOM at opacity:0 — same trick as PageLoader so fade-in works */
      opacity: !visible ? 0 : leaving ? 0 : 1,
      transition: leaving ? 'opacity 0.28s ease' : 'none', /* instant show to eliminate white flash */
      pointerEvents: visible && !leaving ? 'all' : 'none',
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%',
        border: '2px solid rgba(212,168,83,0.12)',
        borderTop: '2px solid #d4a853',
        animation: 'al-spin 0.72s linear infinite',
        marginBottom: '14px',
      }} />
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
