'use client'
import { useState, useEffect } from 'react'

export default function PublicNavbar() {
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    /* Navbar border on scroll */
    const handleScroll = () => {
      const navbar = document.getElementById('navbar')
      if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    /* Keyboard shortcuts */
    const handleKeydown = (e) => {
      if (e.key === 'Escape') setSearchOpen(false)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    document.addEventListener('keydown', handleKeydown)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [])

  useEffect(() => {
    if (searchOpen) setTimeout(() => document.getElementById('searchInput')?.focus(), 60)
  }, [searchOpen])

  const toggleTheme = () => {
    const html = document.documentElement
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    html.setAttribute('data-theme', next)
    localStorage.setItem('sn-theme', next)
  }

  const fillSearch = (text) => {
    const input = document.getElementById('searchInput')
    if (input) { input.value = text; input.focus() }
  }

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
              {/* Order: Langgan → Search icon → Theme toggle */}
              <button className="btn-subscribe">Langgan</button>
              <button className="btn-search-icon" onClick={() => setSearchOpen(true)} aria-label="Cari">
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
      <div className={`search-overlay${searchOpen ? ' open' : ''}`} id="searchOverlay">
        <button className="s-close" onClick={() => setSearchOpen(false)}>✕</button>
        <div className="s-wrap">
          <input className="s-input" type="text" id="searchInput" placeholder="Cari rencana…" />
          <p className="s-hint">Carian popular:</p>
          <div className="s-tags">
            {['GPT-5', 'Akta AI EU', 'keterepretasian', 'Mistral', 'Claude', 'ejen AI', 'RLHF'].map(tag => (
              <span key={tag} className="s-tag" onClick={() => fillSearch(tag)}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
