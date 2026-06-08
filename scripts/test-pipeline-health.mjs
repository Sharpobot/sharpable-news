/**
 * Pipeline health check — structural validation only, no API calls.
 * Verifies agent exports, prompt content, and message constants are correct.
 * Run with: node scripts/test-pipeline-health.mjs
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

let passed = 0
let failed = 0

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`)
    failed++
  }
}

// ── 1. trend-scout.js ───────────────────────────────────────────────────────
console.log('\n[1] trend-scout.js')
const trendScoutSrc = readFileSync(path.join(root, 'lib/agents/trend-scout.js'), 'utf8')

check('exports trendScout function',       trendScoutSrc.includes('export async function trendScout'))
check('accepts topicDirection parameter',  trendScoutSrc.includes('topicDirection = null'))
check('uses targeted search as primary',   trendScoutSrc.includes('MANDATORY SEARCH PROTOCOL'))
check('exact keywords used as query',      trendScoutSrc.includes('exact keywords from the topic direction'))
check('fallback threshold is 3 results',   trendScoutSrc.includes('FEWER THAN 3'))
check('direction results ranked first',    trendScoutSrc.includes('place topics that directly match') || trendScoutSrc.includes('FIRST in the trends array'))
check('maxTokens set to 2000',             trendScoutSrc.includes('2000'))

// ── 2. topic-selector.js ────────────────────────────────────────────────────
console.log('\n[2] topic-selector.js')
const topicSelectorSrc = readFileSync(path.join(root, 'lib/agents/topic-selector.js'), 'utf8')

check('exports topicSelector function',    topicSelectorSrc.includes('export async function topicSelector'))
check('returns exactly 3 options',         topicSelectorSrc.includes('EXACTLY 3'))
check('comment says 3 not 6',              topicSelectorSrc.includes('exactly 3 distinct') && !topicSelectorSrc.includes('exactly 6'))
check('JSON template has 3 entries',       (topicSelectorSrc.match(/"sourceUrl"/g) || []).length === 3)
check('maxTokens set to 1000',             topicSelectorSrc.includes('1000'))
check('direction priority block present',  topicSelectorSrc.includes('DIRECTION PRIORITY'))
check('topicDirection destructured',       topicSelectorSrc.includes('topicDirection = null'))

// ── 3. pipeline-messages.js ─────────────────────────────────────────────────
console.log('\n[3] pipeline-messages.js')
const msgSrc = readFileSync(path.join(root, 'lib/pipeline-messages.js'), 'utf8')

check('file exists and exports PIPELINE_MESSAGES', msgSrc.includes('export const PIPELINE_MESSAGES'))
check('TOPIC_SELECTOR start says 3',       msgSrc.includes('3 topic options'))
check('done message uses count function',  msgSrc.includes('topic options ready'))
check('all 9 pipeline stages present',     [
  'TREND_SCOUT', 'TOPIC_SELECTOR', 'DEEP_RESEARCHER', 'ARTICLE_WRITER',
  'SEO_METADATA', 'IMAGE_BRIEF', 'QUALITY_CHECKER', 'REVISION', 'SAVE_ARTICLE'
].every(k => msgSrc.includes(k)))

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`  ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('  ✅ Pipeline health check passed.\n')
  process.exit(0)
} else {
  console.error('  ❌ Pipeline health check FAILED.\n')
  process.exit(1)
}
