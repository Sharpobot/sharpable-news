import { ask } from './_client.js'
import { createAdminSupabaseClient } from '../db/supabase-admin.js'

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

  // 5 suggestions evenly distributed by default, unless overridden by site_settings
  const DEFAULT_SUGGESTION_COUNT = 5
  let SUGGESTION_COUNT = DEFAULT_SUGGESTION_COUNT

  try {
    const db = createAdminSupabaseClient()
    const { data: settings } = await db
      .from('site_settings')
      .select('key, value')
      .in('key', ['image_count_min', 'image_count_max'])

    const min = parseInt(settings?.find(s => s.key === 'image_count_min')?.value, 10)
    const max = parseInt(settings?.find(s => s.key === 'image_count_max')?.value, 10)

    if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min) {
      SUGGESTION_COUNT = Math.floor(Math.random() * (max - min + 1)) + min
    }
  } catch {
    // Settings unavailable — fall back to default silently
  }

  const indices = Array.from({ length: SUGGESTION_COUNT }, (_, i) =>
    Math.max(1, Math.round(((i + 1) / SUGGESTION_COUNT) * paragraphCount))
  )

  const suggestionsTemplate = indices.map((idx, i) => (
    `    {\n      "paragraphIndex": ${idx},\n      "description": "Stock photo search description for inline image ${i + 1}.",\n      "altText": "Concise factual alt text under 125 characters.",\n      "caption": "Short news-style caption under 15 words."\n    }`
  )).join(',\n')

  const result = await ask(
    `You are a visual editor for Sharpable News, a Bahasa Malaysia AI and technology news publication.
These image suggestions will be used to find or generate stock photos for professional published news articles — every suggestion must be photorealistic and publication-ready.
Generate image suggestions that sound like professional stock photo search queries — realistic, photographic, and specific, as if describing a real photograph that could be found on Unsplash or Getty Images.
Do NOT describe illustrated, infographic, or obviously AI-generated image styles.

PEOPLE & FACES:
- Any person appearing in an image MUST be described as a Malaysian person.
- All image suggestions must use a FACELESS composition. If a person appears, they must be shot from behind, from the side, over the shoulder, from farther away, or otherwise positioned so their face is less or not fully visible — while still clearly appearing Malaysian from that angle (setting, attire, context).
- NEVER suggest images with completely visible faces (far shots are allowed), graphic elements, abstract art, or fantasy/surreal visuals.

STYLE:
- Do not use the words "minimalist", "abstract", or other overly stylised descriptors. Use "cinematic" instead — describe cinematic framing, cinematic lighting, and cinematic shot composition.

Good examples: 'Malaysian developer seen from behind, working on laptop in modern Kuala Lumpur office, cinematic natural lighting' or 'Server room with rows of GPU hardware, cinematic shot, angle with dramatic blue lighting, shallow depth of field' or "Small business team of two people collaborating at computer screen in contemporary Malaysian office, warm lighting, professional atmosphere, over-the-shoulder view. Faceless angle, malaysian people, cinematic angle, view and lighting".
Bad examples to avoid: 'futuristic robot with glowing circuits', 'comparison infographic with arrows and charts', 'minimalist abstract illustration', or any image showing a person's face clearly.
These descriptions will be used by a human editor to search for real stock photos — write them as stock photo search terms, not AI art prompts.
Always respond with valid JSON only — no markdown, no extra text.`,

    `Article topic: ${selectedTopic.topic}
Category: ${selectedTopic.category}
Headline: ${article?.headlines?.[0] ?? selectedTopic.topic}
Total paragraphs in article: ${paragraphCount}

Place the ${SUGGESTION_COUNT} image suggestions at these exact paragraph indices: ${indices.join(', ')}

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
