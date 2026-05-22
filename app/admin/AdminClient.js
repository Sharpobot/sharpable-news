'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { logoutAction } from './actions'

/* ── Agent pipeline order ─────────────────────────────────── */
const AGENTS = [
  { key: 'trend-scout',     label: 'trend-scout' },
  { key: 'topic-selector',  label: 'topic-selector' },
  { key: 'deep-researcher', label: 'deep-researcher' },
  { key: 'article-writer',  label: 'article-writer' },
  { key: 'seo-metadata',    label: 'seo-metadata' },
  { key: 'image-brief',     label: 'image-brief' },
  { key: 'quality-checker', label: 'quality-checker' },
]

/* ── Status badge ─────────────────────────────────────────── */
const STATUS_CFG = {
  generating:      { label: 'Menjana',   color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  ready_to_review: { label: 'Semak',     color: '#1e3a8a', bg: '#dbeafe', dot: '#3b82f6' },
  draft:           { label: 'Draf',      color: '#374151', bg: '#f3f4f6', dot: '#9ca3af' },
  published:       { label: 'Diterbit',  color: '#064e3b', bg: '#d1fae5', dot: '#10b981' },
}

/* Statuses that link to the editor */
const EDITABLE_STATUSES = new Set(['ready_to_review', 'draft', 'published'])

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: '#374151', bg: '#f3f4f6', dot: '#9ca3af' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: '999px',
      fontSize: '11.5px', fontWeight: 600,
      letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

/* ── Spinner ──────────────────────────────────────────────── */
function Spinner({ size = 13 }) {
  return (
    <span style={{
      display: 'inline-block',
      width: `${size}px`, height: `${size}px`,
      border: '2px solid #2a2a2a',
      borderTopColor: '#f59e0b',
      borderRadius: '50%',
      animation: 'admin-spin 0.75s linear infinite',
      flexShrink: 0,
    }} />
  )
}

/* ── Progress card for a single generating article ────────── */
function ProgressCard({ article, progress }) {
  const map = {}
  ;(progress ?? []).forEach(row => {
    if (!map[row.agent_name]) map[row.agent_name] = row
  })

  const allDone   = AGENTS.every(a => map[a.key]?.status === 'done')
  const hasFailed = AGENTS.some(a => map[a.key]?.status === 'failed')

  return (
    <div className="progress-card" style={{
      background: '#0e0e0e',
      border: '1px solid #222',
      borderRadius: '10px',
      marginBottom: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        {allDone    ? <span style={{ color: '#10b981', fontSize: '14px', lineHeight: 1 }}>✓</span>
         : hasFailed ? <span style={{ color: '#ef4444', fontSize: '14px', lineHeight: 1 }}>✗</span>
         : <Spinner size={13} />}
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#c0c0c0' }}>
          {allDone ? 'Selesai' : hasFailed ? 'Gagal' : 'Sedang dijana…'}
        </span>
        <span style={{ fontSize: '11px', color: '#3a3a3a', fontFamily: 'monospace', marginLeft: '2px' }}>
          {article.id.slice(0, 8)}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {AGENTS.map(agent => {
          const row    = map[agent.key]
          const status = row?.status

          return (
            <div key={agent.key} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '5px 8px', borderRadius: '6px',
              background: status === 'running' ? '#161600' : 'transparent',
              transition: 'background 0.2s',
            }}>
              <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {status === 'running' && <Spinner size={12} />}
                {status === 'done'    && <span style={{ color: '#10b981', fontSize: '13px' }}>✓</span>}
                {status === 'failed'  && <span style={{ color: '#ef4444', fontSize: '13px' }}>✗</span>}
                {!status              && <span style={{ color: '#2a2a2a', fontSize: '13px' }}>○</span>}
              </span>
              <span style={{
                fontSize: '12px', fontFamily: 'monospace',
                color: status === 'running' ? '#f0c040'
                     : status === 'done'    ? '#10b981'
                     : status === 'failed'  ? '#ef4444'
                     : '#2e2e2e',
                fontWeight: status === 'running' ? 600 : 400,
                minWidth: '130px',
              }}>
                {agent.key}
              </span>
              {row?.message && (
                <span style={{ fontSize: '11.5px', color: '#484848', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.message}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Stable date formatter (avoids server/client locale mismatch) ── */
const MONTHS = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogos','Sep','Okt','Nov','Dis']
function fmt(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/* ── Main client component ────────────────────────────────── */
export default function AdminClient({ initialArticles }) {
  const [articles,      setArticles]      = useState(initialArticles ?? [])
  const [generatingIds, setGeneratingIds] = useState(() =>
    (initialArticles ?? []).filter(a => a.status === 'generating').map(a => a.id)
  )
  const [progressMap,   setProgressMap]   = useState({})
  const [isCreating,    setIsCreating]    = useState(false)

  const intervalRef      = useRef(null)
  const generatingIdsRef = useRef(generatingIds)

  useEffect(() => { generatingIdsRef.current = generatingIds }, [generatingIds])

  /* ── Polling logic ───────────────────────────────────────── */
  useEffect(() => {
    if (generatingIds.length === 0) {
      clearInterval(intervalRef.current)
      return
    }

    const poll = async () => {
      const ids = generatingIdsRef.current
      if (ids.length === 0) return

      const results = await Promise.all(
        ids.map(id =>
          fetch(`/api/progress?articleId=${id}`)
            .then(r => r.json())
            .then(d => ({ id, progress: d.progress ?? [] }))
            .catch(() => ({ id, progress: [] }))
        )
      )

      setProgressMap(prev => {
        const next = { ...prev }
        results.forEach(({ id, progress }) => { next[id] = progress })
        return next
      })

      const finished = results
        .filter(({ progress }) => {
          const map = {}
          progress.forEach(r => { if (!map[r.agent_name]) map[r.agent_name] = r })
          return AGENTS.every(a => map[a.key]?.status === 'done' || map[a.key]?.status === 'failed')
        })
        .map(r => r.id)

      if (finished.length > 0) {
        try {
          const res = await fetch('/api/articles')
          const { articles: updated } = await res.json()
          if (updated) setArticles(updated)
        } catch { /* ignore */ }
        setGeneratingIds(prev => prev.filter(id => !finished.includes(id)))
      }
    }

    poll()
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(poll, 3000)
    return () => clearInterval(intervalRef.current)
  }, [generatingIds])

  /* ── Generate handler ────────────────────────────────────── */
  const handleGenerate = async () => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/generate', { method: 'POST' })
      const { articleId, error } = await res.json()
      if (error) { alert(`Ralat: ${error}`); return }

      setArticles(prev => [{
        id: articleId,
        title: null,
        slug: null,
        status: 'generating',
        created_at: new Date().toISOString(),
      }, ...prev])
      setGeneratingIds(prev => [...prev, articleId])
    } catch (err) {
      alert(`Ralat: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  const generatingArticles = articles.filter(a => generatingIds.includes(a.id))

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: "'DM Sans', sans-serif", color: '#f0f0f0' }}>

      <style>{`
        @keyframes admin-spin { to { transform: rotate(360deg); } }

        .admin-header {
          border-bottom: 1px solid #1e1e1e;
          padding: 0 32px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          background: #0a0a0a;
          z-index: 10;
          gap: 12px;
        }
        .admin-header-left { display: flex; align-items: center; gap: 16px; min-width: 0; }
        .admin-wordmark { display: flex; align-items: center; gap: 0; white-space: nowrap; flex-shrink: 0; }
        .admin-main { padding: 32px; }
        .article-table-header {
          display: grid;
          grid-template-columns: 1fr 140px 130px;
          padding: 10px 20px;
          border-bottom: 1px solid #1e1e1e;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase; color: #444;
        }
        .article-row {
          display: grid;
          grid-template-columns: 1fr 140px 130px;
          padding: 14px 20px;
          align-items: center;
        }
        .article-date { font-size: 12px; color: #555; }
        .article-status-mobile { display: none; }
        .progress-card { padding: 14px 18px; }

        @media (max-width: 640px) {
          .admin-header { padding: 0 16px; height: auto; min-height: 56px; flex-wrap: wrap; padding-top: 10px; padding-bottom: 10px; }
          .admin-header-left { width: 100%; justify-content: space-between; gap: 8px; }
          .admin-wordmark { display: none; }
          .admin-logout { align-self: flex-end; }
          .admin-main { padding: 16px; }
          .article-table-header { display: none; }
          .article-row {
            grid-template-columns: 1fr auto;
            grid-template-rows: auto auto;
            padding: 12px 16px;
            gap: 4px 8px;
          }
          .article-row-title { grid-column: 1; grid-row: 1; }
          .article-row-status { grid-column: 2; grid-row: 1; align-self: start; }
          .article-date { display: none; }
          .article-status-mobile { display: block; grid-column: 1; grid-row: 2; }
          .progress-card { padding: 12px 14px; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-wordmark">
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>
              Sharpable News
            </span>
            <span style={{ margin: '0 10px', color: '#333' }}>·</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f0' }}>Admin</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isCreating}
            style={{
              padding: '7px 14px',
              background: isCreating ? '#333' : '#f0f0f0',
              color: isCreating ? '#666' : '#0a0a0a',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isCreating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {isCreating
              ? <Spinner size={12} />
              : (
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              )
            }
            {isCreating ? 'Menjana…' : 'Artikel Baru AI'}
          </button>
        </div>

        <form action={logoutAction} className="admin-logout">
          <button type="submit" style={{
            padding: '7px 14px',
            background: 'transparent',
            color: '#666',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            Log Keluar
          </button>
        </form>
      </header>

      {/* ── Main ── */}
      <main className="admin-main">

        {/* Live progress section */}
        {generatingArticles.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ marginBottom: '10px', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444' }}>
              ⚡ Sedang Dijana
            </div>
            {generatingArticles.map(article => (
              <ProgressCard
                key={article.id}
                article={article}
                progress={progressMap[article.id] ?? []}
              />
            ))}
          </div>
        )}

        {/* Article table */}
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Semua Artikel</h2>
          <span style={{ fontSize: '13px', color: '#555' }}>{articles.length} artikel</span>
        </div>

        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', overflow: 'hidden' }}>
          <div className="article-table-header">
            <span>Tajuk</span>
            <span>Status</span>
            <span>Tarikh</span>
          </div>

          {articles.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#444', fontSize: '14px' }}>
              Tiada artikel lagi. Klik "Artikel Baru AI" untuk mula!
            </div>
          ) : (
            articles.map((article, i) => (
              <div key={article.id} className="article-row" style={{
                borderBottom: i < articles.length - 1 ? '1px solid #181818' : 'none',
              }}>
                {/* Title cell */}
                <div className="article-row-title">
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#e0e0e0', lineHeight: 1.4 }}>
                    {EDITABLE_STATUSES.has(article.status) && article.title ? (
                      <Link
                        href={`/admin/editor/${article.id}`}
                        style={{ color: '#d4a853', textDecoration: 'none' }}
                        onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.target.style.textDecoration = 'none'}
                      >
                        {article.title}
                      </Link>
                    ) : (
                      article.title ?? <span style={{ color: '#444', fontStyle: 'italic' }}>Tanpa tajuk</span>
                    )}
                  </div>
                  {article.slug && !/^draft-\d+$/.test(article.slug) && (
                    <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>/artikel/{article.slug}</div>
                  )}
                  {/* Date shown below title on mobile */}
                  <div className="article-status-mobile" style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
                    {fmt(article.created_at)}
                  </div>
                </div>

                {/* Status badge */}
                <div className="article-row-status">
                  <StatusBadge status={article.status} />
                </div>

                {/* Date — desktop only */}
                <div className="article-date">{fmt(article.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
