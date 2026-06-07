'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import ConfirmationModal from '@/components/admin/ConfirmationModal'

/* ── Status badge ─────────────────────────────────────────── */
// Colors chosen to be readable on both dark and light backgrounds
const STATUS_CFG = {
  awaiting_topic_selection: { label: 'Select Topic',    color: '#2563eb', bg: 'rgba(59,130,246,0.10)', dot: '#3b82f6' },
  generating:      { label: 'Generating',   color: '#d97706', bg: 'rgba(245,158,11,0.10)',  dot: '#f59e0b' },
  ready_to_review: { label: 'Ready to Review', color: '#2563eb', bg: 'rgba(59,130,246,0.10)',  dot: '#3b82f6' },
  draft:           { label: 'Draft',        color: null,      bg: null,                     dot: null      },
  published:       { label: 'Published',    color: '#059669', bg: 'rgba(16,185,129,0.10)',  dot: '#10b981' },
  failed:          { label: 'Failed',       color: '#dc2626', bg: 'rgba(239,68,68,0.10)',   dot: '#ef4444' },
}
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: null, bg: null, dot: null }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: cfg.bg ?? 'var(--badge-bg)',
      color: cfg.color ?? 'var(--t2)',
      padding: '3px 10px', borderRadius: '999px',
      fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.dot ?? 'var(--t3)', flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

/* ── Date formatter ─────────────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmt(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

const EDITABLE = new Set(['ready_to_review', 'draft', 'published'])

export default function ArtikelClient({ initialArticles }) {
  const [articles, setArticles] = useState(initialArticles)
  const [lm, setLm] = useState(false)
  const [modal, setModal]          = useState(null)
  const [targetArticle, setTarget] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('admin-theme') || 'dark'
    setLm(saved === 'light')
    const handler = (e) => setLm(e.detail === 'light')
    window.addEventListener('admin-theme-change', handler)
    return () => window.removeEventListener('admin-theme-change', handler)
  }, [])

  const openDelete = (article) => { setTarget(article); setModal('delete') }
  const openCancel = (article) => { setTarget(article); setModal('cancel') }

  const handleDelete = async () => {
    if (!targetArticle) return
    setModal(null)
    const label = targetArticle.title ?? `artikel ${targetArticle.id.slice(0, 8)}`
    const tid = toast.loading('Deleting article...')
    try {
      const res = await fetch(`/api/articles/${targetArticle.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Failed to delete article.', { id: tid }); return }
      setArticles(prev => prev.filter(a => a.id !== targetArticle.id))
      toast.success(`"${label}" deleted.`, { id: tid })
    } catch {
      toast.error('Error while deleting.', { id: tid })
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
      toast.error('Error while cancelling.', { id: tid })
    }
  }

  const vars = lm ? `
    --bg: #f8f8f8; --surface: #ffffff; --surface2: #f1f1f1;
    --border: #e5e7eb; --divider: #f0f0f0;
    --t1: #0d1117; --t2: #1f2937; --t3: #4b5563;
    --surface-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px #e5e7eb; --surface-inset: none;
    --row-hover: rgba(0,0,0,0.02);
    --del-idle: #9ca3af; --del-hover: #ef4444;
    --badge-bg: rgba(0,0,0,0.05);
    --jana-bg: rgba(212,168,83,0.1); --jana-border: rgba(212,168,83,0.28);
  ` : `
    --bg: #0c0b0a; --surface: #0f0e0d; --surface2: #131110;
    --border: rgba(237,232,223,0.07); --divider: rgba(237,232,223,0.05);
    --t1: #ede8df; --t2: #8c857c; --t3: #3d3830;
    --surface-shadow: none; --surface-inset: inset 0 1px 0 rgba(237,232,223,0.04);
    --row-hover: rgba(237,232,223,0.02);
    --del-idle: #2a2a2a; --del-hover: #ef4444;
    --badge-bg: rgba(237,232,223,0.07);
    --jana-bg: rgba(212,168,83,0.08); --jana-border: rgba(212,168,83,0.22);
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

        .at-table {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px; overflow: hidden;
          box-shadow: var(--surface-shadow), var(--surface-inset);
          width: 100%; min-width: 0;
        }
        .at-title-cell { min-width: 0; overflow: hidden; }
        .at-header {
          display: grid; grid-template-columns: 1fr 140px 120px 36px;
          padding: 9px 20px;
          border-bottom: 1px solid var(--border);
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.13em; text-transform: uppercase;
          color: var(--t3);
        }
        .at-row {
          display: grid; grid-template-columns: 1fr 140px 120px 36px;
          padding: 13px 20px; align-items: center;
          border-bottom: 1px solid var(--divider);
          transition: background 0.1s;
        }
        .at-row:last-child { border-bottom: none; }
        .at-row:hover { background: var(--row-hover); }
        .at-date {
          font-size: 11.5px; color: var(--t3);
          font-variant-numeric: tabular-nums;
        }
        .at-slug {
          font-size: 10.5px; color: var(--t3);
          margin-top: 2px; line-height: 1.3;
        }
        .article-title-link {
          color: #d4a853; text-decoration: none;
          font-size: 13.5px; font-weight: 500; line-height: 1.4;
          transition: color 0.1s;
        }
        .article-title-link:hover { color: #e8c86c; }
        .at-title-plain {
          font-size: 13.5px; font-weight: 500;
          color: var(--t1); line-height: 1.4;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 100%;
        }
        .article-title-link {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          display: block; max-width: 100%;
        }
        .delete-btn {
          background: none; border: none; cursor: pointer;
          color: var(--del-idle); padding: 5px; border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          transition: color 0.12s; margin-left: auto;
        }
        .delete-btn:hover { color: var(--del-hover); }
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

        @media (max-width: 640px) {
          .at-header { display: none; }
          .at-row {
            grid-template-columns: 1fr auto;
            grid-template-rows: auto auto;
            padding: 13px 16px; gap: 5px 10px;
          }
          .at-date { display: none; }
          .at-title-cell { grid-column: 1; grid-row: 1; }
          .at-status-cell { grid-column: 1; grid-row: 2; }
          .at-action-cell { grid-column: 2; grid-row: 1 / span 2; display: flex; align-items: center; }
        }
      `}</style>

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

      {/* Page header */}
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

      {/* Table */}
      <div className="at-table">
        <div className="at-header">
          <span>Title</span><span>Status</span><span>Date</span><span />
        </div>

        {articles.length === 0 ? (
          <div style={{ padding: '52px 20px', textAlign: 'center', color: 'var(--t3)', fontSize: '13.5px', lineHeight: 1.8 }}>
            No articles yet.{' '}
            <Link href="/admin/jana" style={{ color: '#d4a853', textDecoration: 'none' }}>
              Generate the first one →
            </Link>
          </div>
        ) : (
          articles.map((article) => (
            <div key={article.id} className="at-row">
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

              <div className="at-status-cell">
                <StatusBadge status={article.status} />
              </div>

              <div className="at-date">{fmt(article.created_at)}</div>

              <div className="at-action-cell" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="delete-btn"
                  onClick={() => ['generating', 'awaiting_topic_selection'].includes(article.status) ? openCancel(article) : openDelete(article)}
                  title={['generating', 'awaiting_topic_selection'].includes(article.status) ? 'Cancel generation' : 'Delete article'}
                >
                  {['generating', 'awaiting_topic_selection'].includes(article.status) ? (
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
          ))
        )}
      </div>
    </motion.div>
  )
}
