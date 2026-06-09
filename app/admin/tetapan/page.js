'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import ConfirmationModal from '@/components/admin/ConfirmationModal'

const PIPELINE_AGENTS = [
  { num: '01', key: 'trend-scout',     label: 'Trend Scout',      desc: 'Searches for current trending topics' },
  { num: '02', key: 'topic-selector',  label: 'Topic Selector',   desc: 'Selects the best topic for Malaysian readers' },
  { num: '03', key: 'deep-researcher', label: 'Deep Researcher',  desc: 'Gathers facts and key sources' },
  { num: '04', key: 'article-writer',  label: 'Article Writer',   desc: 'Writes a full article in Bahasa Malaysia' },
  { num: '05', key: 'seo-metadata',    label: 'SEO Metadata',     desc: 'Generates slug, meta description, and tags' },
  { num: '06', key: 'image-brief',     label: 'Image Brief',      desc: 'Prepares hero image suggestion' },
  { num: '07', key: 'quality-checker', label: 'Quality Checker',  desc: 'Evaluates article quality (0–100)' },
  { num: '08', key: 'revision-agent',  label: 'Revision Agent',   desc: 'Revises article if score is low (optional)', optional: true },
]

const SYS_CONFIG_ROWS = [
  { label: 'AI Model',               value: 'claude-sonnet-4-5' },
  { label: 'Provider',               value: 'Anthropic' },
  { label: 'Total Agents',           value: '7 required + 1 optional' },
  { label: 'Delay Between Agents',   value: '65 seconds' },
  { label: 'Generation Time (est.)', value: '~9–10 minutes' },
  { label: 'Retries',                value: 'Topic: max 3x · Inngest: 1x' },
  { label: 'Storage',                value: 'Supabase Postgres + Storage' },
  { label: 'Job Queue',              value: 'Inngest v4' },
]

const DEFAULT_SETTINGS = {
  quality_score_threshold: '85',
  target_article_length:   'standard',
  notification_email:      '',
  site_tagline:            'Berita AI & Teknologi untuk Malaysia',
  social_x:                '',
  social_facebook:         '',
  social_instagram:        '',
  pinned_categories:       '',
}

/* ── Unsaved changes banner ───────────────────────────────────── */
function UnsavedBanner({ count, onSave, onDiscard }) {
  return (
    <motion.div
      className="settings-banner"
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      exit={{   y: -64, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
      style={{
        position: 'fixed',
        left: '240px',
        right: 0,
        top: 0,
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        padding: '10px 16px',
        background: 'var(--banner-bg)',
        borderBottom: '1px solid var(--banner-border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.22)',
        flexWrap: 'nowrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: '#f59e0b', flexShrink: 0,
          animation: 'banner-pulse 1.8s ease-in-out infinite',
        }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>
          {count} unsaved {count === 1 ? 'change' : 'changes'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={onDiscard}
          style={{
            background: 'none',
            border: '1px solid var(--banner-border)',
            color: 'var(--t2)',
            borderRadius: '6px',
            padding: '7px 16px',
            fontSize: '12.5px', fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
            transition: 'border-color 0.12s, color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--t2)'; e.currentTarget.style.color = 'var(--t1)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--banner-border)'; e.currentTarget.style.color = 'var(--t2)' }}
        >
          Discard
        </button>
        <button
          onClick={onSave}
          style={{
            background: '#d4a853',
            border: '1px solid #d4a853',
            color: '#0c0b0a',
            borderRadius: '6px',
            padding: '7px 16px',
            fontSize: '12.5px', fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e8c86c' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#d4a853' }}
        >
          Save Changes
        </button>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Main settings page
═══════════════════════════════════════════════════════════════ */
export default function TetapanPage() {
  const [lm, setLm] = useState(false)
  /* saved = what's in DB; draft = what admin is editing */
  const [saved,  setSaved]  = useState(DEFAULT_SETTINGS)
  const [draft,  setDraft]  = useState(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modal,  setModal]  = useState(null)   // 'save' | 'discard'

  /* ── Theme ── */
  useEffect(() => {
    const v = localStorage.getItem('admin-theme') || 'dark'
    setLm(v === 'light')
    const h = (e) => setLm(e.detail === 'light')
    window.addEventListener('admin-theme-change', h)
    return () => window.removeEventListener('admin-theme-change', h)
  }, [])

  /* ── Load settings ── */
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        const merged = { ...DEFAULT_SETTINGS, ...data }
        setSaved(merged)
        setDraft(merged)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  /* ── Pending changes ── */
  const pendingKeys = useMemo(
    () => Object.keys(draft).filter(k => draft[k] !== saved[k]),
    [draft, saved]
  )
  const isDirty = pendingKeys.length > 0

  /* ── Draft update ── */
  const handleChange = (key, value) => setDraft(prev => ({ ...prev, [key]: value }))

  /* ── Confirm save ── */
  const handleConfirmSave = useCallback(async () => {
    setModal(null)
    setSaving(true)
    try {
      await Promise.all(
        pendingKeys.map(k =>
          fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: k, value: draft[k] }),
          })
        )
      )
      setSaved({ ...draft })
      toast.success(`${pendingKeys.length} ${pendingKeys.length === 1 ? 'setting' : 'settings'} saved`, {
        duration: 2200, style: { fontSize: '13px' },
      })
    } catch {
      toast.error('Could not save settings — try again')
    } finally {
      setSaving(false)
    }
  }, [draft, pendingKeys])

  /* ── Confirm discard ── */
  const handleConfirmDiscard = useCallback(() => {
    setModal(null)
    setDraft({ ...saved })
    toast('Changes discarded', { duration: 1800, style: { fontSize: '13px' } })
  }, [saved])

  /* ── CSS vars ── */
  const vars = lm ? `
    --bg: #f5f3f0; --surface: #ffffff; --surface2: #f0ede9;
    --border: rgba(24,21,15,0.09); --divider: rgba(24,21,15,0.06);
    --t1: #18150f; --t2: #6b6560; --t3: #a8a29e;
    --surface-shadow: 0 1px 3px rgba(24,21,15,0.07); --surface-inset: none;
    --chip-bg: rgba(24,21,15,0.05); --chip-border: rgba(24,21,15,0.1);
    --optional-bg: rgba(24,21,15,0.04);
    --input-bg: #f8f7f5; --input-border: rgba(24,21,15,0.12);
    --banner-bg: #ffffff; --banner-border: rgba(24,21,15,0.1);
  ` : `
    --bg: #0c0b0a; --surface: #0f0e0d; --surface2: #131110;
    --border: rgba(237,232,223,0.07); --divider: rgba(237,232,223,0.05);
    --t1: #ede8df; --t2: #8c857c; --t3: #3d3830;
    --surface-shadow: none; --surface-inset: inset 0 1px 0 rgba(237,232,223,0.04);
    --chip-bg: rgba(237,232,223,0.04); --chip-border: rgba(237,232,223,0.07);
    --optional-bg: rgba(237,232,223,0.02);
    --input-bg: rgba(237,232,223,0.04); --input-border: rgba(237,232,223,0.1);
    --banner-bg: #1a1815; --banner-border: rgba(237,232,223,0.1);
  `

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    borderRadius: '5px',
    padding: '8px 10px',
    fontSize: '13px', color: 'var(--t1)',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
      className="admin-page-content"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1815',
            color: '#ede8df',
            border: '1px solid rgba(237,232,223,0.12)',
            borderRadius: '7px',
            fontSize: '13px',
            fontFamily: "'DM Sans', sans-serif",
            padding: '10px 14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1a1815' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1a1815' } },
        }}
      />

      {/* Confirmation modals */}
      <ConfirmationModal
        open={modal === 'save'}
        title="Save Settings?"
        message={`Save ${pendingKeys.length} ${pendingKeys.length === 1 ? 'change' : 'changes'} to your site configuration?`}
        confirmLabel={saving ? 'Saving…' : 'Yes, Save'}
        cancelLabel="Go Back"
        confirmColor="amber"
        onConfirm={handleConfirmSave}
        onCancel={() => setModal(null)}
      />
      <ConfirmationModal
        open={modal === 'discard'}
        title="Discard Changes?"
        message="All unsaved changes will be lost and settings will revert to their last saved values."
        confirmLabel="Yes, Discard"
        cancelLabel="Keep Editing"
        confirmColor="red"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setModal(null)}
      />

      <style>{`
        .admin-page-content { ${vars} }

        /* Banner responsive overrides — !important overrides inline style on fixed div */
        @media (max-width: 768px) {
          /* top:51px overlaps the 1px mobile header border-bottom, removing the grey separator line */
          .settings-banner {
            left: 0 !important;
            top: 51px !important;
            border-top: none !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .settings-banner { left: 220px !important; }
        }
        /* Shrink banner buttons on very small phones so they don't wrap */
        @media (max-width: 400px) {
          .settings-banner button {
            padding: 5px 9px !important;
            font-size: 11px !important;
          }
        }

        @keyframes banner-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.75); }
        }

        .tet-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: var(--surface-shadow), var(--surface-inset);
          margin-bottom: 12px;
        }
        .tet-panel-header {
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 10px;
        }
        .tet-section-label {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.13em; text-transform: uppercase;
          color: var(--t3);
        }
        .tet-config-row {
          display: grid; grid-template-columns: 200px 1fr;
          padding: 13px 20px; gap: 16px; align-items: start;
          border-bottom: 1px solid var(--divider);
        }
        .tet-config-row:last-child { border-bottom: none; }
        .tet-config-key { font-size: 12.5px; color: var(--t2); padding-top: 9px; }
        .tet-config-val { font-size: 13px; color: var(--t1); font-variant-numeric: tabular-nums; padding-top: 9px; }
        .tet-agent-row {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 12px 20px; border-bottom: 1px solid var(--divider);
          transition: background 0.1s;
        }
        .tet-agent-row:last-child { border-bottom: none; }
        .tet-agent-row:hover { background: var(--chip-bg); }
        .tet-agent-num { font-size: 10px; font-weight: 700; color: var(--t3); font-variant-numeric: tabular-nums; min-width: 22px; padding-top: 2px; flex-shrink: 0; }
        .tet-agent-label { font-size: 13.5px; font-weight: 600; color: var(--t1); line-height: 1.3; margin-bottom: 2px; }
        .tet-agent-desc  { font-size: 12px; color: var(--t3); line-height: 1.4; }
        .tet-optional-badge {
          display: inline-flex; align-items: center;
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--t3);
          background: var(--chip-bg); border: 1px solid var(--chip-border);
          padding: 1px 7px; border-radius: 999px; margin-left: 7px; vertical-align: middle;
        }
        .tet-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #10b981; flex-shrink: 0;
          animation: tet-pulse 2.4s ease-in-out infinite;
        }
        .tet-input:focus { border-color: rgba(212,168,83,0.45) !important; outline: none; }
        .tet-score-track { display: flex; align-items: center; gap: 12px; padding-top: 4px; }
        .tet-score-val   { font-size: 22px; font-weight: 700; color: #d4a853; font-variant-numeric: tabular-nums; min-width: 32px; }

        @keyframes tet-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.82); }
        }
        @media (max-width: 640px) {
          .tet-config-row { grid-template-columns: 1fr; gap: 6px; }
          .tet-config-key { padding-top: 0; }
        }
      `}</style>

      {/* ── Unsaved changes banner (fixed, above page content) ── */}
      <AnimatePresence>
        {isDirty && (
          <UnsavedBanner
            count={pendingKeys.length}
            onSave={() => setModal('save')}
            onDiscard={() => setModal('discard')}
          />
        )}
      </AnimatePresence>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.015em' }}>
          Settings
        </h1>
        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--t3)' }}>
          Configure article generation and publication defaults.
        </p>
      </div>

      {/* ── Editable Configuration ── */}
      <div className="tet-panel">
        <div className="tet-panel-header">
          <span className="tet-section-label">Configuration</span>
        </div>

        {/* Quality score threshold */}
        <div className="tet-config-row">
          <div className="tet-config-key">
            <div>Min Quality Score</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px' }}>Articles below this get revised (70–90)</div>
          </div>
          <div>
            <div className="tet-score-track">
              <span className="tet-score-val">{loaded ? draft.quality_score_threshold : '—'}</span>
              <input
                type="range" min="70" max="90" step="1"
                value={draft.quality_score_threshold || '85'}
                disabled={!loaded}
                onChange={e => handleChange('quality_score_threshold', e.target.value)}
                style={{ flex: 1, accentColor: '#d4a853', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Target article length */}
        <div className="tet-config-row">
          <div className="tet-config-key">
            <div>Target Article Length</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px' }}>Short: ~600w · Standard: ~750w · Long: ~900w</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', flexWrap: 'wrap' }}>
            {['short', 'standard', 'long'].map(opt => (
              <button
                key={opt}
                disabled={!loaded}
                onClick={() => handleChange('target_article_length', opt)}
                style={{
                  padding: '7px 16px', borderRadius: '5px', border: '1px solid',
                  cursor: loaded ? 'pointer' : 'not-allowed',
                  fontSize: '12.5px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                  textTransform: 'capitalize', transition: 'all 0.12s',
                  background: draft.target_article_length === opt ? '#d4a853' : 'var(--input-bg)',
                  color:      draft.target_article_length === opt ? '#0c0b0a' : 'var(--t2)',
                  borderColor: draft.target_article_length === opt ? '#d4a853' : 'var(--input-border)',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Failure notification email */}
        <div className="tet-config-row">
          <div className="tet-config-key">
            <div>Failure Notification Email</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px' }}>Alert on generation failure (optional)</div>
          </div>
          <input
            type="email"
            className="tet-input"
            placeholder="you@example.com"
            value={draft.notification_email || ''}
            disabled={!loaded}
            onChange={e => handleChange('notification_email', e.target.value)}
            style={{ ...inputStyle, marginTop: '4px' }}
          />
        </div>

        {/* Site tagline */}
        <div className="tet-config-row">
          <div className="tet-config-key">
            <div>Site Tagline</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px' }}>Shown in footer and meta</div>
          </div>
          <input
            type="text"
            className="tet-input"
            placeholder="Your tagline…"
            value={draft.site_tagline || ''}
            disabled={!loaded}
            onChange={e => handleChange('site_tagline', e.target.value)}
            style={{ ...inputStyle, marginTop: '4px' }}
          />
        </div>

        {/* Social links */}
        <div className="tet-config-row">
          <div className="tet-config-key">
            <div>Social Links</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px' }}>X, Facebook, Instagram</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
            {[
              { key: 'social_x',        placeholder: 'X / Twitter URL or handle' },
              { key: 'social_facebook',  placeholder: 'Facebook page URL' },
              { key: 'social_instagram', placeholder: 'Instagram handle' },
            ].map(({ key, placeholder }) => (
              <input
                key={key}
                type="text"
                className="tet-input"
                placeholder={placeholder}
                value={draft[key] || ''}
                disabled={!loaded}
                onChange={e => handleChange(key, e.target.value)}
                style={inputStyle}
              />
            ))}
          </div>
        </div>

        {/* Pinned categories */}
        <div className="tet-config-row">
          <div className="tet-config-key">
            <div>Pinned Categories</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px' }}>Comma-separated, e.g. AI, Tech, Policy</div>
          </div>
          <input
            type="text"
            className="tet-input"
            placeholder="AI, Tech, Business…"
            value={draft.pinned_categories || ''}
            disabled={!loaded}
            onChange={e => handleChange('pinned_categories', e.target.value)}
            style={{ ...inputStyle, marginTop: '4px' }}
          />
        </div>
      </div>

      {/* ── Visual separator ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 16px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--divider)' }} />
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)' }}>
          System Information
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--divider)' }} />
      </div>

      {/* System status */}
      <div className="tet-panel">
        <div className="tet-panel-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="tet-status-dot" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>System Active</span>
          <span style={{ fontSize: '11.5px', color: 'var(--t3)', marginLeft: 'auto' }}>Sharpable News Admin v1.0</span>
        </div>
      </div>

      {/* Pipeline configuration */}
      <div className="tet-panel">
        <div className="tet-panel-header">
          <span className="tet-section-label">Pipeline Configuration</span>
        </div>
        {SYS_CONFIG_ROWS.map((row, i) => (
          <div key={i} className="tet-config-row">
            <div className="tet-config-key">{row.label}</div>
            <div className="tet-config-val">{row.value}</div>
          </div>
        ))}
      </div>

      {/* Pipeline agents */}
      <div className="tet-panel">
        <div className="tet-panel-header">
          <span className="tet-section-label">AI Pipeline Agents</span>
        </div>
        {PIPELINE_AGENTS.map((agent) => (
          <div key={agent.key} className="tet-agent-row"
            style={{ background: agent.optional ? 'var(--optional-bg)' : undefined }}>
            <div className="tet-agent-num">{agent.num}</div>
            <div>
              <div className="tet-agent-label">
                {agent.label}
                {agent.optional && <span className="tet-optional-badge">Optional</span>}
              </div>
              <div className="tet-agent-desc">{agent.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div style={{
        padding: '14px 20px',
        background: 'var(--chip-bg)', border: '1px solid var(--chip-border)',
        borderLeft: '3px solid rgba(212,168,83,0.4)',
        borderRadius: '7px', fontSize: '12.5px', color: 'var(--t3)', lineHeight: 1.6,
      }}>
        API keys, advanced cost limits, and auto-generation schedules are configured via the{' '}
        <code style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--t2)', background: 'var(--chip-bg)', padding: '1px 5px', borderRadius: '3px' }}>.env.local</code> file.
      </div>
    </motion.div>
  )
}
