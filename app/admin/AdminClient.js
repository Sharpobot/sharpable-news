'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

/* ── Stable date formatter ────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogos','Sep','Okt','Nov','Dis']
function fmt(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/* ── Stat card ────────────────────────────────────────────── */
function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px',
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444' }}>
        {label}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: "'Fraunces', serif", color: accent ?? '#f0f0f0', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}

/* ── Custom tooltip ───────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#161412', border: '1px solid #2a2a2a', borderRadius: '6px',
      padding: '8px 12px', fontSize: '12px', color: '#ede8df',
    }}>
      <div style={{ color: '#8c857c', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{payload[0].value} artikel</div>
    </div>
  )
}

export default function AdminClient({ analytics }) {
  if (!analytics) return null
  const { totalPublished, totalDraft, totalGenerating, thisWeek, recentPublished, dailyCounts } = analytics

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="admin-page-content"
      style={{ fontFamily: "'DM Sans', sans-serif", color: '#f0f0f0' }}
    >

      <style>{`
        .analytics-cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 16px; }
        .analytics-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 900px) {
          .analytics-cards { grid-template-columns: repeat(2,1fr) !important; }
          .analytics-bottom { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .analytics-cards { grid-template-columns: repeat(2,1fr) !important; }
          .analytics-bottom { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <h1 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 700 }}>Papan Pemuka</h1>

      {/* Stat cards */}
      <div className="analytics-cards">
        <StatCard label="Diterbit"      value={totalPublished}  accent="#10b981" />
        <StatCard label="Draf"          value={totalDraft}      accent="#8c857c" />
        <StatCard label="Menjana Kini"  value={totalGenerating} accent="#f59e0b" />
        <StatCard label="7 Hari Ini"    value={thisWeek}        accent="#d4a853" />
      </div>

      {/* Bottom row */}
      <div className="analytics-bottom">

        {/* Recent published */}
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '18px 20px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', marginBottom: '14px' }}>
            5 Artikel Terbaru Diterbit
          </div>
          {recentPublished.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#333' }}>Tiada artikel diterbit lagi.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentPublished.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <a
                    href={`/artikel/${a.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '13px', color: '#d4a853', textDecoration: 'none', lineHeight: 1.4, flex: 1 }}
                    onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.target.style.textDecoration = 'none'}
                  >
                    {a.title ?? '(Tanpa tajuk)'}
                  </a>
                  <div style={{ fontSize: '11px', color: '#444', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {fmt(a.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7-day bar chart */}
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '18px 20px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', marginBottom: '14px' }}>
            Artikel Diterbit — 7 Hari Lepas
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={dailyCounts} barSize={18} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
              <XAxis dataKey="label" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {dailyCounts.map((entry, i) => (
                  <Cell key={i} fill={entry.count > 0 ? '#d4a853' : '#1e1e1e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}
