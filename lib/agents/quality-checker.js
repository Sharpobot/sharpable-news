import { ask } from './_client.js'

/**
 * Agent 7: Quality Checker
 * Fact-checks the article against the research brief.
 * Checks Bahasa Malaysia language quality and editorial standards.
 * Returns a quality report and a pass/fail verdict.
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

  // Extract plain text from TipTap body for checking
  const bodyText = extractPlainText(article.body)

  const result = await ask(
    `You are a senior editor and fact-checker for Sharpable News, a Bahasa Malaysia tech news publication.
You check articles for factual accuracy, language quality, editorial standards, and readiness to publish.
Be rigorous but fair. Flag real issues, not stylistic preferences.
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

Evaluate this article on the following dimensions:

Return a JSON object in this exact format:
{
  "verdict": "pass | fail | pass_with_warnings",
  "overallScore": 85,
  "checks": {
    "factualAccuracy": {
      "score": 90,
      "issues": ["Issue 1 if any", "Issue 2 if any"],
      "passed": true
    },
    "bahasaMalaysiaQuality": {
      "score": 85,
      "issues": ["Grammar issue if any", "Awkward phrasing if any"],
      "passed": true
    },
    "editorialStandards": {
      "score": 80,
      "issues": ["Missing attribution", "Sensationalist headline", etc.],
      "passed": true
    },
    "seoCompliance": {
      "score": 90,
      "issues": ["Slug too long", "Meta description too short", etc.],
      "passed": true
    },
    "contentCompleteness": {
      "score": 85,
      "issues": ["Missing conclusion", "Intro too weak", etc.],
      "passed": true
    }
  },
  "requiredFixes": [
    "Critical fix 1 that must be done before publishing"
  ],
  "suggestions": [
    "Optional improvement 1"
  ],
  "publishReadiness": "ready | needs_minor_fixes | needs_major_revision"
}`
  )

  const verdict = result.verdict ?? 'fail'
  const passed = verdict === 'pass' || verdict === 'pass_with_warnings'

  return {
    ...context,
    qualityReport: {
      verdict,
      overallScore: result.overallScore ?? 0,
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
