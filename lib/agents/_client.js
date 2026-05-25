import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const MODEL = 'claude-sonnet-4-5'

const MAX_RETRIES = 3       // 3 attempts max
const RETRY_DELAY_MS = 5000 // 5s, 10s, 20s backoff

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Extract and parse JSON from a Claude response text block */
function parseJSON(text) {
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/s)
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]) } catch { return { raw: text } }
  }
  return { raw: text }
}

/**
 * Helper: send a prompt, return parsed JSON from the response.
 * Automatically retries on 529 (overloaded) / 429 with exponential backoff.
 */
export async function ask(systemPrompt, userPrompt, maxTokens = 4096) {
  let lastError

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      })

      const text = message.content[0]?.text ?? ''
      return parseJSON(text)

    } catch (err) {
      lastError = err
      const status = err.status ?? 0
      const msg = err.message ?? ''

      const isRetryable = status === 529 || status === 429 || msg.includes('overloaded')

      if (isRetryable && attempt < MAX_RETRIES) {
        const waitMs = RETRY_DELAY_MS * Math.pow(2, attempt - 1)
        console.log(`  ⚠️  Claude API busy (attempt ${attempt}/${MAX_RETRIES}), retrying in ${waitMs / 1000}s...`)
        await sleep(waitMs)
      } else {
        throw err
      }
    }
  }

  throw lastError
}

/**
 * Like ask(), but enables live web search (web_search_20250305 tool).
 * Anthropic handles search server-side; we collect all text blocks from the response.
 */
export async function askWithSearch(systemPrompt, userPrompt, maxTokens = 4096) {
  let lastError

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: userPrompt }],
      })

      // Collect text from all text-type content blocks (web search adds tool_use/tool_result blocks)
      const text = message.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('')

      return parseJSON(text)

    } catch (err) {
      lastError = err
      const status = err.status ?? 0
      const msg = err.message ?? ''

      const isRetryable = status === 529 || status === 429 || msg.includes('overloaded')

      if (isRetryable && attempt < MAX_RETRIES) {
        const waitMs = RETRY_DELAY_MS * Math.pow(2, attempt - 1)
        console.log(`  ⚠️  Claude API busy (attempt ${attempt}/${MAX_RETRIES}), retrying in ${waitMs / 1000}s...`)
        await sleep(waitMs)
      } else {
        throw err
      }
    }
  }

  throw lastError
}
