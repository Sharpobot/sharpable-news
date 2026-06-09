import { ask } from './_client.js'
import { STYLE_GUIDE } from './style-guide.js'

/**
 * Agent 2: Topic Selector
 * Produces exactly 3 distinct topic options for human-in-the-loop selection.
 * Each option covers a different story/event — never 3 angles on the same topic.
 * Returns topicOptions: Array<{ topic, summary, category, angle, sourceName, sourceUrl }>
 */
export async function topicSelector(context = {}) {
  const { trends = [], existingArticles = [], topicDirection = null } = context

  if (trends.length === 0) {
    return { ...context, topicOptions: [] }
  }

  const recentBlock = existingArticles.length > 0
    ? `\nARTIKEL YANG BARU DITERBITKAN (14 hari lepas — ELAKKAN topik terlalu serupa):\n${
        existingArticles.map((a, i) => `${i + 1}. "${a.title}" (${a.slug})`).join('\n')
      }\n`
    : ''

  const semanticRanking = topicDirection
    ? `\nTOPIC DIRECTION: "${topicDirection}"

SEMANTIC RANKING TASK: Use your language understanding — NOT keyword matching — to score every candidate
in the trends list above from 0 to 10 based on semantic relevance to this topic direction.
  Score 10 = directly and clearly about this topic
  Score 5  = tangentially related or overlapping theme
  Score 0  = unrelated

Select the 3 highest-scoring candidates as your topic options.
If fewer than 3 candidates score above 6, fill the remaining slots with the next-highest scoring results.
Always return exactly 3 options regardless.\n`
    : `\nNo topic direction provided. Select the 3 most interesting and newsworthy stories
for a Malaysian AI/tech audience based on global significance, Malaysian relevance, and reader interest.\n`

  const result = await ask(
    `You are a senior editor for Sharpable News, a Bahasa Malaysia AI/tech news publication.
Your audience: tech-savvy Malaysians aged 20-40, bilingual (BM/English), interested in how
global technology affects their daily lives and career.

Use the following style guide ONLY when writing the topic card titles, summaries, and angles —
so their tone, vocabulary, and naturalness match the publication's voice:

${STYLE_GUIDE}

Always respond with valid JSON only — no markdown, no extra text.`,

    `Here are the trending topics identified by our trend scout:

${JSON.stringify(trends, null, 2)}
${recentBlock}${semanticRanking}
Return EXACTLY 3 topic options for the editor to choose from.

STRICT RULES:
1. Each option MUST be a completely different story/event — do NOT return 3 variations of the same topic.
2. Cover different categories where possible (e.g. one AI policy, one product launch, one research breakthrough).
3. Avoid topics semantically identical to any recently published article listed above.
4. Each option must support a substantive 600-700 word Bahasa Malaysia article.
5. Rank by reader interest (option 1 = strongest pick for Malaysian audience).

TAJUK TOPIK — NADA DAN GAYA WAJIB:
Tajuk pada setiap kad topik mesti berbunyi seperti tajuk berita dalam media digital Malaysia moden —
gaya Says.com atau Malaysiakini, bukan terjemahan terus dari Inggeris, bukan kaku, bukan laporan kerajaan.
Bayangkan anda sedang beritahu kawan sesuatu yang menarik yang baru berlaku dalam dunia AI.
Perbualan, langsung, sedikit santai tapi boleh dipercayai. Bukan gaya Dewan Bahasa. Bukan kenyataan akhbar.

CONTOH TAJUK YANG BAIK — tiru nada ini:
✓ "Anthropic Minta Semua Lab AI Berhenti Sebentar — Sebelum Terlambat"
✓ "ChatGPT Kini Ingat Segalanya Tentang Anda — Ramai Tak Sedar"
✓ "Pelabur Dunia Tinggalkan 220 Syarikat Teknologi — Salah Mereka Sendiri?"
✓ "Google Gemini Tewaskan Model Gergasi — Tapi Ada Satu Masalah Besar"
✓ "AI Dah Tulis 80% Kod Anthropic — Pengaturcara Masih Relevan?"

CONTOH TAJUK YANG MESTI DIELAKKAN:
✗ "220 Unicorn Gugur Kerana Bukan AI-First" — terjemahan terus, tidak natural dalam BM
✗ "Kecerdasan Buatan Mencipta Profil Pengguna Secara Autonomi" — terlalu formal dan kaku
✗ "Great American AI Act: AS Mahu Sekat Negeri Kawal AI Selama 3 Tahun" — separuh Inggeris separuh Melayu
✗ "Syarikat-Syarikat Teknologi Mengalami Kejatuhan Nilai" — bunyi seperti laporan rasmi kerajaan

Return this exact JSON format:
{
  "topicOptions": [
    {
      "topic": "Tajuk kad topik dalam BM natural — gaya Says.com/Malaysiakini (max 80 aksara)",
      "summary": "One sentence: what happened and why it matters to Malaysian readers.",
      "category": "AI | Tech | Business | Society | Science",
      "angle": "The specific article hook for Sharpable News — what unique perspective will we take?",
      "sourceName": "Primary publication or website name that reported this",
      "sourceUrl": "Direct URL to primary source article, or null if unavailable"
    },
    {
      "topic": "...",
      "summary": "...",
      "category": "...",
      "angle": "...",
      "sourceName": "...",
      "sourceUrl": "..."
    },
    {
      "topic": "...",
      "summary": "...",
      "category": "...",
      "angle": "...",
      "sourceName": "...",
      "sourceUrl": "..."
    }
  ]
}`,
    1000
  )

  return {
    ...context,
    topicOptions: result.topicOptions ?? [],
  }
}
