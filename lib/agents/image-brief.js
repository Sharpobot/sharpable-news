import { ask } from './_client.js'

/**
 * Agent 6: Image Brief
 * Generates 3–4 image placement suggestions for inline use within the article body.
 * Each suggestion includes a paragraph index (where to place it) and a short description.
 * These are injected as ImagePlaceholder nodes directly into the article body JSON.
 */
export async function imageBrief(context = {}) {
  const { selectedTopic, article, seo } = context

  if (!selectedTopic) {
    return { ...context, images: { suggestions: [] } }
  }

  const result = await ask(
    `You are a photo editor for Sharpable News, a Bahasa Malaysia AI and technology news publication.
Your job is to suggest where editorial images should appear within an article body.
For each suggestion, provide: the paragraph index (1 = after 1st paragraph) and a brief single-sentence image description that captures what the image should show.
Keep descriptions concise and specific — they will be shown as placeholder hints to the editor.
Always respond with valid JSON only — no markdown, no extra text.`,

    `Article topic: ${selectedTopic.topic}
Category: ${selectedTopic.category}
Headline: ${article?.headlines?.[0] ?? selectedTopic.topic}

Suggest 3 image placements for this article. Spread them across the article body (not all at the start).
Paragraph indices should be between 2 and 7 (after the 2nd through 7th paragraph).

Return a JSON object in this exact format:
{
  "suggestions": [
    {
      "paragraphIndex": 2,
      "description": "A single concise sentence describing what the image should show — specific to the article topic."
    },
    {
      "paragraphIndex": 4,
      "description": "Description for image 2."
    },
    {
      "paragraphIndex": 6,
      "description": "Description for image 3."
    }
  ]
}`,
    800
  )

  return {
    ...context,
    images: {
      suggestions: result.suggestions ?? [],
    },
  }
}
