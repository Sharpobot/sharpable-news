'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  image_count_min:         '3',
  image_count_max:         '5',
  editorial_instructions:  '',
}

const EDITORIAL_GUIDELINES_DEFAULT = `PANDUAN GAYA — SHARPABLE NEWS

Struktur artikel (5 bahagian):
1. Hook — dibuka dengan individu bernama sebenar + petikan langsung dalam 2 perenggan pertama
2. Fakta & Konteks — latar belakang dan maklumat penting
3. Impak Tempatan — kesan kepada pembaca Malaysia
4. Soalan Kritikal — isu atau persoalan yang timbul
5. Penutup — kembali kepada individu yang disebut di bahagian Hook (bookending)

Panjang: 700–900 patah perkataan
Subtajuk: 3–5 (H2), setiap satu deskriptif dan spesifik
Tajuk: 3 pilihan, masing-masing bawah 70 aksara

Frasa yang dilarang:
- "Dalam era digital ini"
- "Tidak dapat dinafikan"
- "Hal ini demikian kerana"

Nada: Bahasa Malaysia gaya berita BERNAMA/Astro AWANI — formal, tepat, dan mudah difahami oleh penyelidik, pembangun, dan pembuat keputusan di Malaysia.`

/* ── Dual-handle range slider ── */
function DualRangeSlider({ min, max, valueMin, valueMax, onChange, disabled }) {
  const range = max - min
  const pctMin = ((valueMin - min) / range) * 100
  const pctMax = ((valueMax - min) / range) * 100

  const handleMinChange = (e) => {
    const v = Math.min(Number(e.target.value), valueMax - 1)
    onChange(v, valueMax)
  }
  const handleMaxChange = (e) => {
    const v = Math.max(Number(e.target.value), valueMin + 1)
    onChange(valueMin, v)
  }

  return (
    <div className="tet-dual-range">
      <div className="tet-dual-range-track" />
      <div className="tet-dual-range-fill" style={{ left: `${pctMin}%`, width: `${pctMax - pctMin}%` }} />
      <input
        type="range" min={min} max={max} step="1"
        value={valueMin} disabled={disabled}
        onChange={handleMinChange}
        aria-label="Minimum body images"
      />
      <input
        type="range" min={min} max={max} step="1"
        value={valueMax} disabled={disabled}
        onChange={handleMaxChange}
        aria-label="Maximum body images"
      />
    </div>
  )
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
  const router = useRouter()
  const [lm, setLm] = useState(false)
  /* saved = what's in DB; draft = what admin is editing */
  const [saved,  setSaved]  = useState(DEFAULT_SETTINGS)
  const [draft,  setDraft]  = useState(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modal,  setModal]  = useState(null)   // 'save' | 'discard' | 'leave'
  const [pendingNavUrl, setPendingNavUrl] = useState(null)

  /* Ref so navigation guard closure always sees current dirty state */
  const isDirtyRef = useRef(false)

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

  /* ── Keep dirty ref in sync ── */
  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])

  /* ── Navigation guard (browser close + in-app links) ── */
  useEffect(() => {
    // 1. Warn on tab close / refresh
    const onBeforeUnload = (e) => {
      if (!isDirtyRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }

    // 2. Intercept all <a> clicks at capture phase before Next.js handles them
    const onLinkClick = (e) => {
      if (!isDirtyRef.current) return
      const anchor = e.target.closest('a[href]')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      // Ignore external, hash-only, or blank-target links
      if (!href || href.startsWith('http') || href.startsWith('mailto') ||
          href.startsWith('#') || anchor.target === '_blank') return
      e.preventDefault()
      e.stopPropagation()
      setPendingNavUrl(href)
      setModal('leave')
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onLinkClick, true) // capture = before React
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onLinkClick, true)
    }
  }, []) // mount/unmount once — dirty state read via ref

  /* ── Confirm leave without saving ── */
  const handleConfirmLeave = useCallback(() => {
    const url = pendingNavUrl
    setModal(null)
    setPendingNavUrl(null)
    if (url) router.push(url)
  }, [pendingNavUrl, router])

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
    --t1: #ede8df; --t2: #a39c92; --t3: #6f6862;
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
      <ConfirmationModal
        open={modal === 'leave'}
        title="Leave Without Saving?"
        message={`You have ${pendingKeys.length} unsaved ${pendingKeys.length === 1 ? 'change' : 'changes'}. They will be lost if you leave this page.`}
        confirmLabel="Leave Without Saving"
        cancelLabel="Stay & Keep Editing"
        confirmColor="red"
        onConfirm={handleConfirmLeave}
        onCancel={() => { setModal(null); setPendingNavUrl(null) }}
      />

      <style>{`
        .admin-page-content { ${vars} }

        /* Banner responsive overrides — !important overrides inline style on fixed div */
        @media (max-width: 768px) {
          /* top:48px matches the mobile topbar height, closing the gap above the banner */
          .settings-banner {
            left: 0 !important;
            top: 48px !important;
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
        .tet-key-title {
          display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
        }
        .tet-soon-badge {
          display: inline-flex; align-items: center;
          font-size: 9px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--t3);
          background: var(--chip-bg); border: 1px solid var(--chip-border);
          padding: 1px 7px; border-radius: 999px; vertical-align: middle;
          opacity: 0.85;
        }
        .tet-soon-note {
          font-size: 11px; color: var(--t3); margin-top: 6px; font-style: italic;
        }
        .tet-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #10b981; flex-shrink: 0;
          animation: tet-pulse 2.4s ease-in-out infinite;
        }
        .tet-input:focus { border-color: rgba(212,168,83,0.45) !important; outline: none; }
        .tet-score-track { display: flex; align-items: center; gap: 12px; padding-top: 4px; }
        .tet-score-val   { font-size: 22px; font-weight: 700; color: #d4a853; font-variant-numeric: tabular-nums; min-width: 32px; }

        /* Dual-handle range slider */
        .tet-dual-range {
          position: relative;
          height: 28px;
          display: flex;
          align-items: center;
        }
        .tet-dual-range-track {
          position: absolute;
          left: 0; right: 0;
          height: 4px;
          border-radius: 2px;
          background: var(--input-border);
        }
        .tet-dual-range-fill {
          position: absolute;
          height: 4px;
          border-radius: 2px;
          background: #d4a853;
          transition: left 0.08s, width 0.08s;
        }
        .tet-dual-range input[type="range"] {
          position: absolute;
          left: 0;
          width: 100%;
          height: 28px;
          margin: 0;
          background: transparent;
          -webkit-appearance: none;
          appearance: none;
          pointer-events: none;
        }
        .tet-dual-range input[type="range"]::-webkit-slider-runnable-track { background: transparent; }
        .tet-dual-range input[type="range"]::-moz-range-track { background: transparent; }
        .tet-dual-range input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          pointer-events: auto;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #d4a853;
          border: 2px solid var(--surface);
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s;
        }
        .tet-dual-range input[type="range"]:disabled::-webkit-slider-thumb { cursor: not-allowed; opacity: 0.5; }
        .tet-dual-range input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.18); }
        .tet-dual-range input[type="range"]::-moz-range-thumb {
          pointer-events: auto;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #d4a853;
          border: 2px solid var(--surface);
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s;
        }
        .tet-dual-range input[type="range"]:disabled::-moz-range-thumb { cursor: not-allowed; opacity: 0.5; }
        .tet-dual-range input[type="range"]::-moz-range-thumb:hover { transform: scale(1.18); }
        .tet-dual-range-labels {
          display: flex; justify-content: space-between;
          font-size: 11px; color: var(--t3); margin-top: 6px;
          font-variant-numeric: tabular-nums;
        }

        /* Editorial instructions textarea */
        .tet-textarea {
          resize: vertical;
          min-height: 180px;
          line-height: 1.6;
          font-family: 'DM Sans', sans-serif;
        }
        .tet-textarea::placeholder { color: var(--t3); opacity: 0.7; white-space: pre-wrap; }

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
            <div className="tet-key-title">Min Quality Score<span className="tet-soon-badge">Coming soon</span></div>
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
            <div className="tet-soon-note">This setting is not yet active.</div>
          </div>
        </div>

        {/* Target article length */}
        <div className="tet-config-row">
          <div className="tet-config-key">
            <div>Target Article Length</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px' }}>Brief: ~600w · Standard: ~750w · Detailed: ~900w</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', flexWrap: 'wrap' }}>
            {['brief', 'standard', 'detailed'].map(opt => (
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
            <div className="tet-key-title">Failure Notification Email<span className="tet-soon-badge">Coming soon</span></div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px' }}>Alert on generation failure (optional)</div>
          </div>
          <div>
            <input
              type="email"
              className="tet-input"
              placeholder="you@example.com"
              value={draft.notification_email || ''}
              disabled={!loaded}
              onChange={e => handleChange('notification_email', e.target.value)}
              style={{ ...inputStyle, marginTop: '4px' }}
            />
            <div className="tet-soon-note">This setting is not yet active.</div>
          </div>
        </div>

        {/* Site tagline */}
        <div className="tet-config-row">
          <div className="tet-config-key">
            <div className="tet-key-title">Site Tagline<span className="tet-soon-badge">Coming soon</span></div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px' }}>Shown in footer and meta</div>
          </div>
          <div>
            <input
              type="text"
              className="tet-input"
              placeholder="Your tagline…"
              value={draft.site_tagline || ''}
              disabled={!loaded}
              onChange={e => handleChange('site_tagline', e.target.value)}
              style={{ ...inputStyle, marginTop: '4px' }}
            />
            <div className="tet-soon-note">This setting is not yet active.</div>
          </div>
        </div>

        {/* Social links */}
        <div className="tet-config-row">
          <div className="tet-config-key">
            <div className="tet-key-title">Social Links<span className="tet-soon-badge">Coming soon</span></div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px' }}>X, Facebook, Instagram</div>
          </div>
          <div>
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
            <div className="tet-soon-note">This setting is not yet active.</div>
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

        {/* Body images per article */}
        <div className="tet-config-row">
          <div className="tet-config-key">
            <div>Body Images Per Article</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px' }}>Number of inline images generated per article</div>
          </div>
          <div>
            <DualRangeSlider
              min={1} max={8}
              valueMin={Number(draft.image_count_min ?? 3)}
              valueMax={Number(draft.image_count_max ?? 5)}
              disabled={!loaded}
              onChange={(lo, hi) => {
                handleChange('image_count_min', String(lo))
                handleChange('image_count_max', String(hi))
              }}
            />
            <div className="tet-dual-range-labels">
              <span>Min: {loaded ? draft.image_count_min : '—'}</span>
              <span>Max: {loaded ? draft.image_count_max : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Editorial instructions */}
      <div className="tet-panel">
        <div className="tet-panel-header">
          <span className="tet-section-label">Editorial Instructions</span>
          <span className="tet-soon-badge">Coming soon</span>
        </div>
        <div style={{ padding: '14px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '10px', lineHeight: 1.5 }}>
            Custom instructions injected into article generation. Changes apply to new generations only.
          </div>
          <textarea
            className="tet-input tet-textarea"
            placeholder={EDITORIAL_GUIDELINES_DEFAULT}
            value={draft.editorial_instructions || ''}
            disabled={!loaded}
            onChange={e => handleChange('editorial_instructions', e.target.value)}
            rows={12}
            style={inputStyle}
          />
          <div className="tet-soon-note">This setting is not yet active.</div>
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
