import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import LoginForm from './LoginForm'
import { logoutAction } from './actions'

export const dynamic = 'force-dynamic'

/* ── Status badge config ──────────────────────────────────── */
const STATUS_CONFIG = {
  generating:      { label: 'Menjana',   color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  ready_to_review: { label: 'Semak',     color: '#1e3a8a', bg: '#dbeafe', dot: '#3b82f6' },
  draft:           { label: 'Draf',      color: '#374151', bg: '#f3f4f6', dot: '#9ca3af' },
  published:       { label: 'Diterbit',  color: '#064e3b', bg: '#d1fae5', dot: '#10b981' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#374151', bg: '#f3f4f6', dot: '#9ca3af' }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      background: cfg.bg,
      color: cfg.color,
      padding: '3px 10px',
      borderRadius: '999px',
      fontSize: '11.5px',
      fontWeight: 600,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: '6px', height: '6px',
        borderRadius: '50%',
        background: cfg.dot,
        flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  )
}

/* ── Page ─────────────────────────────────────────────────── */
export default async function AdminPage() {
  const cookieStore = await cookies()
  const isAuth = cookieStore.get('admin-auth')?.value === 'true'

  if (!isAuth) return <LoginForm />

  const supabase = createServerSupabaseClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, status, created_at')
    .order('created_at', { ascending: false })

  const fmt = (iso) => new Date(iso).toLocaleDateString('ms-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      fontFamily: "'DM Sans', sans-serif",
      color: '#f0f0f0',
    }}>

      {/* ── Header ── */}
      <header style={{
        borderBottom: '1px solid #1e1e1e',
        padding: '0 32px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: '#0a0a0a',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>
              Sharpable News
            </span>
            <span style={{ margin: '0 10px', color: '#333' }}>·</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f0' }}>Admin</span>
          </div>

          {/* Artikel Baru AI button */}
          <button style={{
            padding: '7px 16px',
            background: '#f0f0f0',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Artikel Baru AI
          </button>
        </div>

        <form action={logoutAction}>
          <button type="submit" style={{
            padding: '7px 14px',
            background: 'transparent',
            color: '#666',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
          }}>
            Log Keluar
          </button>
        </form>
      </header>

      {/* ── Main ── */}
      <main style={{ padding: '32px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Semua Artikel</h2>
          <span style={{ fontSize: '13px', color: '#555' }}>{articles?.length ?? 0} artikel</span>
        </div>

        {/* ── Table ── */}
        <div style={{
          background: '#111',
          border: '1px solid #1e1e1e',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 130px',
            padding: '10px 20px',
            borderBottom: '1px solid #1e1e1e',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#444',
          }}>
            <span>Tajuk</span>
            <span>Status</span>
            <span>Tarikh</span>
          </div>

          {/* Rows */}
          {!articles || articles.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#444', fontSize: '14px' }}>
              Tiada artikel lagi. Cipta artikel pertama anda!
            </div>
          ) : (
            articles.map((article, i) => (
              <div
                key={article.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 130px',
                  padding: '14px 20px',
                  borderBottom: i < articles.length - 1 ? '1px solid #181818' : 'none',
                  alignItems: 'center',
                  transition: 'background 0.1s',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#e0e0e0', lineHeight: 1.4 }}>
                    {article.title || <span style={{ color: '#444', fontStyle: 'italic' }}>Tanpa tajuk</span>}
                  </div>
                  {article.slug && (
                    <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>
                      /artikel/{article.slug}
                    </div>
                  )}
                </div>
                <StatusBadge status={article.status} />
                <div style={{ fontSize: '12px', color: '#555' }}>{fmt(article.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
