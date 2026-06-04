import { ask } from './_client.js'

/**
 * Agent: Topic Options
 * Takes trends from trend-scout, returns top 3 formatted topic options
 * for the human-in-the-loop topic selection UI.
 */
export async function topicOptions(context = {}) {
  const { trends = [], existingArticles = [] } = context

  if (!trends.length) return { ...context, topicOptions: [] }

  const recentTitles = existingArticles
    .map(a => a.title)
    .filter(Boolean)
    .slice(0, 20)
    .join('\n')

  const result = await ask(
    `You are a senior editor at Sharpable News, a Bahasa Malaysia AI and technology news publication for Malaysian researchers, developers, and decision-makers.
Select the 3 best topic candidates from the trending topics for the admin to choose from.
Each option must be distinct. Avoid topics similar to recent articles.
Always respond with valid JSON only — no markdown, no extra text.`,

    `TRENDING TOPICS FROM WEB SEARCH:
${JSON.stringify(trends, null, 2)}

RECENTLY PUBLISHED ARTICLES (avoid duplicates):
${recentTitles || '(none yet)'}

Select the 3 most suitable, distinct topics for Sharpable News. Prefer topics with strong Malaysian/SEA relevance or impact.

Return this exact JSON:
{
  "options": [
    {
      "topic": "6-8 word topic headline in Bahasa Malaysia",
      "summary": "One sentence explaining why this is relevant and interesting for Malaysian readers",
      "category": "AI | Tech | Business | Society | Science",
      "angle": "The analytical angle or argument for the Sharpable News article",
      "sourceName": "Primary publication/website name (from the trend data)",
      "sourceUrl": "Primary source URL from the trend data, or null"
    }
  ]
}`,
    1200
  )

  return {
    ...context,
    topicOptions: result.options ?? [],
  }
}
