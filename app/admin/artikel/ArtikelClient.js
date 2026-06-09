'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmationModal from '@/components/admin/ConfirmationModal'

/* ── Status config ─────────────────────────────────────────── */
const STATUS_CFG = {
  awaiting_topic_selection: { label: 'Select Topic',    color: '#2563eb', bg: 'rgba(59,130,246,0.10)',  dot: '#3b82f6' },
  generating:               { label: 'Generating',      color: '#d97706', bg: 'rgba(245,158,11,0.10)',  dot: '#f59e0b' },
  ready_to_review:          { label: 'Ready to Review', color: '#2563eb', bg: 'rgba(59,130,246,0.10)',  dot: '#3b82f6' },
  draft:                    { label: 'Draft',           color: null,      bg: null,                     dot: null      },
  published:                { label: 'Published',       color: '#059669', bg: 'rgba(16,185,129,0.10)',  dot: '#10b981' },
  failed:                   { label: 'Failed',          color: '#dc2626', bg: 'rgba(239,68,68,0.10)',   dot: '#ef4444' },
}
const DROPDOWN_OPTIONS = [
  { value: 'published',       label: 'Published'       },
  { value: 'ready_to_review', label: 'Ready to Review' },
  { value: 'draft',           label: 'Draft'           },
]
const READ_ONLY_STATUS = new Set(['generating', 'failed', 'awaiting_topic_selection'])
const EDITABLE         = new Set(['ready_to_review', 'draft', 'published'])

/* ── Date formatter ─────────────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmt(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export default function ArtikelClient({ initialArticles }) {
  const [articles, setArticles]         = useState(initialArticles)
  const [lm, setLm]                     = useState(false)
  const [modal, setModal]               = useState(null)
  const [targetArticle, setTarget]      = useState(null)
  const [selectedIds, setSelectedIds]   = useState(new Set())
  const [openDropdown, setOpenDropdown] = useState(null)   // article id
  const [dropdownPos, setDropdownPos]   = useState(null)   // { top, left } — fixed viewport coords
  const [isMounted, setIsMounted]       = useState(false)  // SSR guard for createPortal

  // Map of article-id → trigger <button> DOM element, populated via callback refs
  const triggerRefs = useRef(new Map())

  /* ── Mount guard — createPortal needs document.body ── */
  useEffect(() => { setIsMounted(true) }, [])

  /* ── Theme ── */
  useEffect(() => {
    const saved = localStorage.getItem('admin-theme') || 'dark'
    setLm(saved === 'light')
    const handler = (e) => setLm(e.detail === 'light')
    window.addEventListener('admin-theme-change', handler)
    return () => window.removeEventListener('admin-theme-change', handler)
  }, [])

  /* ── Close dropdown ── */
  const closeDropdown = () => {
    setOpenDropdown(null)
    setDropdownPos(null)
  }

  /*
   * Open dropdown for an article.
   * Reads the trigger button's viewport position via getBoundingClientRect()
   * so the portal menu can be placed with position:fixed without any
   * relationship to the table's overflow:hidden context.
   */
  const openDropdownFor = (articleId) => {
    const el = triggerRefs.current.get(articleId)
    if (!el) return
    const rect = el.getBoundingClientRect()
    setDropdownPos({ top: rect.bottom + 6, left: rect.left })
    setOpenDropdown(articleId)
  }

  /*
   * Close on outside click.
   * Excludes .status-dd-wrap (the trigger area) AND .status-dd-portal-menu
   * (the portal menu itself, which lives in document.body — outside the wrap).
   */
  useEffect(() => {
    if (!openDropdown) return
    const handler = (e) => {
      const inTrigger = e.target.closest('.status-dd-wrap')
      const inMenu    = e.target.closest('.status-dd-portal-menu')
      if (!inTrigger && !inMenu) closeDropdown()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openDropdown])

  /* ── Selection helpers ── */
  const selectionActive = selectedIds.size > 0
  const isAllSelected   = articles.length > 0 && articles.every(a => selectedIds.has(a.id))
  const toggleSelect    = (id) => setSelectedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  const toggleSelectAll = () =>
    isAllSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(articles.map(a => a.id)))
  const exitSelection   = () => setSelectedIds(new Set())

  /* ── Status update (single) ── */
  const updateStatus = async (articleId, newStatus) => {
    closeDropdown()
    const originalStatus = articles.find(a => a.id === articleId)?.status
    setArticles(list => list.map(a => a.id === articleId ? { ...a, status: newStatus } : a))
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Status updated to "${STATUS_CFG[newStatus]?.label ?? newStatus}".`)
    } catch {
      setArticles(list => list.map(a => a.id === articleId ? { ...a, status: originalStatus } : a))
      toast.error('Failed to update status.')
    }
  }

  /* ── Single delete / cancel ── */
  const openDelete = (article) => { setTarget(article); setModal('delete') }
  const openCancel = (article) => { setTarget(article); setModal('cancel') }

  const handleDelete = async () => {
    if (!targetArticle) return
    setModal(null)
    const label = targetArticle.title ?? `article ${targetArticle.id.slice(0, 8)}`
    const tid = toast.loading('Deleting article...')
    try {
      const res = await fetch(`/api/articles/${targetArticle.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Failed to delete.', { id: tid }); return }
      setArticles(prev => prev.filter(a => a.id !== targetArticle.id))
      toast.success(`"${label}" deleted.`, { id: tid })
    } catch {
      toast.error('Error deleting.', { id: tid })
    }
  }

  const handleCancel = async () => {
    if (!targetArticle) return
    setModal(null)
    const tid = toast.loading('Cancelling...')
    try {
      const res = await fetch(`/api/articles/${targetArticle.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Failed to cancel.', { id: tid }); return }
      setArticles(prev => prev.filter(a => a.id !== targetArticle.id))
      toast.success('Generation cancelled.', { id: tid })
    } catch {
      toast.error('Error cancelling.', { id: tid })
    }
  }

  /* ── Bulk delete ── */
  const handleBulkDelete = async () => {
    setModal(null)
    const ids = [...selectedIds]
    const tid = toast.loading(`Deleting ${ids.length} articles...`)
    const results = await Promise.allSettled(
      ids.map(id => fetch(`/api/articles/${id}`, { method: 'DELETE' }))
    )
    const succeeded = ids.filter((_, i) =>
      results[i].status === 'fulfilled' && results[i].value?.ok
    )
    const failCount    = ids.length - succeeded.length
    const succeededSet = new Set(succeeded)
    setArticles(prev => prev.filter(a => !succeededSet.has(a.id)))
    exitSelection()
    failCount > 0
      ? toast.error(`${succeeded.length} deleted, ${failCount} failed.`, { id: tid })
      : toast.success(`${succeeded.length} articles deleted.`, { id: tid })
  }

  /* ── Bulk status change ── */
  const handleBulkStatus = async (newStatus) => {
    const ids   = [...selectedIds]
    const label = STATUS_CFG[newStatus]?.label ?? newStatus
    const tid   = toast.loading(`Updating ${ids.length} articles...`)
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
    const failCount    = ids.length - succeeded.length
    const succeededSet = new Set(succeeded)
    setArticles(prev => prev.map(a => succeededSet.has(a.id) ? { ...a, status: newStatus } : a))
    exitSelection()
    failCount > 0
      ? toast.error(`${succeeded.length} updated, ${failCount} failed.`, { id: tid })
      : toast.success(`${succeeded.length} articles set to "${label}".`, { id: tid })
  }

  /* ── CSS vars (theme) ── */
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
    --banner-bg:#ffffff; --banner-border:rgba(24,21,15,0.1);
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
    --banner-bg:#141210; --banner-border:rgba(237,232,223,0.09);
    --cb-accent:#d4a853;
  `

  // Inline theme vars object for the portal (it lives in document.body, outside the CSS scope)
  const themeStyle = Object.fromEntries(
    vars.trim().split(';')
      .map(s => s.trim()).filter(Boolean)
      .map(s => { const i = s.indexOf(':'); return [s.slice(0, i).trim(), s.slice(i + 1).trim()] })
  )

  // The article whose dropdown is currently open
  const ddArticle = openDropdown ? articles.find(a => a.id === openDropdown) ?? null : null

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

        /* ── Table wrapper ── */
        .at-wrap {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px; overflow: hidden;
          box-shadow: var(--surface-shadow), var(--surface-inset);
          width: 100%;
        }
        .at-table { width: 100%; border-collapse: collapse; table-layout: fixed; }

        /* ── Column widths via <colgroup> ── */
        .col-cb     { width: 44px; }
        .col-status { width: 16%; }
        .col-views  { width: 9%; }
        .col-date   { width: 13%; }
        .col-action { width: 72px; }

        /* ── Header ── */
        .at-table thead th {
          padding: 9px 14px;
          border-bottom: 1px solid var(--border);
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.13em; text-transform: uppercase;
          color: var(--t3); white-space: nowrap;
          text-align: left; background: var(--surface);
        }
        .at-table thead th.th-cb     { width: 44px; padding-left: 16px; padding-right: 8px; text-align: center; }
        .at-table thead th.th-center { text-align: center; }
        .at-table thead th.th-right  { text-align: right; padding-right: 16px; }

        /* ── Body rows ── */
        .at-table tbody tr { border-bottom: 1px solid var(--divider); transition: background 0.1s; }
        .at-table tbody tr:last-child  { border-bottom: none; }
        .at-table tbody tr:hover       { background: var(--row-hover); }
        .at-table tbody tr.at-selected { background: var(--sel-row) !important; }

        /* ── Body cells ── */
        .at-table tbody td { padding: 13px 14px; vertical-align: middle; overflow: hidden; }
        .at-table tbody td.td-cb     { padding-left: 16px; padding-right: 8px; text-align: center; width: 44px; }
        .at-table tbody td.td-center { text-align: center; }
        .at-table tbody td.td-right  { text-align: right; padding-right: 16px; }

        /* ── Checkbox ── */
        .at-cb { opacity: 0; transition: opacity 0.13s; display: inline-flex; align-items: center; justify-content: center; }
        .at-table tbody tr:hover .at-cb,
        .at-table tbody tr.at-selected .at-cb,
        .at-wrap.sel-active .at-cb { opacity: 1; }
        .at-table thead tr .at-cb  { opacity: 1; }
        .cb-box { width: 15px; height: 15px; cursor: pointer; accent-color: var(--cb-accent); }

        /* ── Title cell ── */
        .article-title-link {
          color: #d4a853; text-decoration: none;
          font-size: 13.5px; font-weight: 500; line-height: 1.4;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          display: block; max-width: 100%; transition: color 0.1s;
        }
        .article-title-link:hover { color: #e8c86c; }
        .at-title-plain {
          font-size: 13.5px; font-weight: 500; color: var(--t1);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; max-width: 100%;
        }
        .at-slug { font-size: 10.5px; color: var(--t3); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* ── Status trigger (badge + caret only — no inline menu) ── */
        .status-dd-wrap { position: relative; display: inline-flex; align-items: center; }
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
          font-size: 11.5px; font-weight: 600; letter-spacing: 0.02em; white-space: nowrap;
        }
        .status-pill-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .dd-caret { color: var(--t3); display: inline-flex; align-items: center; transition: transform 0.15s; }
        .dd-caret.open { transform: rotate(180deg); }

        /*
         * Portal dropdown menu — VISUAL styles only.
         * position:fixed + top/left are set as inline style on the portal element.
         * Class name .status-dd-portal-menu is used by the outside-click handler
         * so clicks inside the menu don't trigger close.
         */
        .status-dd-portal-menu {
          background: var(--dd-bg);
          border: 1px solid var(--dd-border);
          border-radius: 8px; overflow: hidden;
          box-shadow: var(--dd-shadow);
          min-width: 170px;
        }
        .dd-item {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 13px; cursor: pointer;
          font-size: 12.5px; font-weight: 500; color: var(--t1);
          transition: background 0.1s; white-space: nowrap;
        }
        .dd-item:hover { background: var(--dd-hover); }
        .dd-item.dd-active { color: #d4a853; }
        .dd-item-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

        /* ── Numeric cells ── */
        .at-num { font-size: 11.5px; color: var(--t3); font-variant-numeric: tabular-nums; }

        /* ── Action icon buttons ── */
        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: var(--del-idle); padding: 5px; border-radius: 4px;
          display: inline-flex; align-items: center; justify-content: center;
          transition: color 0.12s; text-decoration: none;
        }
        .del-btn:hover     { color: var(--del-hover); }
        .preview-btn       { color: var(--t3); }
        .preview-btn:hover { color: var(--t2); }

        /* ── Generate link button ── */
        .jana-link-btn {
          display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px;
          background: var(--jana-bg); color: #d4a853; border: 1px solid var(--jana-border);
          border-radius: 7px; font-size: 13px; font-weight: 600;
          text-decoration: none; white-space: nowrap;
          transition: background 0.12s, border-color 0.12s;
        }
        .jana-link-btn:hover { background: rgba(212,168,83,0.16); border-color: rgba(212,168,83,0.4); }

        /* ── Bulk banner buttons ── */
        @keyframes banner-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .bulk-btn {
          padding: 7px 16px; border-radius: 6px;
          font-size: 12.5px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; border: 1px solid;
          transition: background 0.12s, border-color 0.12s, color 0.12s;
          white-space: nowrap; line-height: 1;
        }
        .bulk-cancel        { background: none; border: 1px solid var(--banner-border); color: var(--t2); }
        .bulk-cancel:hover  { border-color: var(--t2); color: var(--t1); }
        .bulk-delete        { background: rgba(239,68,68,0.10);  color: #ef4444; border-color: rgba(239,68,68,0.25); }
        .bulk-delete:hover  { background: rgba(239,68,68,0.18);  border-color: rgba(239,68,68,0.4); }
        .bulk-draft         { background: var(--badge-bg); color: var(--t2); border-color: var(--border); }
        .bulk-draft:hover   { background: var(--row-hover); }
        .bulk-publish       { background: rgba(16,185,129,0.10); color: #10b981; border-color: rgba(16,185,129,0.25); }
        .bulk-publish:hover { background: rgba(16,185,129,0.18); border-color: rgba(16,185,129,0.4); }

        @media (max-width: 640px) {
          .bulk-banner { left: 0 !important; top: 51px !important; }
          .bulk-btn    { padding: 6px 12px; font-size: 12px; }
          .hide-mobile { display: none; }
        }
        @media (min-width: 641px) { .bulk-banner { left: 220px !important; } }
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
      <div className={`at-wrap${selectionActive ? ' sel-active' : ''}`}>
        <table className="at-table">
          <colgroup>
            <col className="col-cb" />
            <col className="col-title" />
            <col className="col-status" />
            <col className="col-views hide-mobile" />
            <col className="col-date  hide-mobile" />
            <col className="col-action" />
          </colgroup>

          <thead>
            <tr>
              <th className="th-cb">
                <div className="at-cb">
                  {selectionActive && (
                    <input
                      type="checkbox" className="cb-box"
                      checked={isAllSelected} onChange={toggleSelectAll}
                      title={isAllSelected ? 'Deselect all' : 'Select all'}
                    />
                  )}
                </div>
              </th>
              <th>Title</th>
              <th className="th-center">Status</th>
              <th className="th-center hide-mobile">Views</th>
              <th className="th-center hide-mobile">Date</th>
              <th className="th-right" />
            </tr>
          </thead>

          <tbody>
            {articles.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '52px 20px', textAlign: 'center', color: 'var(--t3)', fontSize: '13.5px', lineHeight: 1.8 }}>
                  No articles yet.{' '}
                  <Link href="/admin/jana" style={{ color: '#d4a853', textDecoration: 'none' }}>
                    Generate the first one →
                  </Link>
                </td>
              </tr>
            ) : (
              articles.map((article) => {
                const isSelected   = selectedIds.has(article.id)
                const isReadOnly   = READ_ONLY_STATUS.has(article.status)
                const isDdOpen     = openDropdown === article.id
                const isGenerating = ['generating', 'awaiting_topic_selection'].includes(article.status)
                const cfg          = STATUS_CFG[article.status] ?? { label: article.status, color: null, bg: null, dot: null }

                return (
                  <tr key={article.id} className={isSelected ? 'at-selected' : ''}>

                    {/* Col 1 — checkbox */}
                    <td className="td-cb">
                      <div className="at-cb">
                        <input
                          type="checkbox" className="cb-box"
                          checked={isSelected} onChange={() => toggleSelect(article.id)}
                        />
                      </div>
                    </td>

                    {/* Col 2 — title + slug */}
                    <td>
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
                    </td>

                    {/* Col 3 — status badge + trigger
                        No inline <div className="status-dd-menu"> here.
                        The menu is rendered via createPortal below to escape overflow:hidden. */}
                    <td className="td-center">
                      <div className="status-dd-wrap">
                        <button
                          ref={el => {
                            // Callback ref: keep a map of article-id → DOM button element
                            if (el) triggerRefs.current.set(article.id, el)
                            else    triggerRefs.current.delete(article.id)
                          }}
                          className={`status-dd-trigger${isReadOnly ? ' ro' : ''}`}
                          onClick={isReadOnly ? undefined : () =>
                            isDdOpen ? closeDropdown() : openDropdownFor(article.id)
                          }
                        >
                          <span
                            className="status-pill"
                            style={{ background: cfg.bg ?? 'var(--badge-bg)', color: cfg.color ?? 'var(--t2)' }}
                          >
                            <span className="status-pill-dot" style={{ background: cfg.dot ?? 'var(--t3)' }} />
                            {cfg.label}
                          </span>
                          {!isReadOnly && (
                            <span className={`dd-caret${isDdOpen ? ' open' : ''}`}>
                              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="M6 9l6 6 6-6"/>
                              </svg>
                            </span>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Col 4 — views */}
                    <td
                      className="td-center at-num hide-mobile"
                      style={{ color: article.views ? '#60a5fa' : undefined }}
                    >
                      {article.views ? article.views.toLocaleString() : '—'}
                    </td>

                    {/* Col 5 — date */}
                    <td className="td-center at-num hide-mobile">
                      {fmt(article.created_at)}
                    </td>

                    {/* Col 6 — action icons */}
                    <td className="td-right">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        {article.status === 'published' && article.slug && (
                          <a
                            href={`/artikel/${article.slug}`}
                            target="_blank" rel="noopener noreferrer"
                            className="icon-btn preview-btn"
                            title="View published article"
                            onClick={e => e.stopPropagation()}
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </a>
                        )}
                        <button
                          className="icon-btn del-btn"
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
                    </td>

                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/*
       * ── Status dropdown portal ──────────────────────────────────────────────
       *
       * Rendered directly into document.body via createPortal, so it is
       * completely outside the table's overflow:hidden stacking context.
       *
       * Position: fixed (viewport-relative). Coordinates come from
       * getBoundingClientRect() on the trigger button, computed when the
       * dropdown opens — so it always sits flush below the badge regardless
       * of scroll position or table layout.
       *
       * themeStyle injects the current CSS custom properties as inline styles
       * so the portal menu picks up --dd-bg, --dd-border, etc. without being
       * in the .admin-page-content scope.
       */}
      {isMounted && ddArticle && dropdownPos && createPortal(
        <div
          className="status-dd-portal-menu"
          style={{
            position: 'fixed',
            top:  dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 9999,
            fontFamily: "'DM Sans', sans-serif",
            ...themeStyle,
          }}
        >
          {DROPDOWN_OPTIONS.map(opt => {
            const oCfg      = STATUS_CFG[opt.value] ?? {}
            const isCurrent = ddArticle.status === opt.value
            return (
              <div
                key={opt.value}
                className={`dd-item${isCurrent ? ' dd-active' : ''}`}
                onClick={() => isCurrent ? closeDropdown() : updateStatus(ddArticle.id, opt.value)}
              >
                <span className="dd-item-dot" style={{ background: oCfg.dot ?? 'var(--t3)' }} />
                {opt.label}
                {isCurrent && (
                  <svg style={{ marginLeft: 'auto' }} width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </div>
            )
          })}
        </div>,
        document.body
      )}

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
              position: 'fixed', left: '240px', right: 0, top: 0, zIndex: 120,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '10px', padding: '10px 16px',
              background: 'var(--banner-bg)',
              borderBottom: '1px solid var(--banner-border)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.22)',
              flexWrap: 'nowrap', fontFamily: "'DM Sans', sans-serif",
            }}
          >
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
