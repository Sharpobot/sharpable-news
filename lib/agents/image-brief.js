import { ask } from './_client.js'

/**
 * Agent 6: Image Brief
 * Returns:
 *   heroImage   — stock photo description + Unsplash query + altText + caption for the article thumbnail
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
    `    {\n      "paragraphIndex": ${idx},\n      "description": "Stock photo search description for inline image ${i + 1}.",\n      "altText": "Concise factual alt text under 125 characters.",\n      "caption": "Short news-style caption under 15 words."\n    }`
  )).join(',\n')

  const result = await ask(
    `You are a visual editor for Sharpable News, a Bahasa Malaysia AI and technology news publication.
Generate image suggestions that sound like professional stock photo search queries — realistic, photographic, and specific, as if describing a real photograph that could be found on Unsplash or Getty Images.
Do NOT describe illustrated, infographic, or obviously AI-generated image styles.
Good examples: 'Malaysian developer working on laptop in modern Kuala Lumpur office, natural lighting' or 'Server room with rows of GPU hardware, dramatic blue lighting, shallow depth of field'.
Bad examples to avoid: 'futuristic robot with glowing circuits' or 'comparison infographic with arrows and charts'.
These descriptions will be used by a human editor to search for real stock photos — write them as stock photo search terms, not AI art prompts.
Always respond with valid JSON only — no markdown, no extra text.`,

    `Article topic: ${selectedTopic.topic}
Category: ${selectedTopic.category}
Headline: ${article?.headlines?.[0] ?? selectedTopic.topic}
Total paragraphs in article: ${paragraphCount}

Place the 5 image suggestions at these exact paragraph indices: ${indices.join(', ')}

Generate the image brief in this exact JSON format:
{
  "heroImage": {
    "prompt": "Realistic stock photo search description (25-50 words, photographic style — lighting, setting, subject)",
    "unsplashQuery": "2-4 word Unsplash search query",
    "altText": "Concise factual alt text under 125 characters, professional news blog style, describes what is in the image",
    "caption": "Short attribution-style caption under 15 words, news publication style like 'Ilustrasi konsep pusat data AI generasi baharu'"
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
