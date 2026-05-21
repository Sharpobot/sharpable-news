import { ask } from './_client.js'

/**
 * Agent 6: Image Brief
 * Describes ideal hero and inline images for the article.
 * Suggests Unsplash search queries and approximate URLs.
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
    `You are an art director for Sharpable News, a dark-themed Bahasa Malaysia tech news publication.
The site has a dark editorial aesthetic — think Wired meets The Verge but for Malaysian audiences.
You source high-quality images from Unsplash and describe visual concepts for articles.
Always respond with valid JSON only — no markdown, no extra text.`,

    `Article topic: ${selectedTopic.topic}
Category: ${selectedTopic.category}
Headline: ${article?.headlines?.[0] ?? selectedTopic.topic}
Alt text needed: ${seo?.imageAltText ?? ''}

Create an image brief for this article. Suggest realistic Unsplash search queries
that would return relevant, high-quality editorial images.

Return a JSON object in this exact format:
{
  "heroImage": {
    "description": "Detailed description of the ideal hero image",
    "mood": "dark and dramatic | clean and minimal | vibrant and energetic | abstract",
    "unsplashQuery": "unsplash search query string",
    "unsplashUrl": "https://unsplash.com/s/photos/your-query-here",
    "altText": "Alt text for this image"
  },
  "inlineImages": [
    {
      "placement": "After paragraph 2 or 3",
      "description": "What this image should show",
      "unsplashQuery": "unsplash search query",
      "unsplashUrl": "https://unsplash.com/s/photos/your-query-here",
      "altText": "Alt text"
    }
  ],
  "colorPalette": "Brief description of colors that would complement the article theme",
  "avoidImages": "Description of image styles to avoid for this article"
}`
  )

  return {
    ...context,
    images: {
      heroImage: result.heroImage ?? null,
      inlineImages: result.inlineImages ?? [],
      colorPalette: result.colorPalette ?? '',
      avoidImages: result.avoidImages ?? '',
    },
  }
}
