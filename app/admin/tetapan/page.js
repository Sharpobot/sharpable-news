'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'

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
  default_author_id:       '',
  notification_email:      '',
  site_tagline:            'Berita AI & Teknologi untuk Malaysia',
  social_x:                '',
  social_facebook:         '',
  social_instagram:        '',
  pinned_categories:       '',
}

export default function TetapanPage() {
  const [lm, setLm] = useState(false)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  /* ── Theme ── */
  useEffect(() => {
    const saved = localStorage.getItem('admin-theme') || 'dark'
    setLm(saved === 'light')
    const handler = (e) => setLm(e.detail === 'light')
    window.addEventListener('admin-theme-change', handler)
    return () => window.removeEventListener('admin-theme-change', handler)
  }, [])

  /* ── Load settings from DB ── */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) return
        const data = await res.json()
        if (data && typeof data === 'object') {
          setSettings(prev => ({ ...prev, ...data }))
        }
      } catch { /* use defaults */ }
      setLoaded(true)
    }
    load()
  }, [])

  /* ── Save a single key on change ── */
  const saveSetting = useCallback(async (key, value) => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Setting saved', { duration: 1800, style: { fontSize: '13px' } })
    } catch {
      toast.error('Could not save setting')
    } finally {
      setSaving(false)
    }
  }, [])

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleBlur = (key) => {
    saveSetting(key, settings[key])
  }

  const vars = lm ? `
    --bg: #f5f3f0; --surface: #ffffff; --surface2: #f0ede9;
    --border: rgba(24,21,15,0.09); --divider: rgba(24,21,15,0.06);
    --t1: #18150f; --t2: #6b6560; --t3: #a8a29e;
    --surface-shadow: 0 1px 3px rgba(24,21,15,0.07); --surface-inset: none;
    --chip-bg: rgba(24,21,15,0.05); --chip-border: rgba(24,21,15,0.1);
    --optional-bg: rgba(24,21,15,0.04);
    --input-bg: #f8f7f5; --input-border: rgba(24,21,15,0.12);
  ` : `
    --bg: #0c0b0a; --surface: #0f0e0d; --surface2: #131110;
    --border: rgba(237,232,223,0.07); --divider: rgba(237,232,223,0.05);
    --t1: #ede8df; --t2: #8c857c; --t3: #3d3830;
    --surface-shadow: none; --surface-inset: inset 0 1px 0 rgba(237,232,223,0.04);
    --chip-bg: rgba(237,232,223,0.04); --chip-border: rgba(237,232,223,0.07);
    --optional-bg: rgba(237,232,223,0.02);
    --input-bg: rgba(237,232,223,0.04); --input-border: rgba(237,232,223,0.1);
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
      <Toaster position="bottom-right" />
      <style>{`
        .admin-page-content { ${vars} }

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
        .tet-config-key {
          font-size: 12.5px; color: var(--t2); padding-top: 9px;
        }
        .tet-config-val {
          font-size: 13px; color: var(--t1);
          font-variant-numeric: tabular-nums; padding-top: 9px;
        }
        .tet-agent-row {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 12px 20px;
          border-bottom: 1px solid var(--divider);
          transition: background 0.1s;
        }
        .tet-agent-row:last-child { border-bottom: none; }
        .tet-agent-row:hover { background: var(--chip-bg); }
        .tet-agent-num {
          font-size: 10px; font-weight: 700; color: var(--t3);
          font-variant-numeric: tabular-nums;
          min-width: 22px; padding-top: 2px; flex-shrink: 0;
        }
        .tet-agent-label {
          font-size: 13.5px; font-weight: 600; color: var(--t1);
          line-height: 1.3; margin-bottom: 2px;
        }
        .tet-agent-desc {
          font-size: 12px; color: var(--t3); line-height: 1.4;
        }
        .tet-optional-badge {
          display: inline-flex; align-items: center;
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--t3);
          background: var(--chip-bg); border: 1px solid var(--chip-border);
          padding: 1px 7px; border-radius: 999px; margin-left: 7px;
          vertical-align: middle;
        }
        .tet-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #10b981; flex-shrink: 0;
          animation: tet-pulse 2.4s ease-in-out infinite;
        }
        .tet-input:focus {
          border-color: rgba(212,168,83,0.45) !important;
          outline: none;
        }
        .tet-score-track {
          display: flex; align-items: center; gap: 12px; padding-top: 4px;
        }
        .tet-score-val {
          font-size: 22px; font-weight: 700; color: #d4a853;
          font-variant-numeric: tabular-nums; min-width: 32px;
        }
        @keyframes tet-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.82); }
        }
        @media (max-width: 640px) {
          .tet-config-row { grid-template-columns: 1fr; gap: 6px; }
          .tet-config-key { padding-top: 0; }
        }
      `}</style>

      {/* Header */}
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
          {saving && <span style={{ fontSize: '11px', color: '#d4a853', marginLeft: 'auto' }}>Saving…</span>}
        </div>

        {/* Quality score threshold */}
        <div className="tet-config-row">
          <div className="tet-config-key">
            <div>Min Quality Score</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px' }}>Articles below this score get revised (70–90)</div>
          </div>
          <div>
            <div className="tet-score-track">
              <span className="tet-score-val">{loaded ? settings.quality_score_threshold : '—'}</span>
              <input
                type="range" min="70" max="90" step="1"
                value={settings.quality_score_threshold || '85'}
                disabled={!loaded}
                onChange={e => handleChange('quality_score_threshold', e.target.value)}
                onMouseUp={e => saveSetting('quality_score_threshold', e.target.value)}
                onTouchEnd={e => saveSetting('quality_score_threshold', e.target.value)}
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
                onClick={() => { handleChange('target_article_length', opt); saveSetting('target_article_length', opt) }}
                style={{
                  padding: '7px 16px', borderRadius: '5px', border: '1px solid',
                  cursor: loaded ? 'pointer' : 'not-allowed',
                  fontSize: '12.5px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                  textTransform: 'capitalize', transition: 'all 0.12s',
                  background: settings.target_article_length === opt ? '#d4a853' : 'var(--input-bg)',
                  color:      settings.target_article_length === opt ? '#0c0b0a' : 'var(--t2)',
                  borderColor: settings.target_article_length === opt ? '#d4a853' : 'var(--input-border)',
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
            value={settings.notification_email || ''}
            disabled={!loaded}
            onChange={e => handleChange('notification_email', e.target.value)}
            onBlur={() => handleBlur('notification_email')}
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
            value={settings.site_tagline || ''}
            disabled={!loaded}
            onChange={e => handleChange('site_tagline', e.target.value)}
            onBlur={() => handleBlur('site_tagline')}
            style={{ ...inputStyle, marginTop: '4px' }}
          />
        </div>

        {/* Social links */}
        <div className="tet-config-row">
          <div className="tet-config-key">
            <div>Social Links</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px' }}>X, Facebook, Instagram handles</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
            {[
              { key: 'social_x',         placeholder: 'X / Twitter URL or handle' },
              { key: 'social_facebook',   placeholder: 'Facebook page URL' },
              { key: 'social_instagram',  placeholder: 'Instagram handle' },
            ].map(({ key, placeholder }) => (
              <input
                key={key}
                type="text"
                className="tet-input"
                placeholder={placeholder}
                value={settings[key] || ''}
                disabled={!loaded}
                onChange={e => handleChange(key, e.target.value)}
                onBlur={() => handleBlur(key)}
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
            value={settings.pinned_categories || ''}
            disabled={!loaded}
            onChange={e => handleChange('pinned_categories', e.target.value)}
            onBlur={() => handleBlur('pinned_categories')}
            style={{ ...inputStyle, marginTop: '4px' }}
          />
        </div>
      </div>

      {/* ── Visual separator ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        margin: '20px 0 16px',
      }}>
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
        background: 'var(--chip-bg)',
        border: '1px solid var(--chip-border)',
        borderLeft: '3px solid rgba(212,168,83,0.4)',
        borderRadius: '7px',
        fontSize: '12.5px', color: 'var(--t3)', lineHeight: 1.6,
      }}>
        API keys, advanced cost limits, and auto-generation schedules are configured via the{' '}
        <code style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--t2)', background: 'var(--chip-bg)', padding: '1px 5px', borderRadius: '3px' }}>.env.local</code> file.
      </div>
    </motion.div>
  )
}
