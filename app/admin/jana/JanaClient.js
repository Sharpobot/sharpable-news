'use client'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmationModal from '@/components/admin/ConfirmationModal'

/* ── Agent definitions ─────────────────────────────────────── */
const SEARCH_AGENTS = [
  { key: 'trend-scout',    label: 'Trend Scout',    optional: false },
  { key: 'topic-selector', label: 'Topic Selector', optional: false },
]
const AGENTS = [
  { key: 'trend-scout',     label: 'Trend Scout',      optional: false },
  { key: 'topic-selector',  label: 'Topic Selector',   optional: false },
  { key: 'deep-researcher', label: 'Researcher',       optional: false },
  { key: 'article-writer',  label: 'Article Writer',   optional: false },
  { key: 'seo-metadata',    label: 'SEO Metadata',     optional: false },
  { key: 'image-brief',     label: 'Image Brief',      optional: false },
  { key: 'quality-checker', label: 'Quality Checker',  optional: false },
  { key: 'revision-agent',  label: 'Revision Agent',   optional: true  },
  { key: 'save-article',    label: 'Save Article',     optional: false },
]
const REQUIRED = AGENTS.filter(a => !a.optional)

/* ── Spinner ───────────────────────────────────────────────── */
function Spinner({ size = 12 }) {
  return (
    <span style={{
      display: 'inline-block', width: `${size}px`, height: `${size}px`,
      border: '1.5px solid rgba(212,168,83,0.2)', borderTopColor: '#d4a853',
      borderRadius: '50%', animation: 'jana-spin 0.75s linear infinite', flexShrink: 0,
    }} />
  )
}

/* ── AgentRow ──────────────────────────────────────────────── */
function AgentRow({ agent, row }) {
  const s = row?.status
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '4px 8px', borderRadius: '5px',
      background: s === 'running' ? 'var(--agent-active-bg)' : 'transparent',
    }}>
      <span style={{ width: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {s === 'running' ? <Spinner size={11} /> :
         s === 'done'    ? <span style={{ color: '#10b981', fontSize: '12px' }}>✓</span> :
         s === 'failed'  ? <span style={{ color: '#ef4444', fontSize: '12px' }}>✗</span> :
                           <span style={{ color: 'var(--agent-idle)', fontSize: '12px' }}>○</span>}
      </span>
      <span style={{
        fontSize: '12.5px', minWidth: '130px',
        color: s === 'running' ? '#f0c040' : s === 'done' ? 'var(--t2)' : s === 'failed' ? '#ef4444' : 'var(--agent-idle)',
        fontWeight: s === 'running' ? 600 : 400,
      }}>
        {agent.label}
        {agent.optional && <span style={{ fontSize: '10px', color: 'var(--t3)', marginLeft: '5px' }}>(optional)</span>}
      </span>
      {row?.message && (
        <span style={{ fontSize: '11.5px', color: 'var(--t3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.message}
        </span>
      )}
    </div>
  )
}

/* ── TopicCard ─────────────────────────────────────────────── */
function TopicCard({ option, onInitiateSelect, selecting, isSelected, isGreyedOut }) {
  const isLocked = isSelected || isGreyedOut
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      onMouseEnter={() => { if (!isLocked) setHovered(true) }}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected ? 'rgba(212,168,83,0.04)' : hovered ? 'var(--surface2)' : 'var(--card-inner)',
        border: isSelected
          ? '1.5px solid rgba(212,168,83,0.55)'
          : `1px solid ${hovered && !isLocked ? 'rgba(212,168,83,0.3)' : 'var(--border)'}`,
        boxShadow: isSelected ? '0 0 0 3px rgba(212,168,83,0.1)' : 'none',
        borderRadius: '8px', padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        cursor: isLocked ? 'default' : 'pointer',
        transition: 'background 0.15s, border-color 0.15s, opacity 0.2s, box-shadow 0.15s',
        opacity: isGreyedOut ? 0.28 : 1,
        flex: '1 1 0', minWidth: '220px',
      }}
    >
      {/* Badges row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{
          padding: '2px 8px', borderRadius: '3px',
          background: 'rgba(212,168,83,0.1)', color: '#d4a853',
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {option.category}
        </span>
        {isSelected && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            padding: '2px 8px', borderRadius: '3px',
            background: '#d4a853', color: '#0c0b0a',
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            ✓ Selected
          </span>
        )}
      </div>

      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--t1)', lineHeight: 1.35 }}>
        {option.topic}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--topic-desc)', lineHeight: 1.55, flex: 1 }}>
        {option.summary}
      </div>

      {option.sourceName && (
        <a
          href={option.sourceUrl || '#'}
          target={option.sourceUrl ? '_blank' : undefined}
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            fontSize: '11px', color: 'var(--topic-source)', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '4px',
            transition: 'color 0.12s',
            pointerEvents: isGreyedOut ? 'none' : 'auto',
          }}
          onMouseEnter={e => { if (!isGreyedOut) e.currentTarget.style.color = '#d4a853' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--topic-source)' }}
        >
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          {option.sourceName}
        </a>
      )}

      {!isLocked && (
        <button
          onClick={() => onInitiateSelect(option)}
          disabled={selecting}
          style={{
            marginTop: '2px', padding: '8px 0', borderRadius: '6px', border: 'none',
            background: selecting ? 'rgba(212,168,83,0.2)' : '#d4a853',
            color: selecting ? '#8c6a2a' : '#0c0b0a',
            fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 700,
            cursor: selecting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'background 0.12s',
          }}
        >
          {selecting ? <><Spinner size={12} /> Starting…</> : 'Select This Topic'}
        </button>
      )}
    </motion.div>
  )
}

/* ── ArticleCard ───────────────────────────────────────────── */
function ArticleCard({
  card,
  topicOptions,
  progressRows,
  status,
  selectingId,
  onTopicDirectionChange,
  onSearch,
  onInitiateSelectTopic,
  onAutoSelect,
  onOpenCancel,
  onDismiss,
  onRetry,
}) {
  const { localId, articleId, topicDirection, isSearching, selectedOption } = card

  // Build progress lookup
  const progMap = {}
  progressRows.forEach(r => { if (!progMap[r.agent_name]) progMap[r.agent_name] = r })

  // Derived state flags
  const isPending             = !articleId && !isSearching
  const isSearchingBeforeId   = !articleId && isSearching
  const isAwaitingSelection   = status === 'awaiting_topic_selection'
  const isGenerating          = status === 'generating'
  const isReadyToReview       = status === 'ready_to_review'
  const isFailed              = status === 'failed'
  const isTerminal            = isReadyToReview || isFailed
  const hasOptions            = topicOptions && topicOptions.length > 0
  const searchLocked          = isSearchingBeforeId || isAwaitingSelection || isGenerating
  const selecting             = selectingId === articleId

  // Progress stats (for generating/terminal)
  const revRan    = !!progMap['revision-agent']
  const total     = revRan ? AGENTS.length : REQUIRED.length
  const done      = AGENTS.filter(a => progMap[a.key]?.status === 'done').length
  const reqDone   = REQUIRED.filter(a => progMap[a.key]?.status === 'done').length
  const anyFailed = AGENTS.some(a => progMap[a.key]?.status === 'failed')
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0

  // Section visibility — keep topic direction visible (read-only) from first search through completion
  const hasStartedFlow  = !!articleId || isSearching
  const showSearchSection = !isTerminal && (isPending || hasStartedFlow)
  const showTopicCards    = (isAwaitingSelection && hasOptions) || ((isGenerating || isTerminal) && topicOptions && topicOptions.length > 0)
  const showSearchMini    = isAwaitingSelection && !hasOptions
  const showProgress      = isGenerating || isTerminal

  // Card title — topic direction, then selected topic, then generic label (never expose raw ID)
  const cardTitle = topicDirection.trim() || selectedOption?.topic || 'New Article'

  // Border/background accent by state
  const cardBorderColor = isReadyToReview
    ? 'rgba(16,185,129,0.3)'
    : isFailed
    ? 'rgba(239,68,68,0.22)'
    : 'var(--border)'
  const cardHeaderBg = isReadyToReview
    ? 'rgba(16,185,129,0.05)'
    : isFailed
    ? 'rgba(239,68,68,0.04)'
    : 'var(--surface2)'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${cardBorderColor}`,
        borderRadius: '10px',
        marginBottom: '14px',
        overflow: 'hidden',
        boxShadow: 'var(--surface-shadow), var(--surface-inset)',
      }}
    >
      {/* ── Card header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '11px 16px',
        background: cardHeaderBg,
        borderBottom: `1px solid var(--divider)`,
      }}>
        {/* Status indicator */}
        {(isPending) && (
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--t3)', display: 'inline-block', flexShrink: 0 }} />
        )}
        {(isSearchingBeforeId || (isAwaitingSelection && !hasOptions)) && <Spinner size={11} />}
        {isAwaitingSelection && hasOptions && (
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#d4a853', display: 'inline-block', flexShrink: 0 }} />
        )}
        {isGenerating && <Spinner size={11} />}
        {isReadyToReview && <span style={{ color: '#10b981', fontSize: '13px', flexShrink: 0 }}>✓</span>}
        {isFailed && <span style={{ color: '#ef4444', fontSize: '13px', flexShrink: 0 }}>✗</span>}

        {/* Title */}
        <span style={{
          fontSize: '13px', fontWeight: 700, color: 'var(--t1)',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {cardTitle}
        </span>

        {/* Right-side chips/buttons */}
        {(isSearchingBeforeId || (isAwaitingSelection && !hasOptions)) && (
          <button
            onClick={() => isSearchingBeforeId ? onDismiss(localId) : onOpenCancel(localId, articleId)}
            title="Cancel"
            style={{
              background: 'none', border: 'none', color: 'var(--t3)',
              padding: '0 2px', cursor: 'pointer', lineHeight: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        )}
        {isGenerating && (
          <>
            <span style={{ fontSize: '11px', color: '#d4a853', fontVariantNumeric: 'tabular-nums', fontWeight: 700, flexShrink: 0 }}>
              {pct}%
            </span>
            <button
              onClick={() => onOpenCancel(localId, articleId)}
              title="Cancel generation"
              style={{
                background: 'none', border: 'none', color: 'var(--t3)',
                padding: '0 2px', cursor: 'pointer', lineHeight: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'color 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            </button>
          </>
        )}
        {isReadyToReview && (
          <span style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 700, flexShrink: 0 }}>Ready to Review</span>
        )}
        {isFailed && (
          <span style={{ fontSize: '10.5px', color: '#ef4444', fontWeight: 700, flexShrink: 0 }}>Failed</span>
        )}
        {isTerminal && (
          <button
            onClick={() => onDismiss(localId)}
            title="Close this card"
            style={{
              background: 'none', border: 'none', color: 'var(--t3)',
              cursor: 'pointer', padding: '2px 6px', fontSize: '18px',
              lineHeight: 1, display: 'flex', alignItems: 'center', flexShrink: 0,
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--t1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
          >
            ×
          </button>
        )}
      </div>

      {/* ── Card body ── */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Search / topic direction section */}
        {showSearchSection && (
          <div>
            {!searchLocked && (
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: '8px' }}>
                Step 1 — Find Topic
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="e.g. Malaysian AI policy, new language models, AI in healthcare..."
                value={topicDirection}
                onChange={e => onTopicDirectionChange(localId, e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !searchLocked) onSearch(localId) }}
                readOnly={searchLocked}
                className="topic-dir-input"
                style={{
                  flex: '1 1 160px',
                  opacity: searchLocked ? 0.55 : 1,
                  cursor: searchLocked ? 'not-allowed' : 'text',
                }}
                autoFocus={isPending}
              />
              {!searchLocked && (
                <>
                  <button onClick={() => onSearch(localId)} className="search-btn" style={{ flexShrink: 0 }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    Find Topics
                  </button>
                  <button
                    onClick={() => onDismiss(localId)}
                    style={{
                      background: 'none', border: '1px solid var(--border)', color: 'var(--t3)',
                      borderRadius: '6px', padding: '10px 12px', fontSize: '12.5px',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
            {!searchLocked && (
              <div style={{ marginTop: '5px', fontSize: '11px', color: 'var(--t3)' }}>
                Leave blank to let AI pick the latest trending topics.
              </div>
            )}
          </div>
        )}

        {/* Mini search progress (waiting for topic options to appear) */}
        {showSearchMini && (
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: '8px' }}>
              Finding Topics
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {SEARCH_AGENTS.map(a => <AgentRow key={a.key} agent={a} row={progMap[a.key]} />)}
            </div>
          </div>
        )}

        {/* Topic cards (selectable or locked) */}
        {showTopicCards && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '12px', flexWrap: 'wrap', gap: '8px',
            }}>
              <div>
                <div style={{
                  fontSize: '9px', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase',
                  color: (isGenerating || isTerminal) ? 'var(--t3)' : '#d4a853', marginBottom: (isGenerating || isTerminal) ? 0 : '2px',
                }}>
                  {(isGenerating || isTerminal) ? 'Selected Topic' : 'Step 2 — Select Topic'}
                </div>
                {!isGenerating && !isTerminal && (
                  <div style={{ fontSize: '13px', color: 'var(--t1)', fontWeight: 600 }}>
                    Select one topic to continue
                  </div>
                )}
              </div>
              {!isGenerating && !isTerminal && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => onAutoSelect(localId, articleId, topicOptions[0])}
                    disabled={selecting}
                    style={{
                      background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.25)',
                      color: '#d4a853', borderRadius: '4px', padding: '5px 12px',
                      fontSize: '11.5px', fontWeight: 600, cursor: selecting ? 'not-allowed' : 'pointer',
                      fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '5px',
                      opacity: selecting ? 0.5 : 1, transition: 'background 0.12s',
                    }}
                    title="Generate article using the first topic automatically"
                  >
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    Auto Generate
                  </button>
                  <button
                    onClick={() => onOpenCancel(localId, articleId)}
                    style={{
                      background: 'none', border: '1px solid var(--border)', color: 'var(--t3)',
                      borderRadius: '4px', padding: '5px 10px', fontSize: '11.5px', cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {topicOptions.map((opt, i) => {
                const optIsSelected = (isGenerating || isTerminal) && selectedOption
                  ? (selectedOption.topic === opt.topic)
                  : false
                const optIsGreyedOut = (isGenerating || isTerminal) && !optIsSelected
                return (
                  <TopicCard
                    key={i}
                    option={opt}
                    onInitiateSelect={(o) => onInitiateSelectTopic(localId, articleId, o)}
                    selecting={selecting}
                    isSelected={optIsSelected}
                    isGreyedOut={optIsGreyedOut}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Agent progress tracker */}
        {showProgress && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--t3)' }}>
                Generation Progress
              </div>
              {isGenerating && (
                <div style={{ flex: 1, height: '2px', background: 'var(--divider)', borderRadius: '999px', overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: '999px', background: anyFailed ? '#ef4444' : '#d4a853' }}
                  />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {AGENTS.map(a => <AgentRow key={a.key} agent={a} row={progMap[a.key]} />)}
            </div>
          </div>
        )}

        {/* Terminal actions */}
        {isReadyToReview && (
          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', borderTop: '1px solid var(--divider)' }}>
            <a
              href={`/admin/editor/${articleId}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '9px 18px', borderRadius: '6px',
                background: '#d4a853', color: '#0c0b0a',
                fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 700,
                textDecoration: 'none', transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#c49640'}
              onMouseLeave={e => e.currentTarget.style.background = '#d4a853'}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Open Editor
            </a>
            <button
              onClick={() => onDismiss(localId)}
              style={{
                background: 'none', border: '1px solid var(--border)', color: 'var(--t3)',
                borderRadius: '6px', padding: '9px 14px', fontSize: '13px',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Close
            </button>
          </div>
        )}

        {isFailed && (
          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', borderTop: '1px solid var(--divider)' }}>
            <button onClick={() => onRetry(localId, topicDirection)} className="search-btn">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-3.68"/>
              </svg>
              Try Again
            </button>
            <button
              onClick={() => onDismiss(localId)}
              style={{
                background: 'none', border: '1px solid var(--border)', color: 'var(--t3)',
                borderRadius: '6px', padding: '9px 14px', fontSize: '13px',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ── Main component ────────────────────────────────────────── */
export default function JanaClient({ initialArticles = [] }) {
  const [cards, setCards] = useState(() =>
    initialArticles.map(a => ({
      localId: a.id,
      articleId: a.id,
      topicDirection: '',
      isSearching: false,
      selectedOption: a.selected_topic || null,
    }))
  )
  const [progressMap,    setProgressMap]    = useState({})
  const [topicOptionsMap,setTopicOptionsMap]= useState(
    Object.fromEntries(initialArticles.filter(a => a.topic_options).map(a => [a.id, a.topic_options]))
  )
  const [statusMap,      setStatusMap]      = useState(
    Object.fromEntries(initialArticles.map(a => [a.id, a.status]))
  )
  const [pollingIds,     setPollingIds]     = useState(
    initialArticles
      .filter(a => !['ready_to_review', 'failed', 'published', 'draft'].includes(a.status))
      .map(a => a.id)
  )
  const [selectingId,    setSelectingId]    = useState(null)
  const [confirmTopicTarget, setConfirmTopicTarget] = useState(null) // { localId, articleId, option }
  const [cancelTarget,   setCancelTarget]   = useState(null)         // { localId, articleId }
  const [showCancelModal,setShowCancelModal]= useState(false)
  const [lm,             setLm]            = useState(false)

  const intervalRef    = useRef(null)
  const pollingIdsRef  = useRef(pollingIds)
  const statusMapRef   = useRef(statusMap)
  useEffect(() => { pollingIdsRef.current  = pollingIds  }, [pollingIds])
  useEffect(() => { statusMapRef.current   = statusMap   }, [statusMap])

  /* ── Theme ── */
  useEffect(() => {
    const saved = localStorage.getItem('admin-theme') || 'dark'
    setLm(saved === 'light')
    const h = (e) => setLm(e.detail === 'light')
    window.addEventListener('admin-theme-change', h)
    return () => window.removeEventListener('admin-theme-change', h)
  }, [])

  /* ── Polling ── */
  useEffect(() => {
    if (pollingIds.length === 0) { clearInterval(intervalRef.current); return }

    const poll = async () => {
      const ids = pollingIdsRef.current
      if (!ids.length) return

      const results = await Promise.all(
        ids.map(id =>
          fetch(`/api/progress?articleId=${id}`)
            .then(r => r.json())
            .then(d => ({ id, progress: d.progress ?? [], articleStatus: d.articleStatus, topicOptions: d.topicOptions }))
            .catch(() => ({ id, progress: [], articleStatus: null, topicOptions: null }))
        )
      )

      setProgressMap(prev => {
        const next = { ...prev }
        results.forEach(({ id, progress }) => { next[id] = progress })
        return next
      })
      setTopicOptionsMap(prev => {
        const next = { ...prev }
        results.forEach(({ id, topicOptions }) => { if (topicOptions) next[id] = topicOptions })
        return next
      })
      setStatusMap(prev => {
        const next = { ...prev }
        results.forEach(({ id, articleStatus }) => { if (articleStatus) next[id] = articleStatus })
        return next
      })

      // Detect newly terminal articles
      const nowTerminal = results.filter(({ id, articleStatus }) =>
        ['ready_to_review', 'failed'].includes(articleStatus) &&
        !['ready_to_review', 'failed'].includes(statusMapRef.current[id] || '')
      )
      if (nowTerminal.length > 0) {
        nowTerminal.forEach(({ articleStatus }) => {
          if (articleStatus === 'ready_to_review') {
            toast.success('Article generated successfully! Click "Open Editor" to review.')
          } else {
            toast.error('Article generation failed. Click "Try Again" to retry.')
          }
        })
        const terminalIds = nowTerminal.map(r => r.id)
        setPollingIds(prev => prev.filter(id => !terminalIds.includes(id)))
      }
    }

    poll()
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(poll, 3000)
    return () => clearInterval(intervalRef.current)
  }, [pollingIds])

  /* ── Add new card ── */
  const addNewCard = () => {
    const localId = `local-${Date.now()}`
    setCards(prev => [{ localId, articleId: null, topicDirection: '', isSearching: false, selectedOption: null }, ...prev])
  }

  /* ── Update topic direction ── */
  const updateTopicDirection = (localId, value) => {
    setCards(prev => prev.map(c => c.localId === localId ? { ...c, topicDirection: value } : c))
  }

  /* ── Search topics ── */
  const handleSearch = async (localId) => {
    const card = cards.find(c => c.localId === localId)
    if (!card) return
    setCards(prev => prev.map(c => c.localId === localId ? { ...c, isSearching: true } : c))
    const tid = toast.loading('Searching for trending topics…')
    try {
      const res = await fetch('/api/generate-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicDirection: card.topicDirection.trim() || null }),
      })
      const { articleId, error } = await res.json()
      if (error) {
        toast.error(`Error: ${error}`, { id: tid })
        setCards(prev => prev.map(c => c.localId === localId ? { ...c, isSearching: false } : c))
        return
      }
      toast.success('Searching for topics… please wait.', { id: tid })
      setCards(prev => prev.map(c => c.localId === localId ? { ...c, articleId, isSearching: false } : c))
      setStatusMap(prev => ({ ...prev, [articleId]: 'awaiting_topic_selection' }))
      setPollingIds(prev => [...prev, articleId])
    } catch {
      toast.error('Error while searching for topics.', { id: tid })
      setCards(prev => prev.map(c => c.localId === localId ? { ...c, isSearching: false } : c))
    }
  }

  /* ── Initiate topic selection (open confirmation modal) ── */
  const handleInitiateSelectTopic = (localId, articleId, option) => {
    setConfirmTopicTarget({ localId, articleId, option })
  }

  /* ── Confirmed: actually select the topic ── */
  const handleConfirmSelectTopic = async () => {
    if (!confirmTopicTarget) return
    const { localId, articleId, option } = confirmTopicTarget
    setConfirmTopicTarget(null)
    setSelectingId(articleId)
    const tid = toast.loading('Starting article generation…')
    try {
      const res = await fetch('/api/select-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, option }),
      })
      if (!res.ok) { toast.error('Failed to select topic.', { id: tid }); return }
      toast.success('Topic selected! Generating article… (~9 min)', { id: tid })
      setStatusMap(prev => ({ ...prev, [articleId]: 'generating' }))
      setCards(prev => prev.map(c => c.localId === localId ? { ...c, selectedOption: option } : c))
    } catch {
      toast.error('Error while selecting topic.', { id: tid })
    } finally {
      setSelectingId(null)
    }
  }

  /* ── Auto Generate (no confirmation) ── */
  const handleAutoSelect = async (localId, articleId, option) => {
    setSelectingId(articleId)
    const tid = toast.loading('Starting article generation…')
    try {
      const res = await fetch('/api/select-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, option }),
      })
      if (!res.ok) { toast.error('Failed to select topic.', { id: tid }); return }
      toast.success('Topic selected! Generating article… (~9 min)', { id: tid })
      setStatusMap(prev => ({ ...prev, [articleId]: 'generating' }))
      setCards(prev => prev.map(c => c.localId === localId ? { ...c, selectedOption: option } : c))
    } catch {
      toast.error('Error while selecting topic.', { id: tid })
    } finally {
      setSelectingId(null)
    }
  }

  /* ── Open cancel confirmation ── */
  const handleOpenCancel = (localId, articleId) => {
    setCancelTarget({ localId, articleId })
    setShowCancelModal(true)
  }

  /* ── Confirm cancel ── */
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    setShowCancelModal(false)
    const { localId, articleId } = cancelTarget
    const tid = toast.loading('Cancelling…')
    try {
      const currentStatus = statusMap[articleId]
      let res
      if (currentStatus === 'awaiting_topic_selection') {
        res = await fetch('/api/cancel-topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId }),
        })
      } else {
        res = await fetch(`/api/articles/${articleId}`, { method: 'DELETE' })
      }
      if (!res.ok) { toast.error('Failed to cancel.', { id: tid }); return }
      setCards(prev => prev.filter(c => c.localId !== localId))
      setPollingIds(prev => prev.filter(id => id !== articleId))
      toast.success('Cancelled.', { id: tid })
    } catch {
      toast.error('Error while cancelling.', { id: tid })
    }
  }

  /* ── Dismiss (remove card without API call) ── */
  const handleDismiss = (localId) => {
    setCards(prev => prev.filter(c => c.localId !== localId))
  }

  /* ── Try Again (retry with fresh card) ── */
  const handleRetry = (localId, prevTopicDirection) => {
    const newLocalId = `local-${Date.now()}`
    setCards(prev => [
      { localId: newLocalId, articleId: null, topicDirection: prevTopicDirection || '', isSearching: false, selectedOption: null },
      ...prev.filter(c => c.localId !== localId),
    ])
  }

  /* ── Theme CSS vars ── */
  const vars = lm ? `
    --bg:#f8f8f8;--surface:#ffffff;--surface2:#f1f1f1;--card-inner:#f8f8f8;
    --border:#e5e7eb;--divider:#f0f0f0;
    --t1:#0d1117;--t2:#1f2937;--t3:#4b5563;
    --surface-shadow:0 1px 4px rgba(0,0,0,0.06),0 0 0 1px #e5e7eb;--surface-inset:none;
    --agent-active-bg:rgba(245,158,11,0.06);--agent-idle:#9ca3af;
    --topic-desc:var(--t2);--topic-source:var(--t3);
  ` : `
    --bg:#0c0b0a;--surface:#0f0e0d;--surface2:#131110;--card-inner:#111009;
    --border:rgba(237,232,223,0.07);--divider:rgba(237,232,223,0.05);
    --t1:#ede8df;--t2:#a39c92;--t3:#6f6862;
    --surface-shadow:none;--surface-inset:inset 0 1px 0 rgba(237,232,223,0.04);
    --agent-active-bg:rgba(245,158,11,0.05);--agent-idle:#252525;
    --topic-desc:#a89e96;--topic-source:#6b6560;
  `

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }}
      className="admin-page-content" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .admin-page-content { ${vars} }
        @keyframes jana-spin { to { transform: rotate(360deg); } }
        .topic-dir-input {
          width:100%;padding:10px 14px;border-radius:6px;
          background:var(--card-inner);border:1px solid var(--border);
          color:var(--t1);font-family:'DM Sans',sans-serif;font-size:13.5px;
          outline:none;transition:border-color 0.15s;box-sizing:border-box;
        }
        .topic-dir-input:focus { border-color:rgba(212,168,83,0.4); }
        .topic-dir-input::placeholder { color:var(--t3); }
        .search-btn {
          padding:10px 20px;border-radius:6px;
          background:rgba(212,168,83,0.1);color:#d4a853;
          border:1px solid rgba(212,168,83,0.25);
          font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:700;
          cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:7px;
          transition:background 0.12s,border-color 0.12s;
        }
        .search-btn:hover:not(:disabled){background:rgba(212,168,83,0.16);border-color:rgba(212,168,83,0.4);}
        .search-btn:disabled{opacity:0.5;cursor:not-allowed;}
      `}</style>

      {/* ── Confirmation: topic selection ── */}
      <ConfirmationModal
        open={!!confirmTopicTarget}
        title="Select This Topic?"
        message={confirmTopicTarget?.option?.topic ? `"${confirmTopicTarget.option.topic}"` : 'This topic will be used to generate the article.'}
        confirmLabel="Yes, Select This Topic"
        cancelLabel="Review Again"
        confirmColor="amber"
        onConfirm={handleConfirmSelectTopic}
        onCancel={() => setConfirmTopicTarget(null)}
      />

      {/* ── Confirmation: cancel ── */}
      <ConfirmationModal
        open={showCancelModal}
        title="Cancel?"
        message="This process will be cancelled and removed."
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Going"
        confirmColor="red"
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.015em' }}>
            Generate Article
          </h1>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--t3)' }}>
            Find trending topics, pick the best one, then generate a full article automatically
          </p>
        </div>
        <button onClick={addNewCard} className="search-btn">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          New Article
        </button>
      </div>

      {/* ── Cards ── */}
      <AnimatePresence mode="popLayout">
        {cards.map(card => {
          const { articleId } = card
          const status       = articleId ? (statusMap[articleId] || 'awaiting_topic_selection') : null
          const topicOptions = articleId ? topicOptionsMap[articleId] : null
          const progressRows = articleId ? (progressMap[articleId] ?? []) : []
          return (
            <ArticleCard
              key={card.localId}
              card={card}
              topicOptions={topicOptions}
              progressRows={progressRows}
              status={status}
              selectingId={selectingId}
              onTopicDirectionChange={updateTopicDirection}
              onSearch={handleSearch}
              onInitiateSelectTopic={handleInitiateSelectTopic}
              onAutoSelect={handleAutoSelect}
              onOpenCancel={handleOpenCancel}
              onDismiss={handleDismiss}
              onRetry={handleRetry}
            />
          )
        })}
      </AnimatePresence>

      {/* ── Empty state ── */}
      {cards.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '48px 20px', boxShadow: 'var(--surface-shadow), var(--surface-inset)',
            textAlign: 'center', color: 'var(--t3)', fontSize: '13.5px', lineHeight: 1.8,
          }}>
          No articles in progress.<br/>
          Click <span style={{ color: '#d4a853' }}>&ldquo;New Article&rdquo;</span> to get started.
        </motion.div>
      )}
    </motion.div>
  )
}
