import { ask } from './_client.js'

/**
 * Agent 6: Image Brief
 * Generates AI image generation prompts (Midjourney/DALL-E style) for the article.
 * Also suggests Unsplash search queries as a fallback.
 */
export async function imageBrief(context = {}) {
  const { selectedTopic, article, seo } = context

  if (!selectedTopic) {
    return {
      ...context,
      images: null,
    }
  }

  const result = await ask(
    `You are a creative director and AI image prompt engineer for Sharpable News, a dark-themed Bahasa Malaysia tech news publication.
You write highly detailed, photorealistic AI image generation prompts in the style used for Midjourney, DALL-E, and Stable Diffusion.
Great prompts include: subject description, composition, lighting, mood, color palette, style references, and technical camera/lens details.
Always respond with valid JSON only — no markdown, no extra text.`,

    `Article topic: ${selectedTopic.topic}
Category: ${selectedTopic.category}
Headline: ${article?.headlines?.[0] ?? selectedTopic.topic}
Alt text needed: ${seo?.imageAltText ?? ''}

Generate image prompts for this article. Each prompt must be detailed enough to produce a high-quality editorial image directly in Midjourney, DALL-E 3, or Stable Diffusion.

Return a JSON object in this exact format:
{
  "heroImage": {
    "prompt": "A detailed AI image generation prompt — describe the scene, subject, composition, lighting, atmosphere, color palette, and visual style. Include style references like 'editorial photography', 'cinematic lighting', 'shallow depth of field', 'shot on Sony A7R', etc. Be specific and evocative. Minimum 60 words.",
    "negativePrompt": "Elements to exclude from the image, e.g.: cartoon, illustration, text overlays, watermark, blurry, low quality, stock photo clichés",
    "mood": "dark and dramatic | clean and minimal | vibrant and energetic | abstract",
    "unsplashQuery": "fallback unsplash search query if AI generation is not used",
    "altText": "Descriptive alt text for accessibility"
  },
  "inlineImages": [
    {
      "placement": "After paragraph 2 or 3",
      "prompt": "Detailed AI image generation prompt for this supporting image. Minimum 40 words.",
      "negativePrompt": "Elements to exclude",
      "unsplashQuery": "fallback unsplash search query",
      "altText": "Alt text"
    }
  ],
  "styleNotes": "Brief direction on visual consistency across images — color temperature, editorial tone, photography style",
  "avoidImages": "Specific visual clichés or image types to avoid for this article topic"
}`,
    1000
  )

  return {
    ...context,
    images: {
      heroImage: result.heroImage ?? null,
      inlineImages: result.inlineImages ?? [],
      styleNotes: result.styleNotes ?? '',
      avoidImages: result.avoidImages ?? '',
    },
  }
}
