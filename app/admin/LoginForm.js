'use client'
import { useActionState } from 'react'
import { loginAction } from './actions'

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null)

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '360px',
        padding: '40px',
        background: '#141414',
        border: '1px solid #2a2a2a',
        borderRadius: '12px',
      }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#666',
            marginBottom: '8px',
          }}>
            Sharpable News
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#f0f0f0' }}>
            Admin Panel
          </h1>
        </div>

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            name="password"
            placeholder="Kata laluan"
            required
            autoFocus
            style={{
              padding: '11px 14px',
              background: '#1e1e1e',
              border: `1px solid ${state?.error ? '#ef4444' : '#2a2a2a'}`,
              borderRadius: '8px',
              color: '#f0f0f0',
              fontSize: '14px',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />

          {state?.error && (
            <p style={{ margin: 0, fontSize: '13px', color: '#ef4444' }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            style={{
              padding: '11px',
              background: pending ? '#2a2a2a' : '#f0f0f0',
              color: pending ? '#666' : '#0a0a0a',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: pending ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {pending ? 'Masuk...' : 'Log Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
