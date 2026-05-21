import { ask } from './_client.js'

/**
 * Agent 3: Deep Researcher
 * Given a selected topic, generates a research brief with key facts,
 * talking points, potential quotes, and suggested sources.
 */
export async function deepResearcher(context = {}) {
  const { selectedTopic, articleAngle } = context

  if (!selectedTopic) {
    return {
      ...context,
      researchBrief: null,
    }
  }

  const result = await ask(
    `You are a research journalist specializing in AI and technology for Southeast Asian media.
You produce detailed research briefs that writers use to craft accurate, well-sourced articles.
Your briefs are factual, specific, and cite real organizations, people, and events.
Always respond with valid JSON only — no markdown, no extra text.`,

    `Topic to research: ${selectedTopic.topic}
Description: ${selectedTopic.description}
Article angle: ${articleAngle ?? 'General explainer for Malaysian readers'}
Category: ${selectedTopic.category}
Keywords: ${(selectedTopic.keywords ?? []).join(', ')}

Create a comprehensive research brief for this topic. Include real facts, figures,
key players, and context that a journalist would need to write a 700-word article.

Return a JSON object in this exact format:
{
  "researchBrief": {
    "summary": "3-4 sentence overview of the topic and its significance",
    "keyFacts": [
      "Specific fact 1 with numbers/names where possible",
      "Specific fact 2",
      "Specific fact 3",
      "Specific fact 4",
      "Specific fact 5"
    ],
    "keyPlayers": [
      {
        "name": "Person or organization name",
        "role": "Their role in this story"
      }
    ],
    "timeline": [
      {
        "date": "YYYY-MM or YYYY-MM-DD",
        "event": "What happened"
      }
    ],
    "malaysianContext": "How does this specifically affect or relate to Malaysia or Southeast Asia?",
    "suggestedSources": [
      {
        "outlet": "Publication or website name",
        "description": "Type of source and what they would likely report"
      }
    ],
    "possibleAngles": [
      "Alternative angle 1",
      "Alternative angle 2"
    ],
    "potentialQuotes": [
      {
        "speaker": "Who might say this",
        "quote": "Illustrative example of what they might say"
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
