'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const TAG_CLASSES = {
  penyelidikan: 't-research', research: 't-research',
  analisis: 't-analysis',    analysis: 't-analysis',
  permulaan: 't-startups',   startups: 't-startups',
  dasar: 't-policy',         policy: 't-policy',
  alatan: 't-tools',         tools: 't-tools',
  industri: 't-industry',    industry: 't-industry',
}
function tagClass(t) { return TAG_CLASSES[t?.toLowerCase()] ?? 't-research' }
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

const POPULAR = ['GPT-5', 'Akta AI EU', 'keterepretasian', 'Mistral', 'Claude', 'ejen AI', 'RLHF']

// Default fallback categories if fetch fails
const DEFAULT_CATEGORIES = ['Penyelidikan', 'Permulaan', 'Alatan', 'Dasar', 'Analisis', 'Industri']

export default function PublicNavbar() {
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [query,         setQuery]         = useState('')
  const [results,       setResults]       = useState([])
  const [loading,       setLoading]       = useState(false)
  const [categories,    setCategories]    = useState(DEFAULT_CATEGORIES)
  const [subOpen,       setSubOpen]       = useState(false)
  const [subEmail,      setSubEmail]      = useState('')
  const [subError,      setSubError]      = useState('')
  const [subSuccess,    setSubSuccess]    = useState(false)
  const [subSubmitting, setSubSubmitting] = useState(false)
  const inputRef    = useRef(null)
  const subInputRef = useRef(null)

  /* ── Fetch dynamic categories ── */
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => { if (data.categories?.length) setCategories(data.categories) })
      .catch(() => {})
  }, [])

  /* ── Navbar scroll border ── */
  useEffect(() => {
    const h = () => {
      const nav = document.getElementById('navbar')
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 60)
    }
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  /* ── Escape key closes overlays ── */
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') {
        closeSearch()
        closeSub()
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  /* ── Focus input when search overlay opens ── */
  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 60)
  }, [searchOpen])

  /* ── Focus email input when sub modal opens ── */
  useEffect(() => {
    if (subOpen) setTimeout(() => subInputRef.current?.focus(), 60)
  }, [subOpen])

  /* ── Debounced search ── */
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        setResults(data.results ?? [])
      } catch { setResults([]) }
      finally  { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const openSearch  = () => { setSearchOpen(true) }
  const closeSearch = () => { setSearchOpen(false); setQuery(''); setResults([]); setLoading(false) }
  const fillSearch  = (text) => { setQuery(text); inputRef.current?.focus() }

  const openSub  = () => { setSubOpen(true); setSubEmail(''); setSubError(''); setSubSuccess(false) }
  const closeSub = () => { setSubOpen(false) }

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const handleSubscribe = async (e) => {
    e.preventDefault()
    setSubError('')
    if (!subEmail.trim()) { setSubError('Sila masukkan alamat emel anda.'); return }
    if (!validateEmail(subEmail)) { setSubError('Format emel tidak sah. Sila semak semula.'); return }

    setSubSubmitting(true)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubError(data.error ?? 'Ralat semasa melanggan. Cuba lagi.')
      } else {
        setSubSuccess(true)
      }
    } catch {
      setSubError('Ralat rangkaian. Cuba lagi.')
    } finally {
      setSubSubmitting(false)
    }
  }

  const showResults = query.length >= 2

  return (
    <>
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className="navbar" id="navbar">
        <div className="container">
          <div className="navbar-inner">
            <Link href="/" className="logo">
              <span className="logo-word">Sharpable</span>
              <span className="logo-dot"></span>
            </Link>
            <div className="nav-pipe"></div>
            <nav className="nav-links">
              <Link href="/" className="nav-link active">Terkini</Link>
              {categories.map(cat => (
                <Link
                  key={cat}
                  href={`/kategori/${encodeURIComponent(cat)}`}
                  className="nav-link"
                >
                  {cat}
                </Link>
              ))}
            </nav>
            <div className="nav-right">
              <button className="btn-subscribe" onClick={openSub}>Langgan</button>
              {/* Search icon — opens full-screen overlay */}
              <button className="btn-search-icon" onClick={openSearch} aria-label="Cari">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
              <button className="theme-icon-btn" onClick={() => {
                const html = document.documentElement
                html.classList.add('theme-transitioning')
                setTimeout(() => html.classList.remove('theme-transitioning'), 380)
                const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
                html.setAttribute('data-theme', next)
                localStorage.setItem('sn-theme', next)
              }} aria-label="Tukar tema">
                <svg className="icon-moon" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <svg className="icon-sun" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════ SUBSCRIPTION MODAL ═══════════ */}
      {subOpen && (
        <div
          onClick={closeSub}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', animation: 'fadeIn 0.18s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0f0e0d',
              border: '1px solid rgba(237,232,223,0.1)',
              borderTop: '3px solid #d4a853',
              borderRadius: '10px',
              padding: '36px 32px 32px',
              width: '100%', maxWidth: '420px',
              boxShadow: '0 32px 96px rgba(0,0,0,0.8)',
              fontFamily: '"DM Sans", sans-serif',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              onClick={closeSub}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(237,232,223,0.4)', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '4px', transition: 'color 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(237,232,223,0.8)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(237,232,223,0.4)'}
              aria-label="Tutup"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Gold eyebrow */}
            <div style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#d4a853', marginBottom: '12px',
            }}>
              Kecerdasan Harian
            </div>

            <h2 style={{
              margin: '0 0 10px',
              fontSize: '22px', fontWeight: 800,
              color: '#ede8df', lineHeight: 1.25,
              letterSpacing: '-0.02em',
              fontFamily: '"Fraunces", serif',
            }}>
              Kekal selangkah lebih maju dalam dunia AI.
            </h2>
            <p style={{
              margin: '0 0 24px',
              fontSize: '14px', color: '#8c857c', lineHeight: 1.65,
            }}>
              Berita AI & teknologi terpenting, dihantar ke peti masuk anda setiap pagi.
            </p>

            {subSuccess ? (
              <div style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: '8px', padding: '18px 20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '22px', marginBottom: '8px' }}>✓</div>
                <div style={{ color: '#10b981', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>
                  Terima kasih!
                </div>
                <div style={{ color: '#8c857c', fontSize: '13px', lineHeight: 1.6 }}>
                  Anda akan menerima berita terkini kami.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe}>
                <div style={{ marginBottom: '12px' }}>
                  <input
                    ref={subInputRef}
                    type="email"
                    value={subEmail}
                    onChange={e => { setSubEmail(e.target.value); setSubError('') }}
                    placeholder="anda@emel.com"
                    autoComplete="email"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(237,232,223,0.05)',
                      border: `1px solid ${subError ? 'rgba(239,68,68,0.5)' : 'rgba(237,232,223,0.12)'}`,
                      borderRadius: '7px', padding: '12px 14px',
                      color: '#ede8df', fontSize: '14px',
                      fontFamily: '"DM Sans", sans-serif',
                      outline: 'none',
                      transition: 'border-color 0.12s',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(212,168,83,0.5)'}
                    onBlur={e => e.currentTarget.style.borderColor = subError ? 'rgba(239,68,68,0.5)' : 'rgba(237,232,223,0.12)'}
                  />
                  {subError && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', paddingLeft: '2px' }}>
                      {subError}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={subSubmitting}
                  style={{
                    width: '100%',
                    background: subSubmitting ? 'rgba(212,168,83,0.5)' : '#d4a853',
                    color: '#0c0b0a', border: 'none',
                    borderRadius: '7px', padding: '13px',
                    fontSize: '14px', fontWeight: 700,
                    cursor: subSubmitting ? 'default' : 'pointer',
                    fontFamily: '"DM Sans", sans-serif',
                    letterSpacing: '0.01em',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!subSubmitting) e.currentTarget.style.background = '#c49640' }}
                  onMouseLeave={e => { if (!subSubmitting) e.currentTarget.style.background = '#d4a853' }}
                >
                  {subSubmitting ? 'Menghantar…' : 'Langgan Sekarang'}
                </button>
              </form>
            )}

            <p style={{
              margin: '14px 0 0',
              fontSize: '11.5px', color: 'rgba(140,133,124,0.7)',
              textAlign: 'center', lineHeight: 1.6,
            }}>
              Tiada spam. Berhenti langgan bila-bila masa.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════ SEARCH OVERLAY ═══════════ */}
      <div className={`search-overlay${searchOpen ? ' open' : ''}`}>
        <button className="s-close" onClick={closeSearch}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="s-wrap">
          {/* Search input — icon is a flex sibling for proper vertical centering */}
          <div className="s-input-row">
            <svg width="22" height="22" fill="none" stroke="rgba(237,232,223,0.3)" strokeWidth="1.8" viewBox="0 0 24 24"
              style={{ flexShrink: 0, pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              className="s-input"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && closeSearch()}
              placeholder="Cari rencana…"
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          {/* ── Results or popular searches ── */}
          {showResults ? (
            <div className="s-results">
              {loading && (
                <div className="s-results-msg">Mencari…</div>
              )}
              {!loading && results.length === 0 && (
                <div className="s-results-msg">
                  Tiada artikel dijumpai untuk &ldquo;<strong style={{ color: '#ede8df' }}>{query}</strong>&rdquo;
                </div>
              )}
              {!loading && results.length > 0 && results.map((r, idx) => (
                <Link
                  key={r.id}
                  href={`/artikel/${r.slug}`}
                  className="s-result-link"
                  style={{ animation: 'resultFadeUp 0.28s ease both', animationDelay: `${idx * 0.06}s` }}
                  onClick={closeSearch}
                >
                  <div className="s-result-thumb-lg">
                    <img
                      src={r.featured_image ?? `https://picsum.photos/seed/${r.slug}/168/108`}
                      alt=""
                    />
                  </div>
                  <div className="s-result-body">
                    <div className="s-result-title-lg">{r.title}</div>
                    <div className="s-result-meta-row">
                      {r.tags?.[0] && (
                        <span className={`tag ${tagClass(r.tags[0])}`}>{r.tags[0]}</span>
                      )}
                      <span>{fmtDate(r.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <>
              <p className="s-hint">Carian popular:</p>
              <div className="s-tags">
                {POPULAR.map(tag => (
                  <span key={tag} className="s-tag" onClick={() => fillSearch(tag)}>{tag}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
