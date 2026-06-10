import { askWithSearch } from './_client.js'

/**
 * Agent 1: Trend Scout
 * Discovery only — returns a raw candidate pool for Topic Selector to rank.
 *
 * Simple, reliable approach: exactly ONE web search.
 *   - With topic direction: "AI {topicDirection} news 2026"
 *   - Without topic direction: "trending AI news Malaysia Southeast Asia this week"
 * No multi-query decomposition, no deduplication — Topic Selector handles
 * all relevance ranking and selection downstream.
 */
export async function trendScout(context = {}, topicDirection = null) {
  const today = new Date().toISOString().split('T')[0]

  const searchQuery = topicDirection
    ? `AI ${topicDirection} news 2026`
    : `trending AI news Malaysia Southeast Asia this week`

  const result = await askWithSearch(
    `You are a trend scout for a Bahasa Malaysia tech news publication called Sharpable News.
Your ONLY job is discovery — find real, current news and return it as a raw candidate pool.
Do not filter, rank, or prioritise by any topic direction. Return everything you find.
Use web search to find REAL, current news — do not rely on training data.
Always respond with valid JSON only — no markdown, no extra text.`,

    `Today's date is ${today}.

Run ONE web search using this exact query: "${searchQuery}"

Focus on topics that are:
- Globally significant (major AI releases, breakthroughs, product launches, controversies)
- Relevant to Southeast Asian / Malaysian audiences
- Based on actual news found via web search, not assumed trends

Parse the search results and return the top 8 most newsworthy stories as candidates.

Return a JSON object in this exact format:
{
  "trends": [
    {
      "topic": "Brief topic name",
      "description": "1-2 sentence description (max ~100 characters) of why this is trending, based on real news found",
      "category": "AI | Tech | Business | Society | Science",
      "urgency": "high | medium | low",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "sourceName": "Primary publication or website name that reported this",
      "sourceUrl": "Direct URL to the primary source article, or null if unavailable"
    }
  ],
  "scoutedAt": "${today}"
}`,
    3000
  )

  // ── Markdown code-fence fallback ────────────────────────────────────────
  // If the shared parser couldn't extract JSON (e.g. response wrapped in
  // ```json ... ``` fences it didn't strip), strip the fences here and retry.
  if (result.raw) {
    const cleaned = String(result.raw).replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    try {
      const reparsed = JSON.parse(cleaned)
      Object.assign(result, reparsed)
      delete result.raw
    } catch {
      // still unparseable — fall through to diagnostic logging below
    }
  }

  // ── Diagnostic logging ──────────────────────────────────────────────────
  if (result.raw) {
    console.log('[trend-scout] ⚠️ JSON parse failed — raw response (first 1000 chars):')
    console.log(String(result.raw).slice(0, 1000))
  } else {
    console.log('[trend-scout] parsed result keys:', Object.keys(result))
    console.log('[trend-scout] search result count (trends.length):', Array.isArray(result.trends) ? result.trends.length : 'trends is not an array')
  }

  console.log('[trend-scout] raw result:', JSON.stringify({
    topicsFound: (result.trends ?? []).length,
    firstTopic: (result.trends ?? [])[0] ?? null,
    scoutedAt: result.scoutedAt ?? today,
  }, null, 2))

  // ── Return value contract ───────────────────────────────────────────────
  // inngest-functions.js (step 'trend-scout', ~line 158) reads `ctx.trends?.length`
  // and later `trends: ctx1.trends`. The field MUST be named `trends` and MUST
  // be an array — never null/undefined — so `.length` access never throws.
  return {
    ...context,
    trends: result.trends ?? [],
    scoutedAt: result.scoutedAt ?? today,
  }
}
