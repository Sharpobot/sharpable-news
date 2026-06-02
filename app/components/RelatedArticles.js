'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
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

/* ── Single article card ── */
function ArticleCard({ article }) {
  return (
    <Link href={`/artikel/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        overflow: 'hidden',
        height: '100%',
        transition: 'border-color 0.18s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        {/* Image */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--bg-card)' }}>
          <img
            src={article.featured_image ?? `https://picsum.photos/seed/${article.slug}/800/450`}
            alt={article.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              filter: 'brightness(0.82) saturate(0.65)', transition: 'filter 0.3s ease' }}
          />
          {article.tags?.[0] && (
            <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
              <span className={`tag ${tagClass(article.tags[0])}`}>{article.tags[0]}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '16px 18px 14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '7px', fontFamily: 'var(--font-sans)' }}>
            {fmtDate(article.created_at)}
          </div>
          <h3 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: '18px',
            fontWeight: 600,
            fontOpticalSizing: 'auto',
            letterSpacing: '-0.025em',
            lineHeight: 1.22,
            color: 'var(--text-1)',
            marginBottom: '10px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            transition: 'color 0.18s',
          }}>
            {article.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.7 }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>{article.authors?.name ?? 'Sharpable News'}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── Main component ── */
export default function RelatedArticles({ articles = [] }) {
  const [current, setCurrent] = useState(0)
  const [paused,  setPaused]  = useState(false)
  const [animKey, setAnimKey] = useState(0)   // bumping restarts CSS animation
  const scrollRef    = useRef(null)
  const scrollDebRef = useRef(null)

  /* Sync mobile scroll when current changes */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: el.clientWidth * current, behavior: 'smooth' })
  }, [current])

  /* Auto-advance every 5 s — pauses when hovered */
  useEffect(() => {
    if (paused || articles.length <= 1) return
    const t = setTimeout(() => {
      setCurrent(prev => (prev + 1) % articles.length)
      setAnimKey(k => k + 1)
    }, 5000)
    return () => clearTimeout(t)
  }, [current, paused, articles.length, animKey])

  /* Detect manual swipe by listening to scroll end */
  const handleScroll = useCallback(() => {
    clearTimeout(scrollDebRef.current)
    scrollDebRef.current = setTimeout(() => {
      const el = scrollRef.current
      if (!el || !el.clientWidth) return
      const idx = Math.round(el.scrollLeft / el.clientWidth)
      const c   = Math.max(0, Math.min(articles.length - 1, idx))
      setCurrent(prev => {
        if (prev !== c) setAnimKey(k => k + 1)
        return c
      })
    }, 80)
  }, [articles.length])

  const goTo = (idx) => {
    if (idx === current) return
    setCurrent(idx)
    setAnimKey(k => k + 1)
  }

  if (!articles.length) return null

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto 0', padding: '0 20px', boxSizing: 'border-box' }}>
      <div className="sec-head" style={{ marginBottom: '18px' }}>
        <div className="sec-label">Artikel Berkait</div>
      </div>

      {/* ── Desktop: 3-column static grid ── */}
      <div className="related-desktop">
        {articles.map(a => <ArticleCard key={a.id} article={a} />)}
      </div>

      {/* ── Mobile: CSS scroll-snap carousel ── */}
      <div
        ref={scrollRef}
        className="related-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onScroll={handleScroll}
      >
        {articles.map(a => (
          <div key={a.id} className="related-carousel-slide">
            <ArticleCard article={a} />
          </div>
        ))}
      </div>

      {/* ── Progress bar indicators (mobile only) ── */}
      {articles.length > 1 && (
        <div className="related-progress-bars">
          {articles.map((_, i) => (
            <button
              key={i}
              className="related-progress-track"
              onClick={() => goTo(i)}
              aria-label={`Artikel ${i + 1}`}
            >
              <div
                key={i < current ? `past-${i}` : i === current ? `active-${current}-${animKey}` : `future-${i}`}
                className={`related-progress-fill${i === current ? ' active' : ''}${paused ? ' paused' : ''}`}
                style={{
                  width: i < current ? '100%' : i > current ? '0%' : undefined,
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
