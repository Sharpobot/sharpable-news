import { ask } from './_client.js'

/**
 * Agent 6: Image Brief
 * Returns:
 *   heroImage   — Midjourney-style prompt + Unsplash query for the article thumbnail
 *   suggestions — 5 inline image placements evenly distributed throughout the article
 */
export async function imageBrief(context = {}) {
  const { selectedTopic, article, seo } = context

  if (!selectedTopic) {
    return { ...context, images: { heroImage: null, suggestions: [] } }
  }

  // Count paragraphs in the article body for even distribution
  const bodyContent    = article?.body?.content ?? []
  const paragraphCount = Math.max(bodyContent.filter(n => n.type === 'paragraph').length, 8)

  // 5 suggestions evenly distributed (e.g. 10 paragraphs → 2,4,6,8,10)
  const SUGGESTION_COUNT = 5
  const indices = Array.from({ length: SUGGESTION_COUNT }, (_, i) =>
    Math.max(1, Math.round(((i + 1) / SUGGESTION_COUNT) * paragraphCount))
  )

  const suggestionsTemplate = indices.map((idx, i) => (
    `    {\n      "paragraphIndex": ${idx},\n      "description": "Single concise sentence for inline image ${i + 1}."\n    }`
  )).join(',\n')

  const result = await ask(
    `You are a visual editor for Sharpable News, a Bahasa Malaysia AI and technology news publication.
For a given article, generate:
1. A hero/thumbnail image brief (Midjourney-style prompt + Unsplash query)
2. Five inline image placement suggestions at the exact paragraph positions provided
Always respond with valid JSON only — no markdown, no extra text.`,

    `Article topic: ${selectedTopic.topic}
Category: ${selectedTopic.category}
Headline: ${article?.headlines?.[0] ?? selectedTopic.topic}
Total paragraphs in article: ${paragraphCount}

Place the 5 image suggestions at these exact paragraph indices: ${indices.join(', ')}

Generate the image brief in this exact JSON format:
{
  "heroImage": {
    "prompt": "Detailed cinematic image prompt (minimum 60 words) describing lighting, composition, mood, subject, and atmosphere for the article thumbnail",
    "unsplashQuery": "2-4 word Unsplash search query",
    "altText": "Short alt text for accessibility"
  },
  "suggestions": [
${suggestionsTemplate}
  ]
}`,
    1000
  )

  return {
    ...context,
    images: {
      heroImage:   result.heroImage   ?? null,
      suggestions: result.suggestions ?? [],
    },
  }
}
