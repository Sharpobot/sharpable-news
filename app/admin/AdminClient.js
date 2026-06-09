'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

/* ── Date helpers ─────────────────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmt(iso)    { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
function fmtShort(iso) { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]}` }

/* ── Count-up hook ────────────────────────────────────────────── */
function useCountUp(target, delay = 0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) return
    let raf, start = null
    const duration = 650
    const run = (ts) => {
      if (!start) start = ts + delay
      if (ts < start) { raf = requestAnimationFrame(run); return }
      const p = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)   // cubic ease-out
      setVal(Math.round(ease * target))
      if (p < 1) raf = requestAnimationFrame(run)
    }
    raf = requestAnimationFrame(run)
    return () => cancelAnimationFrame(raf)
  }, [target, delay])
  return val
}

/* ── Metric cell (used inside the unified strip) ──────────────── */
function MetricCell({ label, target, accent, isLast, delay, dividerColor }) {
  const val = useCountUp(target, delay)
  return (
    <div style={{
      flex: 1, padding: '20px 22px',
      borderRight: isLast ? 'none' : `1px solid ${dividerColor}`,
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <div style={{
        fontSize: '9px', fontWeight: 700, letterSpacing: '0.13em',
        textTransform: 'uppercase', color: 'var(--t3)',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '38px', fontWeight: 700, lineHeight: 1,
        fontFamily: "'DM Sans', sans-serif",
        fontVariantNumeric: 'tabular-nums',
        color: accent,
      }}>
        {val}
      </div>
    </div>
  )
}

/* ── Chart tooltip ────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: '5px', padding: '8px 12px',
      fontSize: '12px', color: 'var(--t1)',
      boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
    }}>
      <div style={{ color: 'var(--t3)', marginBottom: '3px', fontSize: '10.5px' }}>{label}</div>
      <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{payload[0].value} articles</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Main dashboard
═══════════════════════════════════════════════════════════════ */
export default function AdminClient({ analytics }) {
  const [lm,       setLm]       = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('admin-theme') || 'dark'
    setLm(saved === 'light')
    const handler = (e) => setLm(e.detail === 'light')
    window.addEventListener('admin-theme-change', handler)

    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('admin-theme-change', handler)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  if (!analytics) return null
  const { totalPublished, totalDraft, totalGenerating, thisWeek, recentPublished, mostRead, viewsThisWeek, failedThisWeek, dailyCounts } = analytics
  const totalWeek = dailyCounts.reduce((s, d) => s + d.count, 0)

  const todayLabel = new Date().toLocaleDateString('en-MY', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // CSS custom properties — switched by lm flag
  const vars = lm ? `
    --bg: #f8f8f8;
    --surface: #ffffff;
    --surface2: #f1f1f1;
    --border: #e5e7eb;
    --divider: #f0f0f0;
    --t1: #0d1117;
    --t2: #1f2937;
    --t3: #4b5563;
    --bar-empty: #e5e7eb;
    --surface-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px #e5e7eb;
    --surface-inset: none;
  ` : `
    --bg: #0c0b0a;
    --surface: #0f0e0d;
    --surface2: #131110;
    --border: rgba(237,232,223,0.07);
    --divider: rgba(237,232,223,0.06);
    --t1: #ede8df;
    --t2: #8c857c;
    --t3: #3d3830;
    --bar-empty: rgba(237,232,223,0.05);
    --surface-shadow: none;
    --surface-inset: inset 0 1px 0 rgba(237,232,223,0.04);
  `

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="admin-page-content"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        .admin-page-content { ${vars} }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.85); }
        }

        .status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #10b981; display: inline-block; flex-shrink: 0;
          animation: pulse-dot 2.4s ease-in-out infinite;
        }

        /* Metrics strip */
        .metrics-strip {
          display: flex;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 12px;
          box-shadow: var(--surface-shadow), var(--surface-inset);
        }
        .metrics-strip > div:nth-child(3) { /* Menjana accent */
          background: transparent;
        }

        /* Mobile: 2-col strip
           MetricCell uses inline style flex:1 — !important required to override */
        @media (max-width: 900px) {
          .metrics-strip { flex-wrap: wrap; }
          .metrics-strip > div {
            flex: 0 0 50% !important;
            max-width: 50% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            border-right: none !important;
            border-bottom: 1px solid var(--divider);
          }
          .metrics-strip > div:nth-last-child(-n+2) { border-bottom: none; }
          .analytics-bottom { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 901px) and (max-width: 1200px) {
          .analytics-bottom { grid-template-columns: 1fr 1fr !important; }
        }
        /* Very small screens: tighten padding + shrink the big number */
        @media (max-width: 420px) {
          .metrics-strip > div { padding: 14px 16px !important; }
          .metrics-strip > div > div:last-child { font-size: 28px !important; }
        }

        /* Analytics bottom */
        .analytics-bottom {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
          min-width: 0; overflow: hidden;
        }
        .analytics-bottom > * { min-width: 0; overflow: hidden; }

        /* Panel shared style */
        .dash-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 18px 20px;
          box-shadow: var(--surface-shadow), var(--surface-inset);
        }

        .panel-label {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.13em; text-transform: uppercase;
          color: var(--t3); margin-bottom: 14px;
        }

        /* Article rows */
        .article-row {
          display: flex; justify-content: space-between;
          align-items: baseline; gap: 12px;
          padding: 9px 0;
          border-bottom: 1px solid var(--divider);
        }
        .article-row:last-child { border-bottom: none; padding-bottom: 0; }
        .article-row:first-child { padding-top: 0; }
        .article-link {
          font-size: 13px; color: #d4a853; text-decoration: none;
          line-height: 1.4; transition: color 0.12s;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .article-link:hover { color: #e8c86c; }
        .article-idx {
          font-size: 9.5px; color: var(--t3);
          font-variant-numeric: tabular-nums;
          flex-shrink: 0; width: 16px; line-height: 1.4;
        }
        .article-date {
          font-size: 10.5px; color: var(--t3);
          white-space: nowrap; flex-shrink: 0;
          font-variant-numeric: tabular-nums;
        }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.015em' }}>
            Dashboard
          </h1>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span className="status-dot" />
            <span style={{ fontSize: '11.5px', color: 'var(--t2)' }}>System active</span>
          </span>
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--t3)' }}>{todayLabel}</div>
      </div>

      {/* ── Metrics strip — one unified instrument surface ── */}
      <div className="metrics-strip">
        <MetricCell label="Published"       target={totalPublished}   accent="#10b981"  delay={0}   dividerColor="var(--divider)" />
        <MetricCell label="Draft"           target={totalDraft}       accent="var(--t2)" delay={80}  dividerColor="var(--divider)" />
        <MetricCell label="Generating"      target={totalGenerating}  accent="#f59e0b"  delay={160} dividerColor="var(--divider)" />
        <MetricCell label="This Week"       target={thisWeek}         accent="#d4a853"  delay={240} dividerColor="var(--divider)" />
        <MetricCell label="Views This Week" target={viewsThisWeek ?? 0}  accent="#60a5fa" delay={320} dividerColor="var(--divider)" />
        <MetricCell label="Failed This Week" target={failedThisWeek ?? 0} accent="#ef4444" delay={400} dividerColor="var(--divider)" isLast />
      </div>

      {/* ── Bottom row ── */}
      <div className="analytics-bottom" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>

        {/* Most read */}
        <div className="dash-panel">
          <div className="panel-label">Most Read Articles</div>
          {(mostRead ?? []).length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--t3)', padding: '4px 0' }}>No views recorded yet.</div>
          ) : (
            <div>
              {(mostRead ?? []).map((a, i) => (
                <motion.div
                  key={a.id}
                  className="article-row"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.055, duration: 0.18 }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px', flex: 1, minWidth: 0 }}>
                    <span className="article-idx">{String(i + 1).padStart(2, '0')}</span>
                    <a
                      href={`/artikel/${a.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="article-link"
                    >
                      {a.title ?? '(Untitled)'}
                    </a>
                  </div>
                  <span className="article-date" style={{ color: '#60a5fa' }}>{(a.views ?? 0).toLocaleString()}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recent published */}
        <div className="dash-panel">
          <div className="panel-label">5 Latest Published Articles</div>
          {recentPublished.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--t3)', padding: '4px 0' }}>No articles published yet.</div>
          ) : (
            <div>
              {recentPublished.map((a, i) => (
                <motion.div
                  key={a.id}
                  className="article-row"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.055, duration: 0.18 }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px', flex: 1, minWidth: 0 }}>
                    <span className="article-idx">{String(i + 1).padStart(2, '0')}</span>
                    <a
                      href={`/artikel/${a.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="article-link"
                    >
                      {a.title ?? '(Untitled)'}
                    </a>
                  </div>
                  <span className="article-date">{fmtShort(a.created_at)}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 7-day bar chart */}
        <div className="dash-panel" style={{ overflow: 'hidden', minWidth: 0 }}>
          {/* Header: label left, weekly total right */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div className="panel-label" style={{ margin: 0 }}>Articles Published — Last 7 Days</div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
              <span style={{ fontSize: '26px', fontWeight: 700, color: '#d4a853', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {totalWeek}
              </span>
              <span style={{ fontSize: '10.5px', color: 'var(--t3)', display: 'block', marginTop: '1px' }}>articles this week</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={126}>
            <BarChart data={dailyCounts} barSize={15} margin={{ top: 2, right: 0, bottom: 0, left: -28 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--t3)', fontSize: 10 }}
                axisLine={false} tickLine={false}
                interval={isMobile ? 1 : 0}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'var(--t3)', fontSize: 10 }}
                axisLine={false} tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: lm ? 'rgba(24,21,15,0.04)' : 'rgba(237,232,223,0.03)' }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={600} animationBegin={200}>
                {dailyCounts.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.count > 0 ? '#d4a853' : (lm ? 'rgba(24,21,15,0.07)' : 'rgba(237,232,223,0.05)')}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </motion.div>
  )
}
