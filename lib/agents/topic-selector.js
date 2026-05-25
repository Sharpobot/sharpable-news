import { ask } from './_client.js'

/**
 * Agent 2: Topic Selector
 * Picks the single best topic from the trend list for a Malay-speaking audience.
 * Filters out topics too similar to articles published in the last 14 days.
 * Returns selectedTopic, selectionRationale, articleAngle, and:
 *   isDuplicate: true  — if ALL candidates are too similar to recent articles
 *   similarArticles[]  — articles that were considered too similar (for audit)
 */
export async function topicSelector(context = {}) {
  const { trends = [], existingArticles = [] } = context

  if (trends.length === 0) {
    return {
      ...context,
      selectedTopic: null,
      selectionRationale: 'No trends provided to select from.',
      isDuplicate: false,
      similarArticles: [],
    }
  }

  // Build recent articles context string (last 14 days)
  const recentBlock = existingArticles.length > 0
    ? `\nARTIKEL YANG BARU DITERBITKAN (14 hari lepas — ELAKKAN topik yang terlalu serupa):\n${
        existingArticles.map((a, i) => `${i + 1}. "${a.title}" (${a.slug})`).join('\n')
      }\n`
    : ''

  const result = await ask(
    `You are a senior editor for Sharpable News, a Bahasa Malaysia AI/tech news publication.
Your audience is primarily Malaysian — tech-savvy, aged 20-40, bilingual (BM/English),
interested in how global technology affects their daily lives and career.
Always respond with valid JSON only — no markdown, no extra text.`,

    `Here are the trending topics identified by our trend scout:

${JSON.stringify(trends, null, 2)}
${recentBlock}
Select the SINGLE best topic to write a full article about.
Consider:
1. Reader relevance — how much will Malaysian readers care?
2. Article potential — can we write 600-900 words of substantive content?
3. Timeliness — is this fresh and urgent?
4. Uniqueness — is this something other Malaysian outlets might miss?
5. No overlap — do NOT select a topic that is semantically the same as a recently published article (same event, same product, same company announcement within 14 days). Minor angle differences count as overlap.

If ALL trending topics are too similar to recently published articles, set isDuplicate to true.
If a good unique topic exists, set isDuplicate to false and populate selectedTopic.

Return a JSON object in this exact format:
{
  "isDuplicate": false,
  "selectedTopic": {
    "topic": "The exact topic name from the list",
    "description": "The original description",
    "category": "The category",
    "urgency": "The urgency level",
    "keywords": ["keyword1", "keyword2"]
  },
  "selectionRationale": "2-3 sentences explaining why this topic was chosen over the others",
  "articleAngle": "The specific angle or hook for the Sharpable News article — what unique perspective will we take?",
  "similarArticles": ["title of existing article that was too similar, if any"]
}`,
    600
  )

  const isDuplicate = result.isDuplicate === true

  return {
    ...context,
    selectedTopic:      isDuplicate ? null : (result.selectedTopic ?? trends[0]),
    selectionRationale: result.selectionRationale ?? '',
    articleAngle:       result.articleAngle ?? '',
    isDuplicate,
    similarArticles:    result.similarArticles ?? [],
  }
}
