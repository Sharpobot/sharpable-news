'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import ConfirmationModal from '@/components/admin/ConfirmationModal'

/* ── Date formatter ─────────────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmt(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/* ── CSV export (client-side) ─────────────────────────────────── */
function exportCsv(subscribers) {
  const header = 'Email,Source,Date Subscribed\n'
  const rows = subscribers.map(s => {
    const email = `"${(s.email ?? '').replace(/"/g, '""')}"`
    const source = `"${(s.source ?? '').replace(/"/g, '""')}"`
    const date = `"${fmt(s.subscribed_at)}"`
    return `${email},${source},${date}`
  })
  const csv = header + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  // Dispatch a non-bubbling click so the global PageLoader (which listens for
  // <a> clicks on document to show the public-site navigation overlay) never
  // sees this synthetic download click and gets stuck mid-progress.
  a.dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: true }))
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function LanggananClient({ initialSubscribers }) {
  const [subscribers, setSubscribers] = useState(initialSubscribers)
  const [lm, setLm] = useState(false)
  const [search, setSearch] = useState('')
  const [target, setTarget] = useState(null)

  /* ── Theme ── */
  useEffect(() => {
    const saved = localStorage.getItem('admin-theme') || 'dark'
    setLm(saved === 'light')
    const handler = (e) => setLm(e.detail === 'light')
    window.addEventListener('admin-theme-change', handler)
    return () => window.removeEventListener('admin-theme-change', handler)
  }, [])

  const filtered = subscribers.filter(s =>
    (s.email ?? '').toLowerCase().includes(search.trim().toLowerCase())
  )

  const handleDelete = async () => {
    if (!target) return
    setTarget(null)
    const tid = toast.loading('Deleting subscriber...')
    try {
      const res = await fetch(`/api/subscribers/${target.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Failed to delete.', { id: tid }); return }
      setSubscribers(prev => prev.filter(s => s.id !== target.id))
      toast.success(`"${target.email}" removed.`, { id: tid })
    } catch {
      toast.error('Error deleting.', { id: tid })
    }
  }

  /* ── CSS vars (theme) — matches articles table ── */
  const vars = lm ? `
    --bg:#f8f8f8; --surface:#ffffff; --surface2:#f1f1f1;
    --border:#e5e7eb; --divider:#f0f0f0;
    --t1:#0d1117; --t2:#1f2937; --t3:#4b5563;
    --surface-shadow:0 1px 4px rgba(0,0,0,0.06),0 0 0 1px #e5e7eb; --surface-inset:none;
    --row-hover:rgba(0,0,0,0.02);
    --del-idle:#9ca3af; --del-hover:#ef4444;
    --badge-bg:rgba(0,0,0,0.05);
    --input-bg:#ffffff; --input-border:#e5e7eb;
    --jana-bg:rgba(212,168,83,0.1); --jana-border:rgba(212,168,83,0.28);
  ` : `
    --bg:#0c0b0a; --surface:#0f0e0d; --surface2:#131110;
    --border:rgba(237,232,223,0.07); --divider:rgba(237,232,223,0.05);
    --t1:#ede8df; --t2:#8c857c; --t3:#3d3830;
    --surface-shadow:none; --surface-inset:inset 0 1px 0 rgba(237,232,223,0.04);
    --row-hover:rgba(237,232,223,0.02);
    --del-idle:#2a2a2a; --del-hover:#ef4444;
    --badge-bg:rgba(237,232,223,0.07);
    --input-bg:#131110; --input-border:rgba(237,232,223,0.08);
    --jana-bg:rgba(212,168,83,0.08); --jana-border:rgba(212,168,83,0.22);
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

        /* ── Header ── */
        .lg-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px; gap: 12px; flex-wrap: wrap;
        }
        .lg-title-row { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }

        /* ── Table wrapper ── */
        .lg-wrap {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px; overflow: hidden;
          box-shadow: var(--surface-shadow), var(--surface-inset);
          width: 100%;
        }
        .lg-table { width: 100%; border-collapse: collapse; table-layout: fixed; }

        /* ── Column widths via <colgroup> ── */
        .col-email  { width: 60%; }
        .col-source { width: 16%; }
        .col-date   { width: 16%; }
        .col-action { width: 8%; }

        /* ── Header ── */
        .lg-table thead th {
          padding: 9px 14px;
          border-bottom: 1px solid var(--border);
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.13em; text-transform: uppercase;
          color: var(--t3); white-space: nowrap;
          text-align: left; background: var(--surface);
        }
        .lg-table thead th.th-center { text-align: center; }
        .lg-table thead th.th-right  { text-align: right; padding-right: 16px; }

        /* ── Body rows ── */
        .lg-table tbody tr { border-bottom: 1px solid var(--divider); transition: background 0.1s; }
        .lg-table tbody tr:last-child { border-bottom: none; }
        .lg-table tbody tr:hover      { background: var(--row-hover); }

        /* ── Body cells ── */
        .lg-table tbody td { padding: 13px 14px; vertical-align: middle; overflow: hidden; }
        .lg-table tbody td.td-center { text-align: center; }
        .lg-table tbody td.td-right  { text-align: right; padding-right: 16px; }

        .lg-email {
          font-size: 13.5px; font-weight: 500; color: var(--t1);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; max-width: 100%;
        }
        .lg-source-pill {
          display: inline-flex; align-items: center;
          padding: 3px 10px; border-radius: 999px;
          font-size: 11.5px; font-weight: 600; letter-spacing: 0.02em; white-space: nowrap;
          background: var(--badge-bg); color: var(--t2);
        }
        .lg-num { font-size: 11.5px; color: var(--t3); font-variant-numeric: tabular-nums; }

        /* ── Action icon buttons ── */
        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: var(--del-idle); padding: 5px; border-radius: 4px;
          display: inline-flex; align-items: center; justify-content: center;
          transition: color 0.12s;
        }
        .del-btn:hover { color: var(--del-hover); }

        /* ── Search input ── */
        .lg-search {
          width: 100%; max-width: 320px;
          padding: 9px 14px; border-radius: 7px;
          background: var(--input-bg); border: 1px solid var(--input-border);
          color: var(--t1); font-size: 13px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border-color 0.12s;
        }
        .lg-search::placeholder { color: var(--t3); }
        .lg-search:focus { border-color: rgba(212,168,83,0.4); }

        /* ── Export button ── */
        .export-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 8px 16px;
          background: var(--jana-bg); color: #d4a853; border: 1px solid var(--jana-border);
          border-radius: 7px; font-size: 13px; font-weight: 600;
          cursor: pointer; white-space: nowrap; font-family: 'DM Sans', sans-serif;
          transition: background 0.12s, border-color 0.12s;
        }
        .export-btn:hover { background: rgba(212,168,83,0.16); border-color: rgba(212,168,83,0.4); }
        .export-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── Empty state ── */
        .lg-empty {
          padding: 52px 20px; text-align: center; color: var(--t3);
          font-size: 13.5px; line-height: 1.8;
          background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
          box-shadow: var(--surface-shadow), var(--surface-inset);
        }

        /* ── Mobile card layout ── */
        .lg-cards { display: none; }
        .lg-card {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: var(--surface-shadow), var(--surface-inset);
          padding: 14px 40px 14px 14px;
          margin-bottom: 10px;
        }
        .lg-card-email {
          font-size: 14px; font-weight: 600; color: var(--t1);
          word-break: break-all; margin-bottom: 8px; line-height: 1.4;
        }
        .lg-card-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .lg-card-date { font-size: 11.5px; color: var(--t3); font-variant-numeric: tabular-nums; }
        .lg-card-del {
          position: absolute; top: 10px; right: 10px;
        }

        @media (max-width: 768px) {
          .lg-table-wrap { display: none; }
          .lg-cards { display: block; }
          .lg-search { max-width: none; }
          .lg-header { flex-direction: column; align-items: stretch; }
          .lg-title-row { justify-content: space-between; }
          .export-btn { width: 100%; }
        }
      `}</style>

      <ConfirmationModal
        open={!!target}
        title="Remove Subscriber?"
        message="Are you sure you want to remove this subscriber?"
        confirmLabel="Yes, Remove" cancelLabel="Cancel" confirmColor="red"
        onConfirm={handleDelete} onCancel={() => setTarget(null)}
      />

      {/* ── Page header ── */}
      <div className="lg-header">
        <div className="lg-title-row">
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.015em' }}>
            Subscribers
          </h1>
          <span style={{ fontSize: '11.5px', color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>
            {subscribers.length} {subscribers.length === 1 ? 'subscriber' : 'subscribers'}
          </span>
        </div>
        <button className="export-btn" onClick={() => exportCsv(subscribers)} disabled={subscribers.length === 0}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>

      {/* ── Search ── */}
      <div style={{ marginBottom: '16px' }}>
        <input
          className="lg-search"
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="lg-empty">
          {subscribers.length === 0 ? 'No subscribers yet.' : 'No results found.'}
        </div>
      ) : (
        <>
          {/* ── Desktop / tablet table ── */}
          <div className="lg-wrap lg-table-wrap">
            <table className="lg-table">
              <colgroup>
                <col className="col-email" />
                <col className="col-source" />
                <col className="col-date" />
                <col className="col-action" />
              </colgroup>

              <thead>
                <tr>
                  <th>Email</th>
                  <th className="th-center">Source</th>
                  <th className="th-center">Date Subscribed</th>
                  <th className="th-right" />
                </tr>
              </thead>

              <tbody>
                {filtered.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <span className="lg-email">{sub.email}</span>
                    </td>
                    <td className="td-center">
                      <span className="lg-source-pill">{sub.source ?? '—'}</span>
                    </td>
                    <td className="td-center lg-num">
                      {fmt(sub.subscribed_at)}
                    </td>
                    <td className="td-right">
                      <button
                        className="icon-btn del-btn"
                        onClick={() => setTarget(sub)}
                        title="Delete subscriber"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="lg-cards">
            {filtered.map((sub) => (
              <div key={sub.id} className="lg-card">
                <button
                  className="icon-btn del-btn lg-card-del"
                  onClick={() => setTarget(sub)}
                  title="Delete subscriber"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                  </svg>
                </button>
                <div className="lg-card-email">{sub.email}</div>
                <div className="lg-card-meta">
                  <span className="lg-source-pill">{sub.source ?? '—'}</span>
                  <span className="lg-card-date">{fmt(sub.subscribed_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  )
}
