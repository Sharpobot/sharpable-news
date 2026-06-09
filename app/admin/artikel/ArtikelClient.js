'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmationModal from '@/components/admin/ConfirmationModal'

/* ── Status config ─────────────────────────────────────────── */
const STATUS_CFG = {
  awaiting_topic_selection: { label: 'Select Topic',     color: '#2563eb', bg: 'rgba(59,130,246,0.10)',  dot: '#3b82f6' },
  generating:               { label: 'Generating',       color: '#d97706', bg: 'rgba(245,158,11,0.10)',  dot: '#f59e0b' },
  ready_to_review:          { label: 'Ready to Review',  color: '#2563eb', bg: 'rgba(59,130,246,0.10)',  dot: '#3b82f6' },
  draft:                    { label: 'Draft',            color: null,      bg: null,                     dot: null      },
  published:                { label: 'Published',        color: '#059669', bg: 'rgba(16,185,129,0.10)',  dot: '#10b981' },
  failed:                   { label: 'Failed',           color: '#dc2626', bg: 'rgba(239,68,68,0.10)',   dot: '#ef4444' },
}

// Statuses where the dropdown is available
const DROPDOWN_OPTIONS = [
  { value: 'published',       label: 'Published' },
  { value: 'ready_to_review', label: 'Ready to Review' },
  { value: 'draft',           label: 'Draft' },
]
// Read-only statuses — no dropdown, no editor link
const READ_ONLY_STATUS = new Set(['generating', 'failed', 'awaiting_topic_selection'])
// Editable statuses — show editor link
const EDITABLE = new Set(['ready_to_review', 'draft', 'published'])

/* ── Date formatter ─────────────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmt(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/* ── Grid layout — 6 columns matching header & rows exactly ── */
// checkbox(40px) | title(1fr) | status(165px) | views(62px) | date(110px) | action(36px)
const COLS = '40px 1fr 165px 62px 110px 36px'

export default function ArtikelClient({ initialArticles }) {
  const [articles, setArticles]       = useState(initialArticles)
  const [lm, setLm]                   = useState(false)
  const [modal, setModal]             = useState(null)   // 'delete' | 'cancel' | 'bulk-delete' | null
  const [targetArticle, setTarget]    = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [openDropdown, setOpenDropdown] = useState(null) // article id whose dropdown is open

  /* ── Theme sync ─── */
  useEffect(() => {
    const saved = localStorage.getItem('admin-theme') || 'dark'
    setLm(saved === 'light')
    const handler = (e) => setLm(e.detail === 'light')
    window.addEventListener('admin-theme-change', handler)
    return () => window.removeEventListener('admin-theme-change', handler)
  }, [])

  /* ── Close dropdown on outside click ─── */
  useEffect(() => {
    if (!openDropdown) return
    const handler = (e) => {
      if (!e.target.closest('.status-dd-wrap')) setOpenDropdown(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openDropdown])

  /* ── Selection helpers ─── */
  const selectionActive = selectedIds.size > 0
  const isAllSelected   = articles.length > 0 && articles.every(a => selectedIds.has(a.id))
  const toggleSelect    = (id) => setSelectedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const toggleSelectAll = () =>
    isAllSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(articles.map(a => a.id)))
  const exitSelection   = () => setSelectedIds(new Set())

  /* ── Status update (single row dropdown) ─── */
  const updateStatus = async (articleId, newStatus) => {
    setOpenDropdown(null)
    const originalStatus = articles.find(a => a.id === articleId)?.status
    // Optimistic
    setArticles(list => list.map(a => a.id === articleId ? { ...a, status: newStatus } : a))
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Status dikemas kini kepada "${STATUS_CFG[newStatus]?.label ?? newStatus}".`)
    } catch {
      // Revert
      setArticles(list => list.map(a => a.id === articleId ? { ...a, status: originalStatus } : a))
      toast.error('Gagal mengemas kini status.')
    }
  }

  /* ── Single delete / cancel ─── */
  const openDelete = (article) => { setTarget(article); setModal('delete') }
  const openCancel = (article) => { setTarget(article); setModal('cancel') }

  const handleDelete = async () => {
    if (!targetArticle) return
    setModal(null)
    const label = targetArticle.title ?? `artikel ${targetArticle.id.slice(0, 8)}`
    const tid = toast.loading('Memadam artikel...')
    try {
      const res = await fetch(`/api/articles/${targetArticle.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Gagal memadam artikel.', { id: tid }); return }
      setArticles(prev => prev.filter(a => a.id !== targetArticle.id))
      toast.success(`"${label}" dipadam.`, { id: tid })
    } catch {
      toast.error('Ralat semasa memadam.', { id: tid })
    }
  }

  const handleCancel = async () => {
    if (!targetArticle) return
    setModal(null)
    const tid = toast.loading('Membatalkan...')
    try {
      const res = await fetch(`/api/articles/${targetArticle.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Gagal membatalkan.', { id: tid }); return }
      setArticles(prev => prev.filter(a => a.id !== targetArticle.id))
      toast.success('Penjanaan dibatalkan.', { id: tid })
    } catch {
      toast.error('Ralat semasa membatalkan.', { id: tid })
    }
  }

  /* ── Bulk delete ─── */
  const handleBulkDelete = async () => {
    setModal(null)
    const ids = [...selectedIds]
    const tid = toast.loading(`Memadam ${ids.length} artikel...`)
    const results = await Promise.allSettled(
      ids.map(id => fetch(`/api/articles/${id}`, { method: 'DELETE' }))
    )
    const succeeded = ids.filter((_, i) =>
      results[i].status === 'fulfilled' && results[i].value?.ok
    )
    const failCount = ids.length - succeeded.length
    const succeededSet = new Set(succeeded)
    setArticles(prev => prev.filter(a => !succeededSet.has(a.id)))
    exitSelection()
    failCount > 0
      ? toast.error(`${succeeded.length} dipadam, ${failCount} gagal.`, { id: tid })
      : toast.success(`${succeeded.length} artikel dipadam.`, { id: tid })
  }

  /* ── Bulk status change ─── */
  const handleBulkStatus = async (newStatus) => {
    const ids = [...selectedIds]
    const label = STATUS_CFG[newStatus]?.label ?? newStatus
    const tid = toast.loading(`Mengemas kini ${ids.length} artikel...`)
    const results = await Promise.allSettled(
      ids.map(id => fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }))
    )
    const succeeded = ids.filter((_, i) =>
      results[i].status === 'fulfilled' && results[i].value?.ok
    )
    const failCount = ids.length - succeeded.length
    const succeededSet = new Set(succeeded)
    setArticles(prev => prev.map(a => succeededSet.has(a.id) ? { ...a, status: newStatus } : a))
    exitSelection()
    failCount > 0
      ? toast.error(`${succeeded.length} dikemas kini, ${failCount} gagal.`, { id: tid })
      : toast.success(`${succeeded.length} artikel ditetapkan sebagai "${label}".`, { id: tid })
  }

  /* ── CSS vars (theme) ─── */
  const vars = lm ? `
    --bg:#f8f8f8; --surface:#ffffff; --surface2:#f1f1f1;
    --border:#e5e7eb; --divider:#f0f0f0;
    --t1:#0d1117; --t2:#1f2937; --t3:#4b5563;
    --surface-shadow:0 1px 4px rgba(0,0,0,0.06),0 0 0 1px #e5e7eb; --surface-inset:none;
    --row-hover:rgba(0,0,0,0.02); --sel-row:rgba(212,168,83,0.07);
    --del-idle:#9ca3af; --del-hover:#ef4444;
    --badge-bg:rgba(0,0,0,0.05);
    --jana-bg:rgba(212,168,83,0.1); --jana-border:rgba(212,168,83,0.28);
    --dd-bg:#ffffff; --dd-border:#e5e7eb; --dd-hover:#f3f4f6; --dd-shadow:0 4px 16px rgba(0,0,0,0.12);
    --banner-bg:#ffffff; --banner-border:#e5e7eb; --banner-shadow:0 -4px 24px rgba(0,0,0,0.10);
    --cb-accent:#d4a853;
  ` : `
    --bg:#0c0b0a; --surface:#0f0e0d; --surface2:#131110;
    --border:rgba(237,232,223,0.07); --divider:rgba(237,232,223,0.05);
    --t1:#ede8df; --t2:#8c857c; --t3:#3d3830;
    --surface-shadow:none; --surface-inset:inset 0 1px 0 rgba(237,232,223,0.04);
    --row-hover:rgba(237,232,223,0.02); --sel-row:rgba(212,168,83,0.055);
    --del-idle:#2a2a2a; --del-hover:#ef4444;
    --badge-bg:rgba(237,232,223,0.07);
    --jana-bg:rgba(212,168,83,0.08); --jana-border:rgba(212,168,83,0.22);
    --dd-bg:#1c1a18; --dd-border:rgba(237,232,223,0.1); --dd-hover:rgba(237,232,223,0.05); --dd-shadow:0 4px 20px rgba(0,0,0,0.35);
    --banner-bg:#141210; --banner-border:rgba(237,232,223,0.09); --banner-shadow:0 -4px 24px rgba(0,0,0,0.4);
    --cb-accent:#d4a853;
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

        /* ── Table shell ── */
        .at-table {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px; overflow: visible;
          box-shadow: var(--surface-shadow), var(--surface-inset);
          width: 100%;
        }

        /* ── Shared grid — header and rows use identical columns ── */
        .at-header, .at-row {
          display: grid;
          grid-template-columns: ${COLS};
          align-items: center;
        }
        .at-header {
          padding: 9px 20px;
          border-bottom: 1px solid var(--border);
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.13em; text-transform: uppercase;
          color: var(--t3);
          border-radius: 8px 8px 0 0;
        }
        .at-row {
          padding: 13px 20px;
          border-bottom: 1px solid var(--divider);
          transition: background 0.1s;
          position: relative;
        }
        .at-row:last-child { border-bottom: none; border-radius: 0 0 8px 8px; }
        .at-row:hover { background: var(--row-hover); }
        .at-row.at-selected { background: var(--sel-row) !important; }

        /* ── Checkbox column ── */
        .at-cb {
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.13s;
        }
        /* Show on row hover, when row is selected, or when any selection is active */
        .at-row:hover .at-cb,
        .at-row.at-selected .at-cb,
        .at-table.sel-active .at-cb { opacity: 1; }
        /* Header checkbox always visible (content conditionally rendered) */
        .at-header .at-cb { opacity: 1; }

        .cb-box {
          width: 15px; height: 15px; cursor: pointer;
          accent-color: var(--cb-accent); flex-shrink: 0;
        }

        /* ── Title cell ── */
        .at-title-cell { min-width: 0; overflow: hidden; }
        .article-title-link {
          color: #d4a853; text-decoration: none;
          font-size: 13.5px; font-weight: 500; line-height: 1.4;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          display: block; max-width: 100%;
          transition: color 0.1s;
        }
        .article-title-link:hover { color: #e8c86c; }
        .at-title-plain {
          font-size: 13.5px; font-weight: 500;
          color: var(--t1); line-height: 1.4;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 100%; display: block;
        }
        .at-slug {
          font-size: 10.5px; color: var(--t3);
          margin-top: 2px; line-height: 1.3;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* ── Status dropdown ── */
        .status-dd-wrap {
          position: relative; display: inline-flex; align-items: center;
        }
        .status-dd-trigger {
          background: none; border: none; padding: 0;
          display: inline-flex; align-items: center; gap: 4px;
          cursor: pointer; transition: opacity 0.12s;
        }
        .status-dd-trigger:not(.ro):hover { opacity: 0.78; }
        .status-dd-trigger.ro { cursor: default; pointer-events: none; }

        .status-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 999px;
          font-size: 11.5px; font-weight: 600;
          letter-spacing: 0.02em; white-space: nowrap;
        }
        .status-pill-dot {
          width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
        }
        .dd-caret {
          color: var(--t3); display: inline-flex; align-items: center;
          transition: transform 0.15s;
        }
        .dd-caret.open { transform: rotate(180deg); }

        .status-dd-menu {
          position: absolute; top: calc(100% + 6px); left: 0;
          background: var(--dd-bg);
          border: 1px solid var(--dd-border);
          border-radius: 8px; overflow: hidden;
          box-shadow: var(--dd-shadow);
          z-index: 500; min-width: 170px;
        }
        .dd-item {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 13px; cursor: pointer;
          font-size: 12.5px; font-weight: 500; color: var(--t1);
          transition: background 0.1s; white-space: nowrap;
        }
        .dd-item:hover { background: var(--dd-hover); }
        .dd-item.dd-active { color: #d4a853; }
        .dd-item-dot {
          width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
        }

        /* ── Date / views cells ── */
        .at-num {
          font-size: 11.5px; color: var(--t3);
          font-variant-numeric: tabular-nums;
        }

        /* ── Delete / cancel button ── */
        .del-btn {
          background: none; border: none; cursor: pointer;
          color: var(--del-idle); padding: 5px; border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          transition: color 0.12s; margin-left: auto;
        }
        .del-btn:hover { color: var(--del-hover); }

        /* ── Generate button ── */
        .jana-link-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 16px;
          background: var(--jana-bg); color: #d4a853;
          border: 1px solid var(--jana-border);
          border-radius: 7px; font-size: 13px; font-weight: 600;
          text-decoration: none; white-space: nowrap;
          transition: background 0.12s, border-color 0.12s;
        }
        .jana-link-btn:hover {
          background: rgba(212,168,83,0.16);
          border-color: rgba(212,168,83,0.4);
        }

        /* ── Bulk action banner ── */
        @keyframes banner-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        /* Positioning is applied inline on the motion.div — only button styles here */
        .bulk-btn {
          padding: 7px 16px; border-radius: 6px;
          font-size: 12.5px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; border: 1px solid;
          transition: background 0.12s, border-color 0.12s, color 0.12s;
          white-space: nowrap; line-height: 1;
        }
        .bulk-cancel {
          background: none; border: 1px solid var(--banner-border); color: var(--t2);
        }
        .bulk-cancel:hover { border-color: var(--t2); color: var(--t1); }
        .bulk-delete {
          background: rgba(239,68,68,0.10); color: #ef4444;
          border-color: rgba(239,68,68,0.25);
        }
        .bulk-delete:hover { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.4); }
        .bulk-draft {
          background: var(--badge-bg); color: var(--t2); border-color: var(--border);
        }
        .bulk-draft:hover { background: var(--row-hover); border-color: var(--border); }
        .bulk-publish {
          background: rgba(16,185,129,0.10); color: #10b981;
          border-color: rgba(16,185,129,0.25);
        }
        .bulk-publish:hover { background: rgba(16,185,129,0.18); border-color: rgba(16,185,129,0.4); }

        /* Responsive — matches settings banner breakpoints exactly */
        @media (max-width: 640px) {
          .bulk-banner { left: 0 !important; top: 51px !important; }
          .bulk-btn { padding: 6px 12px; font-size: 12px; }
        }
        @media (min-width: 641px) {
          .bulk-banner { left: 220px !important; }
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .at-header { display: none; }
          .at-row {
            grid-template-columns: 32px 1fr auto;
            grid-template-rows: auto auto;
            padding: 13px 16px; gap: 4px 10px;
          }
          .at-cb    { grid-column: 1; grid-row: 1 / span 2; opacity: 0; }
          .at-table.sel-active .at-row .at-cb { opacity: 1; }
          .at-row.at-selected .at-cb           { opacity: 1; }
          .at-title-cell  { grid-column: 2; grid-row: 1; }
          .at-status-cell { grid-column: 2; grid-row: 2; }
          .at-action-cell { grid-column: 3; grid-row: 1 / span 2; display: flex; align-items: center; }
          .at-views-cell, .at-date-cell { display: none; }
        }
      `}</style>

      {/* ── Modals ── */}
      <ConfirmationModal
        open={modal === 'delete'}
        title="Delete Article?"
        message={`Article "${targetArticle?.title ?? targetArticle?.id?.slice(0, 8) ?? ''}" will be permanently deleted.`}
        confirmLabel="Yes, Delete" cancelLabel="Cancel" confirmColor="red"
        onConfirm={handleDelete} onCancel={() => setModal(null)}
      />
      <ConfirmationModal
        open={modal === 'cancel'}
        title="Cancel Generation?"
        message={`Generation of article #${targetArticle?.id?.slice(0, 8) ?? ''} will be cancelled and deleted.`}
        confirmLabel="Yes, Cancel" cancelLabel="Cancel" confirmColor="red"
        onConfirm={handleCancel} onCancel={() => setModal(null)}
      />
      <ConfirmationModal
        open={modal === 'bulk-delete'}
        title="Delete Articles?"
        message={`Are you sure you want to permanently delete ${selectedIds.size} selected ${selectedIds.size === 1 ? 'article' : 'articles'}? This cannot be undone.`}
        confirmLabel="Yes, Delete" cancelLabel="Cancel" confirmColor="red"
        onConfirm={handleBulkDelete} onCancel={() => setModal(null)}
      />

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.015em' }}>
            All Articles
          </h1>
          <span style={{ fontSize: '11.5px', color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>
            {articles.length} articles
          </span>
        </div>
        <Link href="/admin/jana" className="jana-link-btn">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          Generate Article
        </Link>
      </div>

      {/* ── Table ── */}
      <div className={`at-table${selectionActive ? ' sel-active' : ''}`}>

        {/* Header row */}
        <div className="at-header">
          {/* Col 1 — select-all checkbox (only visible when selection is active) */}
          <div className="at-cb">
            {selectionActive && (
              <input
                type="checkbox"
                className="cb-box"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                title={isAllSelected ? 'Deselect all' : 'Select all'}
              />
            )}
          </div>
          {/* Col 2 */}
          <span>Title</span>
          {/* Col 3 */}
          <span>Status</span>
          {/* Col 4 */}
          <span style={{ textAlign: 'right' }}>Views</span>
          {/* Col 5 */}
          <span>Date</span>
          {/* Col 6 */}
          <span />
        </div>

        {articles.length === 0 ? (
          <div style={{ padding: '52px 20px', textAlign: 'center', color: 'var(--t3)', fontSize: '13.5px', lineHeight: 1.8 }}>
            No articles yet.{' '}
            <Link href="/admin/jana" style={{ color: '#d4a853', textDecoration: 'none' }}>
              Generate the first one →
            </Link>
          </div>
        ) : (
          articles.map((article) => {
            const isSelected      = selectedIds.has(article.id)
            const isReadOnly      = READ_ONLY_STATUS.has(article.status)
            const isDdOpen        = openDropdown === article.id
            const isGenerating    = ['generating', 'awaiting_topic_selection'].includes(article.status)
            const cfg             = STATUS_CFG[article.status] ?? { label: article.status, color: null, bg: null, dot: null }

            return (
              <div
                key={article.id}
                className={`at-row${isSelected ? ' at-selected' : ''}`}
              >
                {/* Col 1 — checkbox */}
                <div className="at-cb">
                  <input
                    type="checkbox"
                    className="cb-box"
                    checked={isSelected}
                    onChange={() => toggleSelect(article.id)}
                  />
                </div>

                {/* Col 2 — title + slug */}
                <div className="at-title-cell">
                  {EDITABLE.has(article.status) && article.title ? (
                    <Link href={`/admin/editor/${article.id}`} className="article-title-link">
                      {article.title}
                    </Link>
                  ) : (
                    <span className="at-title-plain">
                      {article.title ?? (
                        <span style={{ color: 'var(--t3)', fontStyle: 'italic', fontWeight: 400, fontSize: '13px' }}>
                          Untitled
                        </span>
                      )}
                    </span>
                  )}
                  {article.slug && !/^draft-\d+$/.test(article.slug) && (
                    <div className="at-slug">/artikel/{article.slug}</div>
                  )}
                </div>

                {/* Col 3 — status (dropdown or read-only badge) */}
                <div className="at-status-cell">
                  <div className="status-dd-wrap">
                    <button
                      className={`status-dd-trigger${isReadOnly ? ' ro' : ''}`}
                      onClick={isReadOnly ? undefined : () => setOpenDropdown(isDdOpen ? null : article.id)}
                    >
                      {/* Badge pill */}
                      <span
                        className="status-pill"
                        style={{
                          background: cfg.bg ?? 'var(--badge-bg)',
                          color: cfg.color ?? 'var(--t2)',
                        }}
                      >
                        <span
                          className="status-pill-dot"
                          style={{ background: cfg.dot ?? 'var(--t3)' }}
                        />
                        {cfg.label}
                      </span>
                      {/* Caret — only for editable statuses */}
                      {!isReadOnly && (
                        <span className={`dd-caret${isDdOpen ? ' open' : ''}`}>
                          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M6 9l6 6 6-6"/>
                          </svg>
                        </span>
                      )}
                    </button>

                    {/* Dropdown menu */}
                    {isDdOpen && (
                      <div className="status-dd-menu">
                        {DROPDOWN_OPTIONS.map(opt => {
                          const oCfg = STATUS_CFG[opt.value] ?? {}
                          const isCurrent = article.status === opt.value
                          return (
                            <div
                              key={opt.value}
                              className={`dd-item${isCurrent ? ' dd-active' : ''}`}
                              onClick={() => {
                                if (!isCurrent) updateStatus(article.id, opt.value)
                                else setOpenDropdown(null)
                              }}
                            >
                              <span
                                className="dd-item-dot"
                                style={{ background: oCfg.dot ?? 'var(--t3)' }}
                              />
                              {opt.label}
                              {isCurrent && (
                                <svg style={{ marginLeft: 'auto' }} width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path d="M20 6L9 17l-5-5"/>
                                </svg>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 4 — views */}
                <div
                  className="at-num at-views-cell"
                  style={{ textAlign: 'right', color: article.views ? '#60a5fa' : undefined }}
                >
                  {article.views ? article.views.toLocaleString() : '—'}
                </div>

                {/* Col 5 — date */}
                <div className="at-num at-date-cell">
                  {fmt(article.created_at)}
                </div>

                {/* Col 6 — delete / cancel */}
                <div className="at-action-cell" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="del-btn"
                    onClick={() => isGenerating ? openCancel(article) : openDelete(article)}
                    title={isGenerating ? 'Cancel generation' : 'Delete article'}
                  >
                    {isGenerating ? (
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Bulk action banner — slides down from top, matches settings banner ── */}
      <AnimatePresence>
        {selectionActive && (
          <motion.div
            className="bulk-banner"
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0,   opacity: 1 }}
            exit={{   y: -64, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            style={{
              position: 'fixed',
              left: '240px',
              right: 0,
              top: 0,
              zIndex: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '10px 16px',
              background: 'var(--banner-bg)',
              borderBottom: '1px solid var(--banner-border)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.22)',
              flexWrap: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Left — amber pulse dot + count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#d4a853', flexShrink: 0,
                animation: 'banner-pulse 1.8s ease-in-out infinite',
              }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap' }}>
                {selectedIds.size} {selectedIds.size === 1 ? 'article' : 'articles'} selected
              </span>
            </div>
            {/* Right — action buttons */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="bulk-btn bulk-cancel"  onClick={exitSelection}>Cancel</button>
              <button className="bulk-btn bulk-delete"  onClick={() => setModal('bulk-delete')}>Delete</button>
              <button className="bulk-btn bulk-draft"   onClick={() => handleBulkStatus('draft')}>Set as Draft</button>
              <button className="bulk-btn bulk-publish" onClick={() => handleBulkStatus('published')}>Publish</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
