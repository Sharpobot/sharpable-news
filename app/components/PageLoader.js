'use client'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export default function PageLoader() {
  const pathname = usePathname()
  const [visible,  setVisible]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [leaving,  setLeaving]  = useState(false)
  const prevPath   = useRef(pathname)
  const timerRef   = useRef(null)
  const progRef    = useRef(0)

  /* Intercept link clicks to start the loader */
  useEffect(() => {
    const onLinkClick = (e) => {
      const anchor = e.target.closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href') || ''

      // Skip external, hash, mailto, admin, target=_blank
      if (!href ||
          href.startsWith('http') || href.startsWith('//') ||
          href.startsWith('#')    || href.startsWith('mailto') ||
          href.startsWith('tel')  || anchor.target === '_blank' ||
          href.startsWith('/admin')) return

      // Skip if navigating to the same path
      const dest = href.split('?')[0].split('#')[0]
      if (dest === window.location.pathname) return

      // Start loader
      setLeaving(false)
      progRef.current = 14
      setProgress(14)
      setVisible(true)

      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        progRef.current = Math.min(progRef.current + 9, 80)
        setProgress(progRef.current)
      }, 320)
    }

    document.addEventListener('click', onLinkClick)
    return () => {
      document.removeEventListener('click', onLinkClick)
      clearInterval(timerRef.current)
    }
  }, [])

  /* Navigation complete — pathname changed */
  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname
    clearInterval(timerRef.current)
    setProgress(100)
    setLeaving(true)
    const t = setTimeout(() => {
      setVisible(false)
      setProgress(0)
      setLeaving(false)
    }, 480)
    return () => clearTimeout(t)
  }, [pathname])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0c0b0a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: leaving ? 0 : 1,
      transition: leaving ? 'opacity 0.38s ease' : 'opacity 0.14s ease',
      pointerEvents: leaving ? 'none' : 'all',
    }}>
      {/* Logo */}
      <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 0, marginBottom: '28px' }}>
        <span style={{
          fontFamily: "'Fraunces', serif",
          fontSize: '26px', fontWeight: 700,
          color: '#ede8df', letterSpacing: '-0.025em',
        }}>Sharpable</span>
        <span style={{
          display: 'inline-block', width: '5px', height: '5px',
          borderRadius: '50%', background: '#d4a853',
          marginLeft: '2px', marginBottom: '4px',
        }} />
      </div>

      {/* Progress bar */}
      <div style={{
        width: '180px', height: '2px',
        background: 'rgba(237,232,223,0.07)',
        borderRadius: '1px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: '#d4a853', borderRadius: '1px',
          transition: `width ${progress === 100 ? '0.18s' : '0.28s'} ease`,
        }} />
      </div>
    </div>
  )
}
