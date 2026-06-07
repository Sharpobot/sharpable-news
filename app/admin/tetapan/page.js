'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

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

const CONFIG_ROWS = [
  { label: 'AI Model',             value: 'claude-sonnet-4-5' },
  { label: 'Provider',             value: 'Anthropic' },
  { label: 'Total Agents',         value: '7 required + 1 optional' },
  { label: 'Delay Between Agents', value: '65 seconds' },
  { label: 'Generation Time (est.)', value: '~9–10 minutes' },
  { label: 'Retries',              value: 'Topic: max 3x · Inngest: 1x' },
  { label: 'Storage',              value: 'Supabase Postgres + Storage' },
  { label: 'Job Queue',            value: 'Inngest v4' },
]

export default function TetapanPage() {
  const [lm, setLm] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('admin-theme') || 'dark'
    setLm(saved === 'light')
    const handler = (e) => setLm(e.detail === 'light')
    window.addEventListener('admin-theme-change', handler)
    return () => window.removeEventListener('admin-theme-change', handler)
  }, [])

  const vars = lm ? `
    --bg: #f5f3f0; --surface: #ffffff; --surface2: #f0ede9;
    --border: rgba(24,21,15,0.09); --divider: rgba(24,21,15,0.06);
    --t1: #18150f; --t2: #6b6560; --t3: #a8a29e;
    --surface-shadow: 0 1px 3px rgba(24,21,15,0.07); --surface-inset: none;
    --chip-bg: rgba(24,21,15,0.05); --chip-border: rgba(24,21,15,0.1);
    --optional-bg: rgba(24,21,15,0.04);
  ` : `
    --bg: #0c0b0a; --surface: #0f0e0d; --surface2: #131110;
    --border: rgba(237,232,223,0.07); --divider: rgba(237,232,223,0.05);
    --t1: #ede8df; --t2: #8c857c; --t3: #3d3830;
    --surface-shadow: none; --surface-inset: inset 0 1px 0 rgba(237,232,223,0.04);
    --chip-bg: rgba(237,232,223,0.04); --chip-border: rgba(237,232,223,0.07);
    --optional-bg: rgba(237,232,223,0.02);
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
          display: flex; align-items: center; gap: '10px';
        }
        .tet-section-label {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.13em; text-transform: uppercase;
          color: var(--t3);
        }
        .tet-config-row {
          display: grid; grid-template-columns: 180px 1fr;
          padding: 11px 20px; gap: 16px; align-items: center;
          border-bottom: 1px solid var(--divider);
        }
        .tet-config-row:last-child { border-bottom: none; }
        .tet-config-key {
          font-size: 12.5px; color: var(--t3);
        }
        .tet-config-val {
          font-size: 13px; color: var(--t1);
          font-variant-numeric: tabular-nums;
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
          min-width: 22px; padding-top: 2px;
          flex-shrink: 0;
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
        @keyframes tet-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.82); }
        }

        @media (max-width: 640px) {
          .tet-config-row { grid-template-columns: 1fr; gap: 4px; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.015em' }}>
          Settings
        </h1>
        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--t3)' }}>
          Configuration and system information for Sharpable News.
        </p>
      </div>

      {/* System status */}
      <div className="tet-panel">
        <div className="tet-panel-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="tet-status-dot" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>System Active</span>
          <span style={{ fontSize: '11.5px', color: 'var(--t3)', marginLeft: 'auto' }}>Sharpable News Admin v1.0</span>
        </div>
      </div>

      {/* Configuration */}
      <div className="tet-panel">
        <div className="tet-panel-header">
          <span className="tet-section-label">Pipeline Configuration</span>
        </div>
        {CONFIG_ROWS.map((row, i) => (
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
        Advanced settings (API keys, auto-generation schedule, cost limits) are configured via the <code style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--t2)', background: 'var(--chip-bg)', padding: '1px 5px', borderRadius: '3px' }}>.env.local</code> file.
      </div>
    </motion.div>
  )
}
