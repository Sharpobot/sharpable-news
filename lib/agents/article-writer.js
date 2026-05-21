import { ask } from './_client.js'

/**
 * Agent 4: Article Writer
 * Writes a full Bahasa Malaysia article from the research brief.
 * Returns 3 headline options, a summary, and TipTap-compatible JSON body.
 */
export async function articleWriter(context = {}) {
  const { selectedTopic, researchBrief, articleAngle } = context

  if (!selectedTopic || !researchBrief) {
    return {
      ...context,
      article: null,
    }
  }

  const result = await ask(
    `Anda adalah penulis berita kanan untuk Sharpable News, sebuah penerbitan berita AI dan teknologi
dalam Bahasa Malaysia. Gaya penulisan anda tajam, moden, dan mudah difahami.
Tulis dalam Bahasa Malaysia yang betul tetapi tidak terlalu formal — gunakan gaya editorial semasa.
Istilah teknikal boleh dibiarkan dalam Bahasa Inggeris jika tiada padanan BM yang natural.
Sentiasa balas dengan JSON yang sah sahaja — tiada markdown, tiada teks tambahan.`,

    `Topik: ${selectedTopic.topic}
Sudut artikel: ${articleAngle ?? 'Eksplainer umum untuk pembaca Malaysia'}
Kategori: ${selectedTopic.category}

Ringkasan penyelidikan:
${JSON.stringify(researchBrief, null, 2)}

Tulis artikel berita penuh dalam Bahasa Malaysia (600-900 patah perkataan).
Artikel mesti mempunyai:
- Intro yang kuat (lead paragraph yang menarik perhatian)
- Badan artikel dengan fakta, konteks, dan analisis
- Kesimpulan yang menghubungkan kepada pembaca Malaysia

Kembalikan objek JSON dalam format TEPAT ini:
{
  "headlines": [
    "Tajuk pilihan 1 — kuat dan langsung",
    "Tajuk pilihan 2 — lebih deskriptif",
    "Tajuk pilihan 3 — sudut berbeza atau lebih santai"
  ],
  "summary": "1-2 ayat ringkasan artikel untuk kad preview",
  "body": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Teks perenggan pertama di sini..." }]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "Subjudul di sini" }]
      },
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Teks perenggan seterusnya..." }]
      }
    ]
  },
  "wordCount": 750,
  "readingTimeMinutes": 3
}`
  )

  return {
    ...context,
    article: {
      headlines: result.headlines ?? [],
      summary: result.summary ?? '',
      body: result.body ?? null,
      wordCount: result.wordCount ?? 0,
      readingTimeMinutes: result.readingTimeMinutes ?? 3,
    },
  }
}
