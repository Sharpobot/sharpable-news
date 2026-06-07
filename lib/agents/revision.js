import { ask, SEARCH_AGENT_TIMEOUT_MS } from './_client.js'
import { STYLE_GUIDE } from './style-guide.js'

/**
 * Agent 8: Revision Agent
 * Takes an article that failed quality check and fixes the required issues.
 * Returns a revised article body, headlines, and summary.
 */
export async function revisionAgent(context = {}) {
  const { article, qualityReport, researchBrief, selectedTopic } = context

  if (!article || !qualityReport) {
    return context
  }

  const bodyText = extractPlainText(article.body)
  const requiredFixes = qualityReport.requiredFixes ?? []
  const suggestions = qualityReport.suggestions ?? []
  const checksWithIssues = Object.entries(qualityReport.checks ?? {})
    .filter(([, v]) => v.issues?.length > 0)
    .map(([k, v]) => `${k}: ${v.issues.join('; ')}`)

  const result = await ask(
    `Anda adalah editor kanan Sharpable News yang menyemak dan membaiki artikel.
Anda menerima artikel yang gagal semakan kualiti beserta senarai isu yang perlu diperbaiki.
Baiki SEMUA isu yang disenaraikan. Kekalkan fakta dari brief penyelidikan.
Ikut panduan gaya penulisan dengan ketat.

SASARAN SKOR: Artikel yang disemak MESTI mencapai skor 85/100 atau lebih mengikut piawaian Penyemak Kualiti Sharpable News. Setelah membetulkan semua isu yang disenaraikan, perbaiki secara proaktif mana-mana bahagian yang boleh meningkatkan skor: pengait pembukaan yang lebih kukuh, struktur perenggan yang lebih ketat, petikan yang lebih hidup dan spesifik, penutup yang lebih berimpak dan seimbang. Semakan BELUM SELESAI sehingga artikel layak mendapat 85+.

Sentiasa balas dengan JSON yang sah sahaja — tiada markdown, tiada teks tambahan.

${STYLE_GUIDE}`,

    `ARTIKEL ASAL:
Tajuk semasa: ${article.headlines?.[0] ?? '(tiada)'}
Badan artikel:
${bodyText}

LAPORAN KUALITI — VERDICT: ${qualityReport.verdict} (Skor: ${qualityReport.overallScore}/100)

ISU YANG MESTI DIBAIKI:
${requiredFixes.map((f, i) => `${i + 1}. ${f}`).join('\n')}

ISU DARIPADA SEMAKAN:
${checksWithIssues.map((c, i) => `${i + 1}. ${c}`).join('\n')}

CADANGAN (jika ada masa):
${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

BRIEF PENYELIDIKAN (untuk rujukan fakta):
${JSON.stringify(researchBrief, null, 2)}

ARAHAN PEMBETULAN:
- Baiki SEMUA isu yang disenaraikan di atas
- Kekalkan fakta yang benar dari brief penyelidikan
- Artikel akhir mesti 600–800 patah perkataan
- 3 tajuk baru (setiap satu di bawah 70 aksara)
- Tandakan setiap pembetulan yang dibuat dalam senarai "correctionsMade"

Kembalikan objek JSON dalam format TEPAT ini:
{
  "headlines": [
    "Tajuk disemak 1 (di bawah 70 aksara)",
    "Tajuk disemak 2 (di bawah 70 aksara)",
    "Tajuk disemak 3 (di bawah 70 aksara)"
  ],
  "summary": "Ringkasan artikel yang disemak",
  "body": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Teks perenggan pertama yang diperbaiki..." }]
      }
    ]
  },
  "wordCount": 720,
  "readingTimeMinutes": 3,
  "correctionsMade": [
    "Penerangan ringkas pembetulan 1 yang telah dibuat",
    "Penerangan ringkas pembetulan 2 yang telah dibuat"
  ]
}`
    ,
    5000,
    SEARCH_AGENT_TIMEOUT_MS
  )

  return {
    ...context,
    article: {
      headlines: result.headlines ?? article.headlines,
      summary: result.summary ?? article.summary,
      body: result.body ?? article.body,
      wordCount: result.wordCount ?? article.wordCount,
      readingTimeMinutes: result.readingTimeMinutes ?? article.readingTimeMinutes,
    },
    revisionCorrectionsMade: result.correctionsMade ?? [],
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
