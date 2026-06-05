'use client'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmationModal from '@/components/admin/ConfirmationModal'

/* ── Agent definitions ─────────────────────────────────────── */
const SEARCH_AGENTS = [
  { key: 'trend-scout',    label: 'Pencari Trend',   optional: false },
  { key: 'topic-selector', label: 'Pemilih Topik',   optional: false },
]
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

/* ── Helpers ───────────────────────────────────────────────── */
function Spinner({ size = 12 }) {
  return (
    <span style={{
      display: 'inline-block', width: `${size}px`, height: `${size}px`,
      border: '1.5px solid rgba(212,168,83,0.2)', borderTopColor: '#d4a853',
      borderRadius: '50%', animation: 'jana-spin 0.75s linear infinite', flexShrink: 0,
    }} />
  )
}

function AgentRow({ agent, row }) {
  const s = row?.status
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '4px 8px', borderRadius: '5px',
      background: s === 'running' ? 'var(--agent-active-bg)' : 'transparent',
    }}>
      <span style={{ width: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {s === 'running' ? <Spinner size={11} /> :
         s === 'done'    ? <span style={{ color: '#10b981', fontSize: '12px' }}>✓</span> :
         s === 'failed'  ? <span style={{ color: '#ef4444', fontSize: '12px' }}>✗</span> :
                           <span style={{ color: 'var(--agent-idle)', fontSize: '12px' }}>○</span>}
      </span>
      <span style={{
        fontSize: '12.5px', minWidth: '130px',
        color: s === 'running' ? '#f0c040' : s === 'done' ? 'var(--t2)' : s === 'failed' ? '#ef4444' : 'var(--agent-idle)',
        fontWeight: s === 'running' ? 600 : 400,
      }}>
        {agent.label}{agent.optional && <span style={{ fontSize: '10px', color: 'var(--t3)', marginLeft: '5px' }}>(pilihan)</span>}
      </span>
      {row?.message && (
        <span style={{ fontSize: '11.5px', color: 'var(--t3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.message}
        </span>
      )}
    </div>
  )
}

/* ── Topic selection card ──────────────────────────────────── */
function TopicCard({ option, onSelect, selecting }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${hovered ? 'rgba(212,168,83,0.3)' : 'var(--border)'}`,
        borderRadius: '8px', padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
        flex: '1 1 0', minWidth: '240px',
      }}
    >
      <span style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: '3px',
        background: 'rgba(212,168,83,0.1)', color: '#d4a853',
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        alignSelf: 'flex-start',
      }}>
        {option.category}
      </span>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--t1)', lineHeight: 1.3 }}>
        {option.topic}
      </div>
      <div style={{ fontSize: '12.5px', color: 'var(--t2)', lineHeight: 1.5, flex: 1 }}>
        {option.summary}
      </div>
      {option.sourceName && (
        <a
          href={option.sourceUrl || '#'}
          target={option.sourceUrl ? '_blank' : undefined}
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            fontSize: '11px', color: 'var(--t3)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '4px',
            transition: 'color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#d4a853' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)' }}
        >
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          {option.sourceName}
        </a>
      )}
      <button
        onClick={() => onSelect(option)}
        disabled={selecting}
        style={{
          marginTop: '2px', padding: '8px 0', borderRadius: '6px', border: 'none',
          background: selecting ? 'rgba(212,168,83,0.2)' : '#d4a853',
          color: selecting ? '#8c6a2a' : '#0c0b0a',
          fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 700,
          cursor: selecting ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          transition: 'background 0.12s',
        }}
      >
        {selecting ? <><Spinner size={12} /> Memulakan…</> : 'Pilih Topik Ini'}
      </button>
    </motion.div>
  )
}

/* ── Main component ────────────────────────────────────────── */
export default function JanaClient({ initialArticles = [] }) {
  const [articles,       setArticles]       = useState(initialArticles)
  const [generatingIds,  setGeneratingIds]  = useState(initialArticles.map(a => a.id))
  const [progressMap,    setProgressMap]    = useState({})
  const [topicOptionsMap,setTopicOptionsMap]= useState(
    Object.fromEntries(initialArticles.filter(a => a.topic_options).map(a => [a.id, a.topic_options]))
  )
  const [statusMap,      setStatusMap]      = useState(
    Object.fromEntries(initialArticles.map(a => [a.id, a.status]))
  )
  const [isSearching,    setIsSearching]    = useState(false)
  const [selectingId,    setSelectingId]    = useState(null) // which article is having topic picked
  const [lm,             setLm]            = useState(false)
  const [modal,          setModal]          = useState(false)
  const [cancelTarget,   setCancelTarget]   = useState(null)
  const [topicDirection, setTopicDirection] = useState('')
  const [showStep1,      setShowStep1]      = useState(false)

  const intervalRef      = useRef(null)
  const generatingIdsRef = useRef(generatingIds)
  useEffect(() => { generatingIdsRef.current = generatingIds }, [generatingIds])

  useEffect(() => {
    const saved = localStorage.getItem('admin-theme') || 'dark'
    setLm(saved === 'light')
    const h = (e) => setLm(e.detail === 'light')
    window.addEventListener('admin-theme-change', h)
    return () => window.removeEventListener('admin-theme-change', h)
  }, [])

  /* ── Polling ── */
  useEffect(() => {
    if (generatingIds.length === 0) { clearInterval(intervalRef.current); return }

    const poll = async () => {
      const ids = generatingIdsRef.current
      if (!ids.length) return

      const results = await Promise.all(
        ids.map(id =>
          fetch(`/api/progress?articleId=${id}`)
            .then(r => r.json())
            .then(d => ({ id, progress: d.progress ?? [], articleStatus: d.articleStatus, topicOptions: d.topicOptions }))
            .catch(() => ({ id, progress: [], articleStatus: null, topicOptions: null }))
        )
      )

      // Update maps
      setProgressMap(prev => {
        const next = { ...prev }
        results.forEach(({ id, progress }) => { next[id] = progress })
        return next
      })
      setTopicOptionsMap(prev => {
        const next = { ...prev }
        results.forEach(({ id, topicOptions }) => { if (topicOptions) next[id] = topicOptions })
        return next
      })
      setStatusMap(prev => {
        const next = { ...prev }
        results.forEach(({ id, articleStatus }) => { if (articleStatus) next[id] = articleStatus })
        return next
      })

      // Check completion for 'generating' articles
      const REQUIRED = AGENTS.filter(a => !a.optional)
      const finished = results.filter(({ id, progress, articleStatus }) => {
        if (statusMap[id] === 'awaiting_topic_selection') return false // never auto-complete
        const m = {}
        progress.forEach(r => { if (!m[r.agent_name]) m[r.agent_name] = r })
        const reqDone = REQUIRED.every(a => m[a.key]?.status === 'done' || m[a.key]?.status === 'failed')
        const revDone = !m['revision-agent'] || ['done','failed'].includes(m['revision-agent']?.status)
        return reqDone && revDone
      }).map(r => r.id)

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

  /* ── Search Topics ── */
  const handleSearchTopics = async () => {
    setIsSearching(true)
    const tid = toast.loading('Mencari topik trending…')
    try {
      const res = await fetch('/api/generate-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicDirection: topicDirection.trim() || null }),
      })
      const { articleId, error } = await res.json()
      if (error) { toast.error(`Ralat: ${error}`, { id: tid }); return }
      toast.success('Mencari topik… tunggu sebentar.', { id: tid })
      const newArticle = { id: articleId, status: 'awaiting_topic_selection', title: null, created_at: new Date().toISOString() }
      setArticles(prev => [newArticle, ...prev])
      setGeneratingIds(prev => [...prev, articleId])
      setStatusMap(prev => ({ ...prev, [articleId]: 'awaiting_topic_selection' }))
      setShowStep1(false)
      setTopicDirection('')
    } catch {
      toast.error('Ralat semasa mencari topik.', { id: tid })
    } finally {
      setIsSearching(false)
    }
  }

  /* ── Select Topic ── */
  const handleSelectTopic = async (articleId, option) => {
    setSelectingId(articleId)
    const tid = toast.loading('Memulakan penjanaan artikel…')
    try {
      const res = await fetch('/api/select-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, option }),
      })
      if (!res.ok) { toast.error('Gagal memilih topik.', { id: tid }); return }
      toast.success('Topik dipilih! Menjana artikel… (~9 minit)', { id: tid })
      setStatusMap(prev => ({ ...prev, [articleId]: 'generating' }))
      setArticles(prev => prev.map(a => a.id === articleId ? { ...a, status: 'generating' } : a))
    } catch {
      toast.error('Ralat semasa memilih topik.', { id: tid })
    } finally {
      setSelectingId(null)
    }
  }

  /* ── Cancel ── */
  const openCancel = (article) => { setCancelTarget(article); setModal(true) }
  const confirmCancel = async () => {
    if (!cancelTarget) return
    setModal(false)
    const tid = toast.loading('Membatalkan…')
    try {
      const isAwaiting = statusMap[cancelTarget.id] === 'awaiting_topic_selection'
      let res
      if (isAwaiting) {
        res = await fetch('/api/cancel-topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId: cancelTarget.id }),
        })
      } else {
        res = await fetch(`/api/articles/${cancelTarget.id}`, { method: 'DELETE' })
      }
      if (!res.ok) { toast.error('Gagal membatalkan.', { id: tid }); return }
      setArticles(prev => prev.filter(a => a.id !== cancelTarget.id))
      setGeneratingIds(prev => prev.filter(id => id !== cancelTarget.id))
      toast.success('Dibatalkan.', { id: tid })
    } catch { toast.error('Ralat semasa membatalkan.', { id: tid }) }
  }

  /* ── Theme vars ── */
  const vars = lm ? `
    --bg: #f8f8f8; --surface: #ffffff; --surface2: #f1f1f1;
    --border: #e5e7eb; --divider: #f0f0f0;
    --t1: #0d1117; --t2: #1f2937; --t3: #4b5563;
    --surface-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px #e5e7eb; --surface-inset: none;
    --agent-active-bg: rgba(245,158,11,0.06); --agent-idle: #9ca3af;
    --chip-bg: rgba(0,0,0,0.04); --chip-border: #e5e7eb;
  ` : `
    --bg: #0c0b0a; --surface: #0f0e0d; --surface2: #131110;
    --border: rgba(237,232,223,0.07); --divider: rgba(237,232,223,0.05);
    --t1: #ede8df; --t2: #8c857c; --t3: #3d3830;
    --surface-shadow: none; --surface-inset: inset 0 1px 0 rgba(237,232,223,0.04);
    --agent-active-bg: rgba(245,158,11,0.05); --agent-idle: #252525;
    --chip-bg: #111; --chip-border: rgba(237,232,223,0.07);
  `

  /* ── Partition articles ── */
  const awaitingArticles  = articles.filter(a => statusMap[a.id] === 'awaiting_topic_selection')
  const generatingArticles = articles.filter(a => statusMap[a.id] === 'generating' || statusMap[a.id] === 'failed')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }}
      className="admin-page-content" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .admin-page-content { ${vars} }
        @keyframes jana-spin { to { transform: rotate(360deg); } }
        .topic-dir-input {
          width: 100%; padding: 10px 14px; border-radius: 6px;
          background: var(--surface); border: 1px solid var(--border);
          color: var(--t1); font-family: 'DM Sans', sans-serif; font-size: 13.5px;
          outline: none; transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .topic-dir-input:focus { border-color: rgba(212,168,83,0.4); }
        .topic-dir-input::placeholder { color: var(--t3); }
        .search-btn {
          padding: 10px 20px; border-radius: 6px; border: none;
          background: rgba(212,168,83,0.1); color: #d4a853;
          border: 1px solid rgba(212,168,83,0.25);
          font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 700;
          cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center; gap: 7px;
          transition: background 0.12s, border-color 0.12s;
        }
        .search-btn:hover:not(:disabled) { background: rgba(212,168,83,0.16); border-color: rgba(212,168,83,0.4); }
        .search-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .panel {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 8px; padding: 16px 18px; margin-bottom: 16px;
          box-shadow: var(--surface-shadow), var(--surface-inset);
        }
        .section-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase;
          color: var(--t3); margin-bottom: 10px;
        }
      `}</style>

      <ConfirmationModal
        open={modal}
        title="Batalkan?"
        message={`Proses ini akan dibatalkan dan dipadam.`}
        confirmLabel="Ya, Batalkan" cancelLabel="Teruskan" confirmColor="red"
        onConfirm={confirmCancel} onCancel={() => setModal(false)}
      />

      {/* ── Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.015em' }}>
          Jana Artikel
        </h1>
        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--t3)' }}>
          Cari topik trending, pilih yang terbaik, kemudian jana artikel penuh secara automatik
        </p>
      </div>

      {/* ── Entry point: Jana Artikel Baru button OR Step 1 panel ── */}
      {!showStep1 ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <button onClick={() => setShowStep1(true)} className="search-btn">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Jana Artikel Baru
          </button>
        </div>
      ) : (
        <div className="panel" style={{ marginBottom: '24px' }}>
          <div className="section-label">Langkah 1 — Cari Topik</div>
          <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--t3)' }}>
            Masukkan hala tuju topik (pilihan), kemudian klik Cari Topik.
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="topic-dir-input"
              style={{ flex: '1 1 200px' }}
              type="text"
              placeholder="e.g. Malaysian AI policy, new language models, AI in healthcare..."
              value={topicDirection}
              onChange={e => setTopicDirection(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !isSearching) handleSearchTopics() }}
              disabled={isSearching}
              autoFocus
            />
            <button onClick={handleSearchTopics} disabled={isSearching} className="search-btn" style={{ flexShrink: 0 }}>
              {isSearching ? <><Spinner size={13} /> Memulakan…</> : (
                <>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  Cari Topik
                </>
              )}
            </button>
            <button onClick={() => setShowStep1(false)} disabled={isSearching} style={{
              background: 'none', border: '1px solid var(--border)', color: 'var(--t3)',
              borderRadius: '6px', padding: '10px 14px', fontSize: '13px', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
            }}>
              Batal
            </button>
          </div>
          <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--t3)' }}>
            Biarkan kosong untuk biarkan AI memilih topik trending terkini.
          </div>
        </div>
      )}

      {/* ── Awaiting topic selection ── */}
      <AnimatePresence>
        {awaitingArticles.map(article => {
          const opts = topicOptionsMap[article.id]
          const prog = progressMap[article.id] ?? []
          const progMap = {}
          prog.forEach(r => { if (!progMap[r.agent_name]) progMap[r.agent_name] = r })
          const hasOptions = opts && opts.length > 0

          return (
            <motion.div key={article.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              style={{ marginBottom: '20px' }}>

              {hasOptions ? (
                // Step 2: Show topic cards
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#d4a853', marginBottom: '2px' }}>
                        Langkah 2 — Pilih Topik
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--t1)', fontWeight: 600 }}>
                        Pilih satu topik untuk diteruskan
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {/* Auto-select the top-ranked option */}
                      <button
                        onClick={() => handleSelectTopic(article.id, opts[0])}
                        disabled={selectingId === article.id}
                        style={{
                          background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.25)',
                          color: '#d4a853', borderRadius: '4px', padding: '4px 12px',
                          fontSize: '11.5px', fontWeight: 600, cursor: selectingId === article.id ? 'not-allowed' : 'pointer',
                          fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '5px',
                          opacity: selectingId === article.id ? 0.5 : 1,
                          transition: 'background 0.12s',
                        }}
                        title="Jana artikel menggunakan topik pertama secara automatik"
                      >
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        Jana Automatik
                      </button>
                      <button onClick={() => openCancel(article)} style={{
                        background: 'none', border: '1px solid var(--border)', color: 'var(--t3)',
                        borderRadius: '4px', padding: '4px 10px', fontSize: '11.5px', cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        Batal
                      </button>
                    </div>{/* end button group */}
                  </div>{/* end header row */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {opts.map((opt, i) => (
                      <TopicCard key={i} option={opt}
                        onSelect={(o) => handleSelectTopic(article.id, o)}
                        selecting={selectingId === article.id}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                // Still searching: show mini progress card
                <div className="panel">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Spinner size={12} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>Mencari topik trending…</span>
                    <span style={{ marginLeft: 'auto', fontSize: '10.5px', color: 'var(--t3)', fontFamily: 'monospace' }}>
                      #{article.id.slice(0, 8)}
                    </span>
                    <button onClick={() => openCancel(article)} style={{
                      background: 'none', border: '1px solid var(--border)', color: 'var(--t3)',
                      borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>Batal</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    {SEARCH_AGENTS.map(a => <AgentRow key={a.key} agent={a} row={progMap[a.key]} />)}
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* ── Generating articles (full progress cards) ── */}
      <AnimatePresence>
        {generatingArticles.map(article => {
          const prog = progressMap[article.id] ?? []
          const map = {}
          prog.forEach(r => { if (!map[r.agent_name]) map[r.agent_name] = r })
          const REQUIRED = AGENTS.filter(a => !a.optional)
          const reqDone = REQUIRED.filter(a => map[a.key]?.status === 'done').length
          const revRan  = !!map['revision-agent']
          const total   = revRan ? AGENTS.length : REQUIRED.length
          const done    = AGENTS.filter(a => map[a.key]?.status === 'done').length
          const allDone = reqDone === REQUIRED.length
          const failed  = AGENTS.some(a => map[a.key]?.status === 'failed')
          const pct     = Math.round((done / total) * 100)

          return (
            <motion.div key={article.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}
              className="panel" style={{ marginBottom: '10px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {allDone ? <span style={{ color: '#10b981', fontSize: '13px' }}>✓</span> :
                 failed  ? <span style={{ color: '#ef4444', fontSize: '13px' }}>✗</span> :
                           <Spinner size={12} />}
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>
                  {allDone ? 'Selesai' : failed ? 'Gagal' : 'Sedang dijana…'}
                </span>
                <span style={{ fontSize: '10.5px', color: 'var(--t3)', fontFamily: 'monospace' }}>
                  #{article.id.slice(0, 8)}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: allDone ? '#10b981' : failed ? '#ef4444' : '#d4a853', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                  {pct}%
                </span>
                {!allDone && !failed && (
                  <button onClick={() => openCancel(article)} style={{
                    background: 'none', border: '1px solid var(--border)', color: 'var(--t3)',
                    borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'color 0.12s, border-color 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  >Batal</button>
                )}
              </div>
              {/* Progress bar */}
              <div style={{ height: '2px', background: 'var(--divider)', borderRadius: '999px', marginBottom: '12px', overflow: 'hidden' }}>
                <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.45, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: '999px', background: failed ? '#ef4444' : allDone ? '#10b981' : '#d4a853' }} />
              </div>
              {/* Agent rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {AGENTS.map(a => <AgentRow key={a.key} agent={a} row={map[a.key]} />)}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* ── Empty state ── */}
      {articles.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="panel" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--t3)', fontSize: '13.5px', lineHeight: 1.8 }}>
          Tiada artikel sedang diproses.<br/>
          Klik <span style={{ color: '#d4a853' }}>"Jana Artikel Baru"</span> untuk bermula.
        </motion.div>
      )}
    </motion.div>
  )
}
