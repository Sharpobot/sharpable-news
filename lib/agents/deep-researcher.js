import { askWithSearch } from './_client.js'

/**
 * Agent 3: Deep Researcher
 * Given a selected topic, gathers real facts from primary sources via web search.
 * Returns a research brief with key facts, players, timeline, and Malaysian context.
 */
export async function deepResearcher(context = {}) {
  const { selectedTopic, articleAngle } = context

  if (!selectedTopic) {
    return {
      ...context,
      researchBrief: null,
    }
  }

  const result = await askWithSearch(
    `You are a research journalist specializing in AI and technology for Southeast Asian media.
You produce detailed research briefs using REAL, current facts found via web search.
Search primary sources published in the last 7 days. Cite real organizations, people, and events.
Do not fabricate quotes or statistics. If a fact cannot be verified, omit it.
Always respond with valid JSON only — no markdown, no extra text.`,

    `Topic to research: ${selectedTopic.topic}
Description: ${selectedTopic.description}
Article angle: ${articleAngle ?? 'General explainer for Malaysian readers'}
Category: ${selectedTopic.category}
Keywords: ${(selectedTopic.keywords ?? []).join(', ')}

Search the web for primary sources and recent news (last 7 days) about this topic.
Create a comprehensive research brief using only verified, sourced facts.

Return a JSON object in this exact format:
{
  "researchBrief": {
    "summary": "3-4 sentence overview of the topic based on real recent news",
    "keyFacts": [
      "Specific verified fact 1 with numbers/names/dates where possible",
      "Specific verified fact 2",
      "Specific verified fact 3",
      "Specific verified fact 4",
      "Specific verified fact 5"
    ],
    "keyPlayers": [
      {
        "name": "Real person or organization name",
        "role": "Their actual role in this story"
      }
    ],
    "timeline": [
      {
        "date": "YYYY-MM or YYYY-MM-DD",
        "event": "What actually happened, sourced from recent news"
      }
    ],
    "malaysianContext": "How does this specifically affect or relate to Malaysia or Southeast Asia?",
    "suggestedSources": [
      {
        "outlet": "Publication or website name that covered this",
        "description": "What they reported specifically"
      }
    ],
    "possibleAngles": [
      "Alternative angle 1",
      "Alternative angle 2"
    ],
    "potentialQuotes": [
      {
        "speaker": "Real person who commented on this",
        "quote": "Actual or representative quote from their statements"
      }
    ]
  }
}`
  )

  return {
    ...context,
    researchBrief: result.researchBrief ?? null,
  }
}
