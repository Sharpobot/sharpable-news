'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginClient() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('E-mel atau kata laluan tidak sah.')
      setLoading(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0c0b0a', fontFamily: "'DM Sans', sans-serif", padding: '24px',
    }}>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .login-card { animation: fade-in 0.3s ease both; }
        .login-input {
          width: 100%; padding: 10px 12px; border-radius: 6px;
          border: 1px solid rgba(237,232,223,0.11); background: #0e0d0c;
          color: #ede8df; font-size: 14px; font-family: "'DM Sans', sans-serif";
          outline: none; box-sizing: border-box; transition: border-color 0.15s;
        }
        .login-input:focus { border-color: rgba(212,168,83,0.45); }
        .login-btn {
          width: 100%; padding: 11px; border-radius: 6px; border: none;
          background: #d4a853; color: #0c0b0a; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s;
          font-family: "'DM Sans', sans-serif"; letter-spacing: 0.01em;
        }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .login-btn:not(:disabled):hover { opacity: 0.88; }
      `}</style>

      <div className="login-card" style={{ width: '100%', maxWidth: '400px' }}>

        {/* Card */}
        <div style={{
          background: '#111010',
          border: '1px solid rgba(237,232,223,0.1)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 32px 96px rgba(0,0,0,0.55)',
        }}>

          {/* Brand header */}
          <div style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid rgba(237,232,223,0.07)',
            background: '#0e0d0c',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            {/* Logo mark */}
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: '#d4a853', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" fill="none" stroke="#0c0b0a" strokeWidth="2.5" viewBox="0 0 24 24">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#444' }}>
                Sharpable News
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#ede8df', lineHeight: 1.1 }}>
                Admin Panel
              </div>
            </div>
          </div>

          {/* Form section */}
          <div style={{ padding: '28px 28px 32px' }}>
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#ede8df', marginBottom: '5px' }}>
                Log Masuk
              </div>
              <div style={{ fontSize: '13px', color: '#56514d', lineHeight: 1.5 }}>
                Masukkan kelayakan admin anda untuk meneruskan.
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#56514d', marginBottom: '5px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  E-mel
                </label>
                <input
                  className="login-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#56514d', marginBottom: '5px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Kata Laluan
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="login-input"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#56514d', cursor: 'pointer',
                      padding: '4px', display: 'flex', alignItems: 'center',
                    }}
                    tabIndex={-1}
                  >
                    {showPw ? (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ fontSize: '12.5px', color: '#ef4444', padding: '10px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              <button className="login-btn" type="submit" disabled={loading} style={{ marginTop: '4px' }}>
                {loading ? 'Melog masuk…' : 'Log Masuk'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
