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

export default function PublicNavbar() {
  const [searchOpen, setSearchOpen]   = useState(false)
  const [query,      setQuery]        = useState('')
  const [results,    setResults]      = useState([])
  const [loading,    setLoading]      = useState(false)
  const inputRef     = useRef(null)
  const searchAreaRef = useRef(null)

  /* ── Navbar scroll border ── */
  useEffect(() => {
    const h = () => {
      const nav = document.getElementById('navbar')
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 60)
    }
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  /* ── Escape key closes search ── */
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') closeSearch() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  /* ── Click outside closes search ── */
  useEffect(() => {
    const h = (e) => {
      if (searchAreaRef.current && !searchAreaRef.current.contains(e.target)) closeSearch()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  /* ── Debounced search: 300 ms ── */
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

  const openSearch = () => {
    setSearchOpen(true)
    setTimeout(() => inputRef.current?.focus(), 120)
  }
  const closeSearch = () => {
    setSearchOpen(false)
    setQuery('')
    setResults([])
    setLoading(false)
  }

  const toggleTheme = () => {
    const html = document.documentElement
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    html.setAttribute('data-theme', next)
    localStorage.setItem('sn-theme', next)
  }

  const showDropdown = searchOpen && query.length >= 2

  return (
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

            {/* ── Inline search area ── */}
            <div ref={searchAreaRef} className={`search-area${searchOpen ? ' open' : ''}`}>
              <div className="search-input-wrap">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && closeSearch()}
                  placeholder="Cari artikel…"
                  className="search-inline-input"
                  autoComplete="off"
                  spellCheck="false"
                />
                <button
                  className="btn-search-icon"
                  onClick={searchOpen ? closeSearch : openSearch}
                  aria-label="Cari"
                >
                  {searchOpen ? (
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* ── Results dropdown ── */}
              {showDropdown && (
                <div className="search-dropdown">
                  {loading && (
                    <div className="search-status">Mencari…</div>
                  )}
                  {!loading && results.length === 0 && (
                    <div className="search-status">Tiada artikel dijumpai untuk &ldquo;{query}&rdquo;</div>
                  )}
                  {!loading && results.length > 0 && results.map(r => (
                    <Link
                      key={r.id}
                      href={`/artikel/${r.slug}`}
                      onClick={closeSearch}
                      className="search-result-item"
                    >
                      <div className="search-result-thumb">
                        <img
                          src={r.featured_image ?? `https://picsum.photos/seed/${r.slug}/160/90`}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.82) saturate(0.6)' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="search-result-title">{r.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '5px' }}>
                          {r.tags?.[0] && (
                            <span className={`tag ${tagClass(r.tags[0])}`}>{r.tags[0]}</span>
                          )}
                          <span className="search-result-date">{fmtDate(r.created_at)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* ── Theme toggle ── */}
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
  )
}
