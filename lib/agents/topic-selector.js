import { ask } from './_client.js'

/**
 * Agent 2: Topic Selector
 * Picks the single best topic from the trend list for a Malay-speaking audience.
 * Returns the selected topic with rationale.
 */
export async function topicSelector(context = {}) {
  const { trends = [] } = context

  if (trends.length === 0) {
    return {
      ...context,
      selectedTopic: null,
      selectionRationale: 'No trends provided to select from.',
    }
  }

  const result = await ask(
    `You are a senior editor for Sharpable News, a Bahasa Malaysia AI/tech news publication.
Your audience is primarily Malaysian — tech-savvy, aged 20-40, bilingual (BM/English),
interested in how global technology affects their daily lives and career.
Always respond with valid JSON only — no markdown, no extra text.`,

    `Here are the trending topics identified by our trend scout:

${JSON.stringify(trends, null, 2)}

Select the SINGLE best topic to write a full article about.
Consider:
1. Reader relevance — how much will Malaysian readers care?
2. Article potential — can we write 600-900 words of substantive content?
3. Timeliness — is this fresh and urgent?
4. Uniqueness — is this something other Malaysian outlets might miss?

Return a JSON object in this exact format:
{
  "selectedTopic": {
    "topic": "The exact topic name from the list",
    "description": "The original description",
    "category": "The category",
    "urgency": "The urgency level",
    "keywords": ["keyword1", "keyword2"]
  },
  "selectionRationale": "2-3 sentences explaining why this topic was chosen over the others",
  "articleAngle": "The specific angle or hook for the Sharpable News article — what unique perspective will we take?"
}`
  )

  return {
    ...context,
    selectedTopic: result.selectedTopic ?? trends[0],
    selectionRationale: result.selectionRationale ?? '',
    articleAngle: result.articleAngle ?? '',
  }
}
