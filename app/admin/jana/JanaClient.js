'use client'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmationModal from '@/components/admin/ConfirmationModal'

const AGENTS = [
  { key: 'trend-scout',     label: 'Pencari Trend',    optional: false },
  { key: 'topic-selector',  label: 'Pemilih Topik',    optional: false },
  { key: 'deep-researcher', label: 'Penyelidik',       optional: false },
  { key: 'article-writer',  label: 'Penulis Artikel',  optional: false },
  { key: 'seo-metadata',    label: 'Metadata SEO',     optional: false },
  { key: 'image-brief',     label: 'Brief Imej',       optional: false },
  { key: 'quality-checker', label: 'Penyemak Kualiti', optional: false },
  { key: 'revision-agent',  label: 'Ejen Semakan',     optional: true  },
  { key: 'save-article',    label: 'Simpan Artikel',   optional: false },
]

function Spinner({ size = 12 }) {
  return (
    <span style={{
      display: 'inline-block', width: `${size}px`, height: `${size}px`,
      border: `1.5px solid rgba(245,158,11,0.2)`, borderTopColor: '#f59e0b',
      borderRadius: '50%', animation: 'jana-spin 0.75s linear infinite', flexShrink: 0,
    }} />
  )
}

function AgentRow({ agent, row }) {
  const status = row?.status
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '5px 8px', borderRadius: '5px',
        background: status === 'running' ? 'var(--agent-active-bg)' : 'transparent',
        transition: 'background 0.25s',
      }}
    >
      {/* Status icon */}
      <span style={{ width: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <AnimatePresence mode="wait">
          {status === 'running' && (
            <motion.span key="running" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}>
              <Spinner size={11} />
            </motion.span>
          )}
          {status === 'done' && (
            <motion.span key="done" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ color: '#10b981', fontSize: '12px', lineHeight: 1 }}>✓</motion.span>
          )}
          {status === 'failed' && (
            <motion.span key="failed" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ color: '#ef4444', fontSize: '12px', lineHeight: 1 }}>✗</motion.span>
          )}
          {!status && (
            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ color: 'var(--agent-idle)', fontSize: '12px', lineHeight: 1 }}>○</motion.span>
          )}
        </AnimatePresence>
      </span>

      {/* Agent label */}
      <span style={{
        fontSize: '12.5px', minWidth: '130px',
        color: status === 'running'
          ? '#f0c040'
          : status === 'done'
          ? 'var(--t2)'
          : status === 'failed'
          ? '#ef4444'
          : 'var(--agent-idle)',
        fontWeight: status === 'running' ? 600 : 400,
        transition: 'color 0.25s',
      }}>
        {agent.label}
        {agent.optional && (
          <span style={{ fontSize: '10px', color: 'var(--t3)', marginLeft: '5px' }}>(pilihan)</span>
        )}
      </span>

      {/* Message */}
      {row?.message && (
        <span style={{
          fontSize: '11.5px', color: 'var(--t3)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {row.message}
        </span>
      )}
    </motion.div>
  )
}

function ProgressCard({ article, progress, onCancel, lm }) {
  const map = {}
  ;(progress ?? []).forEach(row => { if (!map[row.agent_name]) map[row.agent_name] = row })

  const required = AGENTS.filter(a => !a.optional)
  const requiredDone = required.filter(a => map[a.key]?.status === 'done').length
  const allRequiredDone = requiredDone === required.length
  const revisionRan = !!map['revision-agent']
  const totalExpected = revisionRan ? AGENTS.length : required.length
  const doneCount = AGENTS.filter(a => map[a.key]?.status === 'done').length
  const allDone   = allRequiredDone
  const hasFailed = AGENTS.some(a => map[a.key]?.status === 'failed')
  const pct       = Math.round((doneCount / totalExpected) * 100)

  const runningAgent = AGENTS.find(a => map[a.key]?.status === 'running')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'var(--surface)',
        border: `1px solid var(--border)`,
        borderRadius: '8px', padding: '16px 18px', marginBottom: '10px',
        boxShadow: 'var(--surface-shadow), var(--surface-inset)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <AnimatePresence mode="wait">
          {allDone ? (
            <motion.span key="done" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ color: '#10b981', fontSize: '13px', lineHeight: 1 }}>✓</motion.span>
          ) : hasFailed ? (
            <motion.span key="fail" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ color: '#ef4444', fontSize: '13px', lineHeight: 1 }}>✗</motion.span>
          ) : (
            <motion.span key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Spinner size={12} />
            </motion.span>
          )}
        </AnimatePresence>

        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>
          {allDone ? 'Selesai' : hasFailed ? 'Gagal' : 'Sedang dijana…'}
        </span>

        <span style={{
          fontSize: '10.5px', color: 'var(--t3)',
          fontFamily: 'monospace', letterSpacing: '0.03em',
        }}>
          #{article.id.slice(0, 8)}
        </span>

        <span style={{
          fontSize: '12px', fontWeight: 600, color: allDone ? '#10b981' : hasFailed ? '#ef4444' : '#d4a853',
          marginLeft: 'auto', fontVariantNumeric: 'tabular-nums',
        }}>
          {pct}%
        </span>

        {!allDone && !hasFailed && onCancel && (
          <button onClick={onCancel} style={{
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--t3)',
            borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer',
            transition: 'color 0.12s, border-color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            Batal
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: '2px', background: 'var(--divider)', borderRadius: '999px', marginBottom: '12px', overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{
            height: '100%', borderRadius: '999px',
            background: hasFailed ? '#ef4444' : allDone ? '#10b981' : '#d4a853',
          }}
        />
      </div>

      {/* Agent rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {AGENTS.map(agent => (
          <AgentRow key={agent.key} agent={agent} row={map[agent.key]} />
        ))}
      </div>
    </motion.div>
  )
}

export default function JanaClient({ initialGenerating }) {
  const [articles,      setArticles]      = useState(initialGenerating)
  const [generatingIds, setGeneratingIds] = useState(initialGenerating.map(a => a.id))
  const [progressMap,   setProgressMap]   = useState({})
  const [isCreating,    setIsCreating]    = useState(false)
  const [lm,            setLm]            = useState(false)

  const [modal,        setModal]        = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)

  const intervalRef      = useRef(null)
  const generatingIdsRef = useRef(generatingIds)
  useEffect(() => { generatingIdsRef.current = generatingIds }, [generatingIds])

  useEffect(() => {
    const saved = localStorage.getItem('admin-theme') || 'dark'
    setLm(saved === 'light')
    const handler = (e) => setLm(e.detail === 'light')
    window.addEventListener('admin-theme-change', handler)
    return () => window.removeEventListener('admin-theme-change', handler)
  }, [])

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

      const REQUIRED_AGENTS = AGENTS.filter(a => !a.optional)
      const finished = results
        .filter(({ progress }) => {
          const m = {}
          progress.forEach(r => { if (!m[r.agent_name]) m[r.agent_name] = r })
          const requiredDone = REQUIRED_AGENTS.every(a => m[a.key]?.status === 'done' || m[a.key]?.status === 'failed')
          const revisionDone = !m['revision-agent'] || m['revision-agent']?.status === 'done' || m['revision-agent']?.status === 'failed'
          return requiredDone && revisionDone
        })
        .map(r => r.id)

      if (finished.length > 0) {
        finished.forEach(id => {
          const prog = progressMap[id] ?? []
          const m = {}
          prog.forEach(r => { if (!m[r.agent_name]) m[r.agent_name] = r })
          if (m['save-article']?.status === 'done') {
            toast.success('Artikel berjaya dijana! Semak di bahagian Artikel.')
          } else {
            toast.error('Penjanaan artikel gagal. Cuba jana semula.')
          }
        })
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
  const openCancel = (article) => { setCancelTarget(article); setModal(true) }

  const confirmCancel = async () => {
    if (!cancelTarget) return
    setModal(false)
    const tid = toast.loading('Membatalkan...')
    try {
      const res = await fetch(`/api/articles/${cancelTarget.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Gagal membatalkan.', { id: tid }); return }
      setArticles(prev => prev.filter(a => a.id !== cancelTarget.id))
      setGeneratingIds(prev => prev.filter(id => id !== cancelTarget.id))
      toast.success('Penjanaan dibatalkan.', { id: tid })
    } catch {
      toast.error('Ralat semasa membatalkan.', { id: tid })
    }
  }

  const vars = lm ? `
    --bg: #f5f3f0; --surface: #ffffff; --surface2: #f0ede9;
    --border: rgba(24,21,15,0.09); --divider: rgba(24,21,15,0.06);
    --t1: #18150f; --t2: #6b6560; --t3: #a8a29e;
    --surface-shadow: 0 1px 3px rgba(24,21,15,0.07); --surface-inset: none;
    --agent-active-bg: rgba(245,158,11,0.06);
    --agent-idle: rgba(24,21,15,0.2);
    --chip-bg: rgba(24,21,15,0.06); --chip-border: rgba(24,21,15,0.1);
  ` : `
    --bg: #0c0b0a; --surface: #0f0e0d; --surface2: #131110;
    --border: rgba(237,232,223,0.07); --divider: rgba(237,232,223,0.05);
    --t1: #ede8df; --t2: #8c857c; --t3: #3d3830;
    --surface-shadow: none; --surface-inset: inset 0 1px 0 rgba(237,232,223,0.04);
    --agent-active-bg: rgba(245,158,11,0.05);
    --agent-idle: #252525;
    --chip-bg: #111; --chip-border: rgba(237,232,223,0.07);
  `

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
      className="admin-page-content"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        .admin-page-content { ${vars} }
        @keyframes jana-spin { to { transform: rotate(360deg); } }
        .jana-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 18px;
          background: rgba(212,168,83,0.1); color: #d4a853;
          border: 1px solid rgba(212,168,83,0.25);
          border-radius: 7px; font-size: 13.5px; font-weight: 700;
          cursor: pointer; white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.12s, border-color 0.12s, color 0.12s;
        }
        .jana-btn:hover:not(:disabled) {
          background: rgba(212,168,83,0.16);
          border-color: rgba(212,168,83,0.4);
        }
        .jana-btn:disabled {
          background: var(--surface2);
          color: var(--t3);
          border-color: var(--border);
          cursor: not-allowed;
        }
        .pipeline-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;
          box-shadow: var(--surface-shadow), var(--surface-inset);
        }
        .agent-chip {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11.5px; color: var(--t2);
          background: var(--chip-bg);
          padding: 4px 9px; border-radius: 5px;
          border: 1px solid var(--chip-border);
        }
        .agent-chip-num {
          font-size: 9.5px; font-weight: 700;
          color: var(--t3); font-variant-numeric: tabular-nums;
        }
        .agent-chip-optional { font-size: 9.5px; color: var(--t3); }
      `}</style>

      <ConfirmationModal
        open={modal}
        title="Batalkan Penjanaan?"
        message={`Penjanaan artikel #${cancelTarget?.id?.slice(0, 8) ?? ''} akan dibatalkan dan dipadam.`}
        confirmLabel="Ya, Batalkan" cancelLabel="Teruskan" confirmColor="red"
        onConfirm={confirmCancel} onCancel={() => setModal(false)}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.015em' }}>
            Jana Artikel
          </h1>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--t3)' }}>
            Pipeline 7-ejen AI — masa jana ~9 minit setiap artikel
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isCreating}
          className="jana-btn"
        >
          {isCreating ? (
            <span style={{
              display: 'inline-block', width: '13px', height: '13px',
              border: '1.5px solid rgba(212,168,83,0.25)', borderTopColor: '#d4a853',
              borderRadius: '50%', animation: 'jana-spin 0.75s linear infinite',
            }} />
          ) : (
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          )}
          {isCreating ? 'Memulakan…' : 'Jana Artikel Baru'}
        </button>
      </div>

      {/* Pipeline info */}
      <div className="pipeline-panel">
        <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: '12px' }}>
          Pipeline AI
        </div>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {AGENTS.map((a, i) => (
            <span key={a.key} className="agent-chip">
              <span className="agent-chip-num">{String(i + 1).padStart(2, '0')}</span>
              {a.label}
              {a.optional && <span className="agent-chip-optional">*</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Live progress */}
      <AnimatePresence mode="popLayout">
        {articles.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              padding: '48px 20px', textAlign: 'center',
              color: 'var(--t3)', fontSize: '13.5px', lineHeight: 1.8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: 'var(--surface-shadow), var(--surface-inset)',
            }}
          >
            Tiada artikel sedang dijana.
            <br />
            Klik <span style={{ color: '#d4a853' }}>"Jana Artikel Baru"</span> untuk mula.
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: '10px' }}>
              Sedang Dijana — {articles.length} artikel
            </div>
            <AnimatePresence>
              {articles.map(article => (
                <ProgressCard
                  key={article.id}
                  article={article}
                  progress={progressMap[article.id] ?? []}
                  onCancel={() => openCancel(article)}
                  lm={lm}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
