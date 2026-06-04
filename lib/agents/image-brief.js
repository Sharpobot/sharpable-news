import { ask } from './_client.js'

/**
 * Agent 6: Image Brief
 * Returns:
 *   heroImage  — Midjourney-style prompt + Unsplash query for the article thumbnail
 *   suggestions — 3 inline image placements with paragraph indices
 */
export async function imageBrief(context = {}) {
  const { selectedTopic, article, seo } = context

  if (!selectedTopic) {
    return { ...context, images: { heroImage: null, suggestions: [] } }
  }

  const result = await ask(
    `You are a visual editor for Sharpable News, a Bahasa Malaysia AI and technology news publication.
For a given article, generate:
1. A hero/thumbnail image brief (Midjourney-style prompt + Unsplash query)
2. Three inline image placement suggestions (paragraph index + short description)
Always respond with valid JSON only — no markdown, no extra text.`,

    `Article topic: ${selectedTopic.topic}
Category: ${selectedTopic.category}
Headline: ${article?.headlines?.[0] ?? selectedTopic.topic}

Generate a complete image brief in this exact JSON format:
{
  "heroImage": {
    "prompt": "Detailed cinematic image prompt (minimum 60 words) describing lighting, composition, mood, subject, and atmosphere for the article thumbnail",
    "unsplashQuery": "2-4 word Unsplash search query",
    "altText": "Short alt text for accessibility"
  },
  "suggestions": [
    {
      "paragraphIndex": 2,
      "description": "Single concise sentence describing what inline image 1 should show."
    },
    {
      "paragraphIndex": 4,
      "description": "Single concise sentence describing what inline image 2 should show."
    },
    {
      "paragraphIndex": 6,
      "description": "Single concise sentence describing what inline image 3 should show."
    }
  ]
}`,
    2000
  )

  return {
    ...context,
    images: {
      heroImage:   result.heroImage   ?? null,
      suggestions: result.suggestions ?? [],
    },
  }
}
