import { ask } from './_client.js'

/**
 * Agent 2: Topic Selector
 * Produces exactly 6 distinct topic options for human-in-the-loop selection.
 * Each option covers a different story/event — never 6 angles on the same topic.
 * Returns topicOptions: Array<{ topic, summary, category, angle, sourceName, sourceUrl }>
 */
export async function topicSelector(context = {}) {
  const { trends = [], existingArticles = [], topicDirection = null } = context

  if (trends.length === 0) {
    return { ...context, topicOptions: [] }
  }

  const recentBlock = existingArticles.length > 0
    ? `\nARTIKEL YANG BARU DITERBITKAN (14 hari lepas — ELAKKAN topik terlalu serupa):\n${
        existingArticles.map((a, i) => `${i + 1}. "${a.title}" (${a.slug})`).join('\n')
      }\n`
    : ''

  const directionPriority = topicDirection
    ? `\nDIRECTION PRIORITY: The editor requested topics related to "${topicDirection}". Options that directly match this direction MUST be ranked first (options 1–3). Fill remaining slots (options 4–6) with the strongest unrelated trending topics.\n`
    : ''

  const result = await ask(
    `You are a senior editor for Sharpable News, a Bahasa Malaysia AI/tech news publication.
Your audience: tech-savvy Malaysians aged 20-40, bilingual (BM/English), interested in how
global technology affects their daily lives and career.
Always respond with valid JSON only — no markdown, no extra text.`,

    `Here are the trending topics identified by our trend scout:

${JSON.stringify(trends, null, 2)}
${recentBlock}${directionPriority}
Return EXACTLY 6 topic options for the editor to choose from.

STRICT RULES:
1. Each option MUST be a completely different story/event — do NOT return 6 variations of the same topic.
2. Cover different categories where possible (e.g. AI policy, product launch, research breakthrough, business, society, science).
3. Avoid topics semantically identical to any recently published article listed above.
4. Each option must support a substantive 600-700 word Bahasa Malaysia article.
5. Rank by reader interest (option 1 = strongest pick for Malaysian audience). If a topic direction was provided, direction-matched options must occupy the top slots.

Return this exact JSON format:
{
  "topicOptions": [
    {
      "topic": "Concise topic headline (max 80 chars)",
      "summary": "One sentence: what happened and why it matters to Malaysian readers.",
      "category": "AI | Tech | Business | Society | Science",
      "angle": "The specific article hook for Sharpable News — what unique perspective will we take?",
      "sourceName": "Primary publication or website name that reported this",
      "sourceUrl": "Direct URL to primary source article, or null if unavailable"
    },
    {
      "topic": "...",
      "summary": "...",
      "category": "...",
      "angle": "...",
      "sourceName": "...",
      "sourceUrl": "..."
    },
    {
      "topic": "...",
      "summary": "...",
      "category": "...",
      "angle": "...",
      "sourceName": "...",
      "sourceUrl": "..."
    },
    {
      "topic": "...",
      "summary": "...",
      "category": "...",
      "angle": "...",
      "sourceName": "...",
      "sourceUrl": "..."
    },
    {
      "topic": "...",
      "summary": "...",
      "category": "...",
      "angle": "...",
      "sourceName": "...",
      "sourceUrl": "..."
    },
    {
      "topic": "...",
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
    topicOptions: result.topicOptions ?? [],
  }
}
