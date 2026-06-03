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

export default function PublicNavbar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query,      setQuery]      = useState('')
  const [results,    setResults]    = useState([])
  const [loading,    setLoading]    = useState(false)
  const inputRef = useRef(null)

  /* ── Navbar scroll border ── */
  useEffect(() => {
    const h = () => {
      const nav = document.getElementById('navbar')
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 60)
    }
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  /* ── Escape key ── */
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') closeSearch() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  /* ── Focus input when overlay opens ── */
  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 60)
  }, [searchOpen])

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

  const openSearch = () => { setSearchOpen(true) }
  const closeSearch = () => { setSearchOpen(false); setQuery(''); setResults([]); setLoading(false) }
  const fillSearch  = (text) => { setQuery(text); inputRef.current?.focus() }

  const toggleTheme = () => {
    const html = document.documentElement
    html.classList.add('theme-transitioning')
    setTimeout(() => html.classList.remove('theme-transitioning'), 380)
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    html.setAttribute('data-theme', next)
    localStorage.setItem('sn-theme', next)
  }

  const showResults = query.length >= 2

  return (
    <>
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className="navbar" id="navbar">
        <div className="container">
          <div className="navbar-inner">
            <a href="/" className="logo">
              <span className="logo-word">Sharpable</span>
              <span className="logo-dot"></span>
            </a>
            <div className="nav-pipe"></div>
            <nav className="nav-links">
              <a href="#" className="nav-link active">Terkini</a>
              <a href="#" className="nav-link">Penyelidikan</a>
              <a href="#" className="nav-link">Permulaan</a>
              <a href="#" className="nav-link">Alatan</a>
              <a href="#" className="nav-link">Dasar</a>
              <a href="#" className="nav-link">Analisis</a>
              <a href="#" className="nav-link">Industri</a>
            </nav>
            <div className="nav-right">
              <button className="btn-subscribe">Langgan</button>
              {/* Search icon — opens full-screen overlay */}
              <button className="btn-search-icon" onClick={openSearch} aria-label="Cari">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
              <button className="theme-icon-btn" onClick={toggleTheme} aria-label="Tukar tema">
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

      {/* ═══════════ SEARCH OVERLAY ═══════════ */}
      <div className={`search-overlay${searchOpen ? ' open' : ''}`}>
        <button className="s-close" onClick={closeSearch}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="s-wrap">
          {/* Search input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg width="22" height="22" fill="none" stroke="rgba(237,232,223,0.3)" strokeWidth="1.8" viewBox="0 0 24 24"
              style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', flexShrink: 0, pointerEvents: 'none' }}>
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
              style={{ paddingLeft: '36px' }}
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
