'use client'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

const AGENTS = [
  { key: 'trend-scout',     label: 'trend-scout' },
  { key: 'topic-selector',  label: 'topic-selector' },
  { key: 'deep-researcher', label: 'deep-researcher' },
  { key: 'article-writer',  label: 'article-writer' },
  { key: 'seo-metadata',    label: 'seo-metadata' },
  { key: 'image-brief',     label: 'image-brief' },
  { key: 'quality-checker', label: 'quality-checker' },
]

function Spinner({ size = 13 }) {
  return (
    <span style={{
      display: 'inline-block', width: `${size}px`, height: `${size}px`,
      border: '2px solid #2a2a2a', borderTopColor: '#f59e0b',
      borderRadius: '50%', animation: 'jana-spin 0.75s linear infinite', flexShrink: 0,
    }} />
  )
}

function ProgressCard({ article, progress, onCancel }) {
  const map = {}
  ;(progress ?? []).forEach(row => { if (!map[row.agent_name]) map[row.agent_name] = row })

  const doneCount = AGENTS.filter(a => map[a.key]?.status === 'done').length
  const allDone   = doneCount === AGENTS.length
  const hasFailed = AGENTS.some(a => map[a.key]?.status === 'failed')
  const pct       = Math.round((doneCount / AGENTS.length) * 100)

  return (
    <div style={{
      background: '#0e0e0e', border: '1px solid #222', borderRadius: '10px',
      padding: '14px 18px', marginBottom: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        {allDone ? <span style={{ color: '#10b981', fontSize: '14px' }}>✓</span>
         : hasFailed ? <span style={{ color: '#ef4444', fontSize: '14px' }}>✗</span>
         : <Spinner size={13} />}
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#c0c0c0' }}>
          {allDone ? 'Selesai' : hasFailed ? 'Gagal' : 'Sedang dijana…'}
        </span>
        <span style={{ fontSize: '11px', color: '#3a3a3a', fontFamily: 'monospace' }}>#{article.id.slice(0, 8)}</span>
        <span style={{ fontSize: '11px', color: '#555', marginLeft: 'auto' }}>{pct}%</span>
        {!allDone && !hasFailed && onCancel && (
          <button
            onClick={onCancel}
            style={{
              background: 'none', border: '1px solid #2a2a2a', color: '#555',
              borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.target.style.color = '#ef4444'; e.target.style.borderColor = '#ef4444' }}
            onMouseLeave={e => { e.target.style.color = '#555'; e.target.style.borderColor = '#2a2a2a' }}
          >
            Batal
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', background: '#1a1a1a', borderRadius: '999px', marginBottom: '12px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: '999px',
          background: hasFailed ? '#ef4444' : allDone ? '#10b981' : '#d4a853',
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Agent rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {AGENTS.map(agent => {
          const row = map[agent.key]
          const status = row?.status
          return (
            <div key={agent.key} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '5px 8px', borderRadius: '6px',
              background: status === 'running' ? '#161600' : 'transparent',
            }}>
              <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {status === 'running' && <Spinner size={12} />}
                {status === 'done'    && <span style={{ color: '#10b981', fontSize: '13px' }}>✓</span>}
                {status === 'failed'  && <span style={{ color: '#ef4444', fontSize: '13px' }}>✗</span>}
                {!status              && <span style={{ color: '#2a2a2a', fontSize: '13px' }}>○</span>}
              </span>
              <span style={{
                fontSize: '12px', fontFamily: 'monospace', minWidth: '130px',
                color: status === 'running' ? '#f0c040' : status === 'done' ? '#10b981' : status === 'failed' ? '#ef4444' : '#2e2e2e',
                fontWeight: status === 'running' ? 600 : 400,
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

export default function JanaClient({ initialGenerating }) {
  const [articles,      setArticles]      = useState(initialGenerating)
  const [generatingIds, setGeneratingIds] = useState(initialGenerating.map(a => a.id))
  const [progressMap,   setProgressMap]   = useState({})
  const [isCreating,    setIsCreating]    = useState(false)

  const intervalRef      = useRef(null)
  const generatingIdsRef = useRef(generatingIds)
  useEffect(() => { generatingIdsRef.current = generatingIds }, [generatingIds])

  /* ── Polling ─────────────────────────────────────────────── */
  useEffect(() => {
    if (generatingIds.length === 0) { clearInterval(intervalRef.current); return }

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
          const m = {}
          progress.forEach(r => { if (!m[r.agent_name]) m[r.agent_name] = r })
          return AGENTS.every(a => m[a.key]?.status === 'done' || m[a.key]?.status === 'failed')
        })
        .map(r => r.id)

      if (finished.length > 0) {
        toast.success('Artikel berjaya dijana! Semak di bahagian Artikel.')
        setGeneratingIds(prev => prev.filter(id => !finished.includes(id)))
        setArticles(prev => prev.filter(a => !finished.includes(a.id)))
      }
    }

    poll()
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(poll, 3000)
    return () => clearInterval(intervalRef.current)
  }, [generatingIds])

  /* ── Generate ────────────────────────────────────────────── */
  const handleGenerate = async () => {
    setIsCreating(true)
    const tid = toast.loading('Memulakan penjanaan artikel...')
    try {
      const res = await fetch('/api/generate', { method: 'POST' })
      const { articleId, error } = await res.json()
      if (error) { toast.error(`Ralat: ${error}`, { id: tid }); return }
      toast.success('Artikel sedang dijana! (~9 minit)', { id: tid })
      const newArticle = { id: articleId, status: 'generating', title: null, slug: null, created_at: new Date().toISOString() }
      setArticles(prev => [newArticle, ...prev])
      setGeneratingIds(prev => [...prev, articleId])
    } catch {
      toast.error('Ralat semasa memulakan penjanaan.', { id: tid })
    } finally {
      setIsCreating(false)
    }
  }

  /* ── Cancel ──────────────────────────────────────────────── */
  const handleCancel = async (article) => {
    if (!window.confirm(`Batalkan penjanaan artikel #${article.id.slice(0, 8)}?`)) return
    const tid = toast.loading('Membatalkan...')
    try {
      const res = await fetch(`/api/articles/${article.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Gagal membatalkan.', { id: tid }); return }
      setArticles(prev => prev.filter(a => a.id !== article.id))
      setGeneratingIds(prev => prev.filter(id => id !== article.id))
      toast.success('Penjanaan dibatalkan.', { id: tid })
    } catch {
      toast.error('Ralat semasa membatalkan.', { id: tid })
    }
  }

  return (
    <div style={{ padding: '32px', fontFamily: "'DM Sans', sans-serif", color: '#f0f0f0' }}>
      <style>{`@keyframes jana-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700 }}>Jana Artikel</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#56514d' }}>
            Pipeline 7-ejen AI — masa jana ~9 minit setiap artikel
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isCreating}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', background: isCreating ? '#333' : '#f0f0f0',
            color: isCreating ? '#666' : '#0a0a0a', border: 'none',
            borderRadius: '8px', fontSize: '13.5px', fontWeight: 700,
            cursor: isCreating ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {isCreating ? (
            <span style={{
              display: 'inline-block', width: '13px', height: '13px',
              border: '2px solid #555', borderTopColor: '#999',
              borderRadius: '50%', animation: 'jana-spin 0.75s linear infinite',
            }} />
          ) : (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          )}
          {isCreating ? 'Memulakan…' : 'Jana Artikel Baru'}
        </button>
      </div>

      {/* How it works */}
      <div style={{
        background: '#0e0e0e', border: '1px solid #1e1e1e', borderRadius: '10px',
        padding: '16px 20px', marginBottom: '28px',
      }}>
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', marginBottom: '10px' }}>
          Pipeline AI
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {AGENTS.map((a, i) => (
            <span key={a.key} style={{
              fontSize: '11.5px', color: '#56514d', fontFamily: 'monospace',
              background: '#161412', padding: '3px 8px', borderRadius: '4px',
              border: '1px solid #1e1e1e',
            }}>
              {i + 1}. {a.key}
            </span>
          ))}
        </div>
      </div>

      {/* Live progress */}
      {articles.length === 0 ? (
        <div style={{
          padding: '48px 20px', textAlign: 'center', color: '#444', fontSize: '14px',
          background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px',
        }}>
          Tiada artikel sedang dijana. Klik "Jana Artikel Baru" untuk mula.
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', marginBottom: '10px' }}>
            Sedang Dijana — {articles.length} artikel
          </div>
          {articles.map(article => (
            <ProgressCard
              key={article.id}
              article={article}
              progress={progressMap[article.id] ?? []}
              onCancel={() => handleCancel(article)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
