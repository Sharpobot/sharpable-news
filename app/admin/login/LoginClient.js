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
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .login-box { animation: fade-in 0.35s ease both; }
        .login-input {
          width: 100%; padding: 10px 12px; border-radius: 6px;
          border: 1px solid rgba(237,232,223,0.11); background: #111010;
          color: #ede8df; fontSize: 14px; fontFamily: "'DM Sans', sans-serif";
          outline: none; box-sizing: border-box; transition: border-color 0.15s;
        }
        .login-input:focus { border-color: rgba(212,168,83,0.4); }
        .login-btn {
          width: 100%; padding: 11px; border-radius: 6px; border: none;
          background: #d4a853; color: #0c0b0a; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s;
          font-family: "'DM Sans', sans-serif";
        }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .login-btn:not(:disabled):hover { opacity: 0.88; }
      `}</style>

      <div className="login-box" style={{ width: '100%', maxWidth: '360px' }}>
        {/* Brand */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#444', marginBottom: '6px' }}>
            Sharpable News
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: "'Fraunces', serif", color: '#ede8df' }}>
            Admin Panel
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', color: '#56514d', marginBottom: '5px', fontWeight: 600, letterSpacing: '0.04em' }}>
              E-MEL
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
            <label style={{ display: 'block', fontSize: '11.5px', color: '#56514d', marginBottom: '5px', fontWeight: 600, letterSpacing: '0.04em' }}>
              KATA LALUAN
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

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Melog masuk…' : 'Log Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
