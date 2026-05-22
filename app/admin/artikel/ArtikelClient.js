'use client'
import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

/* ── Status badge ─────────────────────────────────────────── */
const STATUS_CFG = {
  generating:      { label: 'Menjana',   color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  ready_to_review: { label: 'Semak',     color: '#1e3a8a', bg: '#dbeafe', dot: '#3b82f6' },
  draft:           { label: 'Draf',      color: '#374151', bg: '#f3f4f6', dot: '#9ca3af' },
  published:       { label: 'Diterbit',  color: '#064e3b', bg: '#d1fae5', dot: '#10b981' },
}

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

/* ── Stable date formatter ────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogos','Sep','Okt','Nov','Dis']
function fmt(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

const EDITABLE = new Set(['ready_to_review', 'draft', 'published'])

export default function ArtikelClient({ initialArticles }) {
  const [articles, setArticles] = useState(initialArticles)

  const handleDelete = async (article) => {
    const label = article.title ?? `artikel ${article.id.slice(0, 8)}`
    if (!window.confirm(`Padam "${label}"? Tindakan ini tidak boleh dibatalkan.`)) return

    const tid = toast.loading('Memadam artikel...')
    try {
      const res = await fetch(`/api/articles/${article.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Gagal memadam artikel.', { id: tid }); return }
      setArticles(prev => prev.filter(a => a.id !== article.id))
      toast.success('Artikel dipadam.', { id: tid })
    } catch {
      toast.error('Ralat semasa memadam.', { id: tid })
    }
  }

  const handleCancel = async (article) => {
    if (!window.confirm(`Batalkan penjanaan artikel #${article.id.slice(0, 8)}?`)) return

    const tid = toast.loading('Membatalkan...')
    try {
      const res = await fetch(`/api/articles/${article.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Gagal membatalkan.', { id: tid }); return }
      setArticles(prev => prev.filter(a => a.id !== article.id))
      toast.success('Penjanaan dibatalkan.', { id: tid })
    } catch {
      toast.error('Ralat semasa membatalkan.', { id: tid })
    }
  }

  return (
    <div style={{ padding: '32px', fontFamily: "'DM Sans', sans-serif", color: '#f0f0f0' }}>
      <style>{`
        .at-header { display: grid; grid-template-columns: 1fr 140px 100px 36px; padding: 10px 20px; border-bottom: 1px solid #1e1e1e; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #444; }
        .at-row { display: grid; grid-template-columns: 1fr 140px 100px 36px; padding: 14px 20px; align-items: center; }
        .at-date { font-size: 12px; color: #555; }
        .delete-btn { background: none; border: none; cursor: pointer; color: #3a3a3a; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: color 0.15s; }
        .delete-btn:hover { color: #ef4444; }
        @media (max-width: 640px) {
          .at-header { display: none; }
          .at-row { grid-template-columns: 1fr auto; grid-template-rows: auto auto; padding: 12px 16px; gap: 4px 8px; }
          .at-date { display: none; }
          .at-title-cell { grid-column: 1; grid-row: 1; }
          .at-status-cell { grid-column: 1; grid-row: 2; }
          .at-action-cell { grid-column: 2; grid-row: 1 / span 2; display: flex; align-items: center; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Semua Artikel</h1>
          <span style={{ fontSize: '13px', color: '#555' }}>{articles.length} artikel</span>
        </div>
        <Link href="/admin/jana" style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          padding: '8px 16px', background: '#f0f0f0', color: '#0a0a0a',
          borderRadius: '8px', fontSize: '13px', fontWeight: 600,
          textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Jana Artikel Baru
        </Link>
      </div>

      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', overflow: 'hidden' }}>
        <div className="at-header">
          <span>Tajuk</span><span>Status</span><span>Tarikh</span><span />
        </div>

        {articles.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#444', fontSize: '14px' }}>
            Tiada artikel lagi.{' '}
            <Link href="/admin/jana" style={{ color: '#d4a853', textDecoration: 'none' }}>Jana yang pertama →</Link>
          </div>
        ) : (
          articles.map((article, i) => (
            <div key={article.id} className="at-row" style={{ borderBottom: i < articles.length - 1 ? '1px solid #181818' : 'none' }}>

              <div className="at-title-cell">
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#e0e0e0', lineHeight: 1.4 }}>
                  {EDITABLE.has(article.status) && article.title ? (
                    <Link href={`/admin/editor/${article.id}`} style={{ color: '#d4a853', textDecoration: 'none' }}
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
              </div>

              <div className="at-status-cell"><StatusBadge status={article.status} /></div>
              <div className="at-date">{fmt(article.created_at)}</div>

              <div className="at-action-cell" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="delete-btn"
                  onClick={() => article.status === 'generating' ? handleCancel(article) : handleDelete(article)}
                  title={article.status === 'generating' ? 'Batalkan penjanaan' : 'Padam artikel'}
                >
                  {article.status === 'generating' ? (
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
    </div>
  )
}
