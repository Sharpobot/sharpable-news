import { askWithSearch } from './_client.js'

/**
 * Agent 1: Trend Scout
 * Discovery only — returns a raw candidate pool for Topic Selector to rank.
 *
 * No direction : one broad search → 10-15 candidate stories.
 * With direction: decomposes into 3 angle-based queries, runs all 3, combines +
 *                 deduplicates, returns the full pool WITHOUT filtering or ranking.
 *                 Ranking by topic direction happens entirely in Topic Selector.
 */
export async function trendScout(context = {}, topicDirection = null) {
  const today = new Date().toISOString().split('T')[0]

  const searchInstructions = topicDirection
    ? `TOPIC DIRECTION: "${topicDirection}"

YOUR ONLY JOB IS DISCOVERY — return as many relevant candidates as possible.

Decompose the topic direction into 3 different search queries that cover different angles of the same topic.
For example, if the direction is "AI-first company":
  Query 1: "AI-first company business strategy 2026"
  Query 2: "AI native startup success stories"
  Query 3: "companies prioritising AI transformation results"

Run all 3 searches. Combine all results. Remove exact duplicates. Return the FULL combined pool.
Do NOT filter, rank, or prioritise results by the topic direction — that ranking happens in the next stage.
Return 10-15 distinct trending stories from the combined search results.`
    : `Run one broad web search for the most trending AI and technology news from the last 7 days.
Return the top 10-15 most newsworthy stories you find as candidates.`

  const result = await askWithSearch(
    `You are a trend scout for a Bahasa Malaysia tech news publication called Sharpable News.
Your ONLY job is discovery — find real, current news and return it as a raw candidate pool.
Do not filter, rank, or prioritise by any topic direction. Return everything you find.
Use web search to find REAL, current news — do not rely on training data.
Always respond with valid JSON only — no markdown, no extra text.`,

    `Today's date is ${today}.

${searchInstructions}

Focus on topics that are:
- Globally significant (major AI releases, breakthroughs, product launches, controversies)
- Relevant to Southeast Asian / Malaysian audiences
- Based on actual news found via web search, not assumed trends

Return a JSON object in this exact format:
{
  "trends": [
    {
      "topic": "Brief topic name",
      "description": "2-3 sentence description of why this is trending, based on real news found",
      "category": "AI | Tech | Business | Society | Science",
      "urgency": "high | medium | low",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "sourceName": "Primary publication or website name that reported this",
      "sourceUrl": "Direct URL to the primary source article, or null if unavailable"
    }
  ],
  "scoutedAt": "${today}"
}`,
    2000
  )

  return {
    ...context,
    trends: result.trends ?? [],
    scoutedAt: result.scoutedAt ?? today,
  }
}
