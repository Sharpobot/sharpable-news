'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Toaster } from 'react-hot-toast'

const NAV = [
  {
    href: '/admin',
    label: 'Papan Pemuka',
    exact: true,
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/admin/artikel',
    label: 'Artikel',
    exact: false,
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
      </svg>
    ),
  },
  {
    href: '/admin/jana',
    label: 'Jana Artikel',
    exact: false,
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    href: '/admin/tetapan',
    label: 'Tetapan',
    exact: false,
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

const TOAST_OPTS = {
  style: {
    background: '#161412',
    color: '#ede8df',
    border: '1px solid rgba(212,168,83,0.25)',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '13px',
    borderRadius: '8px',
    padding: '12px 16px',
  },
  success: { iconTheme: { primary: '#10b981', secondary: '#161412' } },
  error:   { iconTheme: { primary: '#ef4444', secondary: '#161412' } },
  loading: { iconTheme: { primary: '#d4a853', secondary: '#161412' } },
}

export default function AdminSidebar({ children, logoutAction }) {
  const pathname = usePathname()
  const isEditor = pathname.startsWith('/admin/editor/')
  const isLogin  = pathname === '/admin/login'

  const isActive = (nav) =>
    nav.exact ? pathname === nav.href : pathname.startsWith(nav.href)

  /* ── Login page or Editor: no shell, just toaster ── */
  if (isLogin || isEditor) {
    return (
      <>
        <Toaster position="bottom-right" toastOptions={TOAST_OPTS} />
        {children}
      </>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: "'DM Sans', sans-serif", color: '#f0f0f0', display: 'flex', flexDirection: 'column' }}>
      <Toaster position="bottom-right" toastOptions={TOAST_OPTS} />

      <style>{`
        /* ── Mobile top bar (column item above content) ── */
        .admin-topbar {
          display: none;
          position: sticky; top: 0; z-index: 30;
          background: #0a0a0a; border-bottom: 1px solid #1a1a1a;
          overflow-x: auto; flex-shrink: 0;
        }
        .admin-topbar-inner {
          display: flex; align-items: center;
          padding: 0 4px; min-width: max-content; width: 100%;
        }
        .mobile-nav-link {
          display: flex; align-items: center; gap: 6px;
          padding: 13px 14px; text-decoration: none; font-size: 13px;
          white-space: nowrap; border-bottom: 2px solid transparent;
          transition: color 0.15s; font-family: "'DM Sans', sans-serif";
        }

        /* ── Desktop sidebar + content row ── */
        .admin-body {
          display: flex; flex: 1; min-height: 0;
        }
        .admin-sidebar {
          width: 220px; border-right: 1px solid #1a1a1a;
          display: flex; flex-direction: column;
          position: sticky; top: 0; height: 100vh;
          flex-shrink: 0; overflow-y: auto; background: #0a0a0a;
        }
        .admin-content { flex: 1; min-width: 0; overflow-x: hidden; }
        .sidebar-nav-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 6px;
          text-decoration: none; font-size: 13.5px;
          margin-bottom: 2px; transition: background 0.15s, color 0.15s;
        }
        .sidebar-nav-link:hover { background: #111 !important; }

        /* ── Admin page content padding ── */
        .admin-page-content { padding: 32px; }

        @media (max-width: 768px) {
          .admin-topbar { display: flex; }
          .admin-sidebar { display: none; }
          .admin-page-content { padding: 16px; }
        }
      `}</style>

      {/* Mobile top bar — sits above content in the column flow */}
      <div className="admin-topbar">
        <div className="admin-topbar-inner">
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#333', padding: '0 12px', flexShrink: 0 }}>
            SN
          </span>
          {NAV.map(nav => (
            <Link key={nav.href} href={nav.href} prefetch className="mobile-nav-link" style={{
              color: isActive(nav) ? '#d4a853' : '#56514d',
              borderBottomColor: isActive(nav) ? '#d4a853' : 'transparent',
              fontWeight: isActive(nav) ? 600 : 400,
            }}>
              {nav.label}
            </Link>
          ))}
          <form action={logoutAction} style={{ padding: '0 8px', flexShrink: 0 }}>
            <button type="submit" style={{
              background: 'none', border: 'none', color: '#3a3a3a',
              fontSize: '12px', cursor: 'pointer', padding: '4px 8px',
            }}>
              Keluar
            </button>
          </form>
        </div>
      </div>

      {/* Body row: sidebar + content */}
      <div className="admin-body">

        {/* Desktop sidebar */}
        <aside className="admin-sidebar">
          <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444', marginBottom: '2px' }}>
              Sharpable News
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0f0f0' }}>Admin Panel</div>
          </div>

          <nav style={{ flex: 1, padding: '10px 8px' }}>
            {NAV.map(nav => {
              const active = isActive(nav)
              return (
                <Link key={nav.href} href={nav.href} prefetch className="sidebar-nav-link" style={{
                  background: active ? '#161412' : 'transparent',
                  color: active ? '#d4a853' : '#56514d',
                  fontWeight: active ? 600 : 400,
                }}>
                  <span style={{ color: active ? '#d4a853' : '#3a3a3a', flexShrink: 0 }}>
                    {nav.icon}
                  </span>
                  {nav.label}
                </Link>
              )
            })}
          </nav>

          <div style={{ padding: '12px 8px', borderTop: '1px solid #1a1a1a' }}>
            <form action={logoutAction}>
              <button type="submit" style={{
                width: '100%', padding: '8px 12px', background: 'none',
                border: '1px solid #1e1e1e', borderRadius: '6px',
                color: '#3a3a3a', fontSize: '12.5px', cursor: 'pointer',
                textAlign: 'left', transition: 'color 0.15s, border-color 0.15s',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#8c857c'; e.currentTarget.style.borderColor = '#2a2a2a' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#3a3a3a'; e.currentTarget.style.borderColor = '#1e1e1e' }}
              >
                Log Keluar
              </button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  )
}
