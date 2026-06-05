import { askWithSearch } from './_client.js'

/**
 * Agent 1: Trend Scout
 * Finds trending AI/tech topics from the last 24-48 hours using live web search.
 * Returns a list of trending topics with brief descriptions.
 */
export async function trendScout(context = {}, topicDirection = null) {
  const today = new Date().toISOString().split('T')[0]

  const directionHint = topicDirection
    ? `\n\nTOPIC DIRECTION HINT: The editor is interested in topics related to: ${topicDirection}. Prioritise trends in this area if found.`
    : ''

  const result = await askWithSearch(
    `You are a trend scout for a Bahasa Malaysia tech news publication called Sharpable News.
Your job is to identify the most trending and newsworthy AI, technology, and digital topics
from the last 24-48 hours that would be relevant and interesting to a Malaysian audience.
Use web search to find REAL, current news — do not rely on training data.
Always respond with valid JSON only — no markdown, no extra text.`,

    `Today's date is ${today}.${directionHint}

PENTING: Lakukan MAKSIMUM 3 carian web sahaja. Pilih carian yang paling spesifik dan relevan.

Search the web for the latest AI and technology news from the last 48 hours only.
Do not use information from your training data — search for real current events.

Identify 5-7 trending AI and technology topics from the last 48 hours.
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
    4096
  )

  return {
    ...context,
    trends: result.trends ?? [],
    scoutedAt: result.scoutedAt ?? today,
  }
}
