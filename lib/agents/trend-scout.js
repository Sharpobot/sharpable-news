import { ask } from './_client.js'

/**
 * Agent 1: Trend Scout
 * Finds trending AI/tech topics from the last 24-48 hours.
 * Returns a list of trending topics with brief descriptions.
 */
export async function trendScout(context = {}) {
  const today = new Date().toISOString().split('T')[0]

  const result = await ask(
    `You are a trend scout for a Bahasa Malaysia tech news publication called Sharpable News.
Your job is to identify the most trending and newsworthy AI, technology, and digital topics
from the last 24-48 hours that would be relevant and interesting to a Malaysian audience.
Always respond with valid JSON only — no markdown, no extra text.`,

    `Today's date is ${today}.

Identify 5-7 trending AI and technology topics from the last 24-48 hours.
Focus on topics that are:
- Globally significant (major AI releases, breakthroughs, controversies)
- Relevant to Southeast Asian / Malaysian audiences
- Likely to generate strong reader interest

Return a JSON object in this exact format:
{
  "trends": [
    {
      "topic": "Brief topic name",
      "description": "2-3 sentence description of why this is trending",
      "category": "AI | Tech | Business | Society | Science",
      "urgency": "high | medium | low",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ],
  "scoutedAt": "${today}"
}`
  )

  return {
    ...context,
    trends: result.trends ?? [],
    scoutedAt: result.scoutedAt ?? today,
  }
}
