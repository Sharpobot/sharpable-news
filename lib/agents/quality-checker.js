import { askWithSearch } from './_client.js'

/**
 * Agent 7: Quality Checker
 * Fact-checks the article against the research brief using live web search.
 * Verifies top 3-5 claims. Returns verdict: publish | review | reject.
 */
export async function qualityChecker(context = {}) {
  const { article, researchBrief, selectedTopic, seo } = context

  if (!article || !researchBrief) {
    return {
      ...context,
      qualityReport: null,
      qualityPassed: false,
    }
  }

  const bodyText = extractPlainText(article.body)

  const result = await askWithSearch(
    `You are a senior editor and fact-checker for Sharpable News, a Bahasa Malaysia tech news publication.
You check articles for factual accuracy using live web search to verify claims.
Search for the top 3 most critical factual claims in the article and verify each one.
If a claim cannot be verified via web search, flag it as "WAJIB: Fakta tidak dapat disahkan."
Be rigorous but fair. Flag real issues, not stylistic preferences.

CRITICAL SCORING RULES — YOU MUST FOLLOW THESE:
- overallScore MUST be a whole number between 1 and 100. NEVER return 0 unless every single check fails completely.
- "publish" verdict requires overallScore >= 80
- "review" verdict requires overallScore between 60 and 79
- "reject" verdict requires overallScore below 60
- Your verdict and overallScore MUST be consistent. A "review" verdict with score 0 is invalid.
- If you give a "review" verdict, overallScore must be 60-79. If "publish", must be 80-100.

Always respond with valid JSON only — no markdown, no extra text.`,

    `RESEARCH BRIEF (ground truth):
${JSON.stringify(researchBrief, null, 2)}

ARTICLE TO CHECK:
Headline: ${article.headlines?.[0] ?? '(no headline)'}
Summary: ${article.summary ?? '(no summary)'}
Body text:
${bodyText}

SEO metadata:
Slug: ${seo?.slug ?? '(none)'}
Meta description: ${seo?.metaDescription ?? '(none)'}
Tags: ${(seo?.tags ?? []).join(', ')}

INSTRUCTIONS:
PENTING: Lakukan MAKSIMUM 2 carian web sahaja. Semak hanya tuntutan fakta paling kritikal.
1. Use web search to verify the top 3 most critical factual claims in this article
2. For each claim you cannot verify via web search, add to requiredFixes: "WAJIB: Fakta tidak dapat disahkan: [the specific claim]"
3. Check Bahasa Malaysia quality, editorial standards, SEO compliance, and content completeness
4. Assign verdict: "publish" (score ≥80, no critical issues), "review" (score 60-79, minor fixes), "reject" (score <60, major issues)

Return a JSON object in this exact format:
{
  "verdict": "publish | review | reject",
  "overallScore": 85,
  "checks": {
    "factualAccuracy": {
      "score": 90,
      "issues": ["Issue 1 if any — prefix unverifiable facts with WAJIB:"],
      "passed": true
    },
    "bahasaMalaysiaQuality": {
      "score": 85,
      "issues": ["Grammar issue if any", "Awkward phrasing if any"],
      "passed": true
    },
    "editorialStandards": {
      "score": 80,
      "issues": ["Missing attribution if any", "Sensationalist headline if any"],
      "passed": true
    },
    "seoCompliance": {
      "score": 90,
      "issues": ["Slug too long if any", "Meta description too short if any"],
      "passed": true
    },
    "contentCompleteness": {
      "score": 85,
      "issues": ["Missing conclusion if any", "Intro too weak if any"],
      "passed": true
    }
  },
  "requiredFixes": [
    "Critical fix that must be done before publishing — prefix unverifiable facts with WAJIB:"
  ],
  "suggestions": [
    "Optional improvement"
  ],
  "publishReadiness": "ready | needs_minor_fixes | needs_major_revision"
}`,
    1200
  )

  const verdict = result.verdict ?? 'reject'
  const passed = verdict === 'publish'

  // Guard against LLM returning 0/null for score despite a non-reject verdict
  const rawScore = result.overallScore ?? 0
  const overallScore = rawScore > 0
    ? rawScore
    : verdict === 'publish' ? 82 : verdict === 'review' ? 65 : 0

  return {
    ...context,
    qualityReport: {
      verdict,
      overallScore,
      checks: result.checks ?? {},
      requiredFixes: result.requiredFixes ?? [],
      suggestions: result.suggestions ?? [],
      publishReadiness: result.publishReadiness ?? 'needs_major_revision',
    },
    qualityPassed: passed,
  }
}

/** Extract plain text from TipTap JSON body */
function extractPlainText(body) {
  if (!body || !body.content) return ''
  return body.content
    .map((node) => {
      if (node.type === 'paragraph' || node.type === 'heading') {
        return (node.content ?? []).map((c) => c.text ?? '').join('')
      }
      return ''
    })
    .filter(Boolean)
    .join('\n\n')
}
