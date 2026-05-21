/**
 * Standalone test runner for all 7 AI agents.
 * Runs them in sequence with a dummy context and logs each output.
 *
 * Usage:
 *   node --env-file=.env.local lib/agents/test.js
 *
 * Or if Node version doesn't support --env-file:
 *   npx dotenv -e .env.local -- node lib/agents/test.js
 */

import { trendScout } from './trend-scout.js'
import { topicSelector } from './topic-selector.js'
import { deepResearcher } from './deep-researcher.js'
import { articleWriter } from './article-writer.js'
import { seoMetadata } from './seo-metadata.js'
import { imageBrief } from './image-brief.js'
import { qualityChecker } from './quality-checker.js'

const DIVIDER = '─'.repeat(60)

function log(agentName, context) {
  console.log(`\n${DIVIDER}`)
  console.log(`✅  ${agentName} — DONE`)
  console.log(DIVIDER)

  // Print relevant keys added by this agent (not the full context)
  const relevantKeys = getRelevantKeys(agentName)
  for (const key of relevantKeys) {
    if (context[key] !== undefined) {
      console.log(`\n[${key}]`)
      console.log(JSON.stringify(context[key], null, 2))
    }
  }
}

function getRelevantKeys(agentName) {
  const keyMap = {
    'Trend Scout': ['trends', 'scoutedAt'],
    'Topic Selector': ['selectedTopic', 'selectionRationale', 'articleAngle'],
    'Deep Researcher': ['researchBrief'],
    'Article Writer': ['article'],
    'SEO Metadata': ['seo'],
    'Image Brief': ['images'],
    'Quality Checker': ['qualityReport', 'qualityPassed'],
  }
  return keyMap[agentName] ?? []
}

async function runPipeline() {
  console.log('\n🚀  Sharpable News — AI Agent Pipeline Test')
  console.log(`    Started: ${new Date().toISOString()}\n`)

  // Start with empty context — agents will build it up
  let context = {}

  try {
    // 1. Trend Scout
    console.log('⏳  Running Trend Scout...')
    context = await trendScout(context)
    log('Trend Scout', context)

    // 2. Topic Selector
    console.log('\n⏳  Running Topic Selector...')
    context = await topicSelector(context)
    log('Topic Selector', context)

    // 3. Deep Researcher
    console.log('\n⏳  Running Deep Researcher...')
    context = await deepResearcher(context)
    log('Deep Researcher', context)

    // 4. Article Writer
    console.log('\n⏳  Running Article Writer...')
    context = await articleWriter(context)
    log('Article Writer', context)

    // 5. SEO Metadata
    console.log('\n⏳  Running SEO Metadata...')
    context = await seoMetadata(context)
    log('SEO Metadata', context)

    // 6. Image Brief
    console.log('\n⏳  Running Image Brief...')
    context = await imageBrief(context)
    log('Image Brief', context)

    // 7. Quality Checker
    console.log('\n⏳  Running Quality Checker...')
    context = await qualityChecker(context)
    log('Quality Checker', context)

    // Final summary
    console.log(`\n${DIVIDER}`)
    console.log('🎉  PIPELINE COMPLETE')
    console.log(DIVIDER)
    console.log(`\nFinal article title: ${context.article?.headlines?.[0] ?? '(none)'}`)
    console.log(`Slug: ${context.seo?.slug ?? '(none)'}`)
    console.log(`Quality verdict: ${context.qualityReport?.verdict ?? '(none)'}`)
    console.log(`Publish readiness: ${context.qualityReport?.publishReadiness ?? '(none)'}`)
    console.log(`\nCompleted: ${new Date().toISOString()}`)

  } catch (err) {
    console.error('\n❌  Pipeline failed:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

runPipeline()
