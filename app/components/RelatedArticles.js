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
  return new Date(iso).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function RelatedArticles({ articles = [] }) {
  const [current, setCurrent]   = useState(0)
  const [visible, setVisible]   = useState(true)
  const [tick,    setTick]      = useState(0)   // bump to reset interval
  const touchStartX = useRef(null)

  /* Auto-advance every 5 s; resets when user clicks a dot */
  useEffect(() => {
    if (articles.length <= 1) return
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % articles.length)
        setVisible(true)
      }, 220)
    }, 5000)
    return () => clearInterval(timer)
  }, [articles.length, tick])

  if (!articles.length) return null

  const goTo = (idx) => {
    if (idx === current) return
    setVisible(false)
    setTimeout(() => { setCurrent(idx); setVisible(true) }, 220)
    setTick(t => t + 1)
  }

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd   = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 44) {
      const next = diff > 0
        ? (current + 1) % articles.length
        : (current - 1 + articles.length) % articles.length
      goTo(next)
    }
    touchStartX.current = null
  }

  const article = articles[current]

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto 56px', padding: '0 20px', boxSizing: 'border-box' }}>
      {/* Section heading */}
      <div className="sec-head" style={{ marginBottom: '18px' }}>
        <div className="sec-label">Artikel Berkait</div>
      </div>

      {/* Single card with fade transition */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.22s ease',
          userSelect: 'none',
        }}
      >
        <Link href={`/artikel/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            overflow: 'hidden',
            transition: 'border-color 0.18s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {/* Image with tag pill overlay */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--bg-card)' }}>
              <img
                src={article.featured_image ?? `https://picsum.photos/seed/${article.slug}/800/450`}
                alt={article.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  filter: 'brightness(0.82) saturate(0.65)', transition: 'filter 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.9) saturate(0.75)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(0.82) saturate(0.65)' }}
              />
              {article.tags?.[0] && (
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <span className={`tag ${tagClass(article.tags[0])}`}>{article.tags[0]}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: '18px 22px 16px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
                {fmtDate(article.created_at)}
              </div>
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '20px',
                fontWeight: 600,
                fontOpticalSizing: 'auto',
                letterSpacing: '-0.025em',
                lineHeight: 1.22,
                color: 'var(--text-1)',
                marginBottom: '8px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                transition: 'color 0.18s',
              }}>
                {article.title}
              </h3>
              {article.meta_description && (
                <p style={{
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  color: 'var(--text-2)',
                  marginBottom: '14px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontFamily: 'var(--font-sans)',
                }}>
                  {article.meta_description}
                </p>
              )}
              {/* Author row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.7 }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>{article.authors?.name ?? 'Sharpable News'}</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Dot indicators */}
      {articles.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '7px', marginTop: '14px' }}>
          {articles.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Artikel ${i + 1}`}
              style={{
                width: i === current ? '20px' : '7px',
                height: '7px',
                borderRadius: '4px',
                border: 'none',
                background: i === current ? 'var(--accent)' : 'var(--border-mid)',
                cursor: 'pointer',
                padding: 0,
                transition: 'width 0.25s ease, background 0.25s ease',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
