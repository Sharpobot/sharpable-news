/**
 * Isolated test for the Trend Scout agent.
 * Run from project root:
 *   node scripts/test-trend-scout.mjs
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Load .env.local manually ─────────────────────────────
const envPath = resolve(process.cwd(), '.env.local')
try {
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !process.env[key]) process.env[key] = val
  }
  console.log('[env] Loaded .env.local')
  console.log('[env] ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY)
} catch (e) {
  console.error('[env] Could not load .env.local:', e.message)
}

// ── Run trendScout ───────────────────────────────────────
const { trendScout } = await import('../lib/agents/trend-scout.js')

const topicDirection = process.argv[2] || 'Anthropic atau OpenAI melancarkan sesuatu yang baru'
console.log('\n[test] topicDirection:', topicDirection)
console.log('[test] Starting trendScout...\n')

const result = await trendScout({}, topicDirection)

console.log('\n========== FINAL trendScout() RETURN ==========')
console.log('trends.length:', result.trends?.length)
console.log('scoutedAt:', result.scoutedAt)
console.log('trends:', JSON.stringify(result.trends, null, 2))
console.log('================================================\n')
