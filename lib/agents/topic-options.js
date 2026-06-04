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
Your job is to select EXACTLY 3 topic options from the trending topics for the admin to choose from.

CRITICAL RULES:
- Return EXACTLY 3 options — no more, no fewer.
- Each option MUST cover a COMPLETELY DIFFERENT story or event. Never return 3 angles of the same story.
- Pick from the 3 most distinct trending topics. If they are all tech, pick the 3 that cover different companies, technologies, or domains.
- Avoid topics similar to recently published articles.
Always respond with valid JSON only — no markdown, no extra text.`,

    `TRENDING TOPICS FROM WEB SEARCH:
${JSON.stringify(trends, null, 2)}

RECENTLY PUBLISHED ARTICLES (avoid duplicates):
${recentTitles || '(none yet)'}

Select exactly 3 DISTINCT topics — each must be a different story, not different angles of the same story. Prefer topics with Malaysian/SEA relevance.

Return this exact JSON:
{
  "options": [
    {
      "topic": "6-8 word topic headline in Bahasa Malaysia",
      "summary": "One sentence explaining why this specific story matters to Malaysian readers",
      "category": "AI | Tech | Business | Society | Science",
      "angle": "The editorial angle or argument Sharpable News will take on this story",
      "sourceName": "Primary publication or website name (from the trend data)",
      "sourceUrl": "Direct URL to primary source article from the trend data, or null"
    },
    {
      "topic": "COMPLETELY DIFFERENT story headline in Bahasa Malaysia",
      "summary": "...",
      "category": "...",
      "angle": "...",
      "sourceName": "...",
      "sourceUrl": "..."
    },
    {
      "topic": "THIRD COMPLETELY DIFFERENT story headline in Bahasa Malaysia",
      "summary": "...",
      "category": "...",
      "angle": "...",
      "sourceName": "...",
      "sourceUrl": "..."
    }
  ]
}`,
    1500
  )

  return {
    ...context,
    topicOptions: result.options ?? [],
  }
}
