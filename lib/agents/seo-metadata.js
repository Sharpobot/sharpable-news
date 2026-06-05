import { ask } from './_client.js'

/**
 * Agent 5: SEO Metadata
 * Generates slug, meta description, tags, category, and image alt text.
 */
export async function seoMetadata(context = {}) {
  const { selectedTopic, article } = context

  if (!selectedTopic || !article) {
    return {
      ...context,
      seo: null,
    }
  }

  const chosenHeadline = article.headlines?.[0] ?? selectedTopic.topic

  const result = await ask(
    `You are an SEO specialist for Sharpable News, a Bahasa Malaysia tech news publication.
You create metadata that maximizes search discoverability for Malaysian readers searching in
both Bahasa Malaysia and English. Always respond with valid JSON only — no markdown, no extra text.`,

    `Article headline: ${chosenHeadline}
Article summary: ${article.summary ?? ''}
Topic category: ${selectedTopic.category}
Keywords: ${(selectedTopic.keywords ?? []).join(', ')}

Generate complete SEO metadata for this article.

Return a JSON object in this exact format:
{
  "slug": "url-friendly-slug-in-bahasa-malaysia-max-8-words",
  "metaTitle": "SEO-optimized title (50-60 chars) — can be slightly different from headline",
  "metaDescription": "Compelling meta description in Bahasa Malaysia (150-160 chars)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "AI | Teknologi | Perniagaan | Masyarakat | Sains",
  "imageAltText": "Descriptive alt text for the hero image in Bahasa Malaysia",
  "focusKeyword": "Primary keyword phrase this article should rank for",
  "relatedKeywords": ["related1", "related2", "related3"]
}`,
    1000
  )

  return {
    ...context,
    seo: {
      slug: result.slug ?? '',
      metaTitle: result.metaTitle ?? chosenHeadline,
      metaDescription: result.metaDescription ?? article.summary ?? '',
      tags: result.tags ?? [],
      category: result.category ?? selectedTopic.category,
      imageAltText: result.imageAltText ?? '',
      focusKeyword: result.focusKeyword ?? '',
      relatedKeywords: result.relatedKeywords ?? [],
    },
  }
}
