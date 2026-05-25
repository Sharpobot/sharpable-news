import { ask } from './_client.js'
import { STYLE_GUIDE } from './style-guide.js'

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
dalam Bahasa Malaysia. Ikut panduan gaya penulisan di bawah dengan ketat.
Sentiasa balas dengan JSON yang sah sahaja — tiada markdown, tiada teks tambahan.

${STYLE_GUIDE}`,

    `Topik: ${selectedTopic.topic}
Sudut artikel: ${articleAngle ?? 'Eksplainer umum untuk pembaca Malaysia'}
Kategori: ${selectedTopic.category}

Ringkasan penyelidikan:
${JSON.stringify(researchBrief, null, 2)}

Tulis artikel berita penuh dalam Bahasa Malaysia (600–800 patah perkataan SAHAJA — jangan melebihi).
Ikut struktur 4 bahagian: Hook → Fakta & Penemuan → Konteks & Implikasi → Penutup.
Tajuk mesti tepat 3 pilihan, setiap satu di bawah 70 aksara.

WAJIB — SUBJUDUL: Artikel MESTI mengandungi TEPAT 3 heading type "heading" level 2 yang memisahkan bahagian-bahagian utama. Setiap subjudul hendaklah deskriptif, informatif, dan menggambarkan isi bahagian tersebut (bukan generik seperti "Bahagian 2"). Letakkan subjudul selepas 1–2 perenggan pembukaan, kemudian selepas setiap bahagian utama.

Kembalikan objek JSON dalam format TEPAT ini:
{
  "headlines": [
    "Tajuk 1 — langsung dan berita (di bawah 70 aksara)",
    "Tajuk 2 — sudut Malaysia/SEA (di bawah 70 aksara)",
    "Tajuk 3 — lebih naratif atau analitik (di bawah 70 aksara)"
  ],
  "summary": "1-2 ayat ringkasan artikel untuk kad preview",
  "body": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Perenggan pembukaan (hook)..." }]
      },
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Perenggan kedua pembukaan..." }]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "Subjudul Deskriptif Bahagian 1" }]
      },
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Isi bahagian 1..." }]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "Subjudul Deskriptif Bahagian 2" }]
      },
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Isi bahagian 2..." }]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "Subjudul Deskriptif Bahagian 3" }]
      },
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Penutup dan rumusan..." }]
      }
    ]
  },
  "wordCount": 720,
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
