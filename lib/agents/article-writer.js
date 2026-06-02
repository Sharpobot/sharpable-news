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

Tulis artikel berita penuh dalam Bahasa Malaysia (700–900 patah perkataan).
Tajuk mesti tepat 3 pilihan, setiap satu di bawah 70 aksara.

PERATURAN KRITIKAL — BACA SEBELUM MENULIS:
1. HOOK WAJIB: Perenggan PERTAMA mesti buka dengan individu sebenar yang BERNAMA (ciptakan nama Malaysia yang munasabah jika tiada dalam penyelidikan) dengan jawatan/konteks konkrit, diikuti petikan langsung daripada individu tersebut. Contoh format: "Bagi [Nama], [jawatan/konteks], [situasi yang dia hadapi]. '[Petikan langsung],' katanya."
2. BOOKENDING WAJIB: Balik kepada individu yang sama di tengah atau akhir artikel untuk tutup kisah peribadinya.
3. SUBJUDUL: Artikel MESTI mengandungi 3–5 heading level 2. Subjudul BOLEH berbentuk soalan (contoh: "Soalan Ketepatan: 40% Lebih Baik Dari Apa?"). Subjudul terakhir boleh pendek dan forward-looking (contoh: "Masa Akan Menentukan").
4. NOMBOR: Setiap bahagian mesti ada sekurang-kurangnya satu statistik atau nombor spesifik.
5. PETIKAN PAKAR: Setiap petikan mesti ada nama penuh DAN jawatan/kelayakan.
6. PENUTUP: Realistik, bukan hype. Timbang peluang DAN cabaran yang masih ada.

Ikut CONTOH ARTIKEL RUJUKAN dalam panduan gaya di atas sebagai model nada, ritma, dan struktur.

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
        "content": [{ "type": "text", "text": "Isi bahagian 3..." }]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "Subjudul Bahagian 4 (atau Masa Akan Menentukan)" }]
      },
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Penutup realistik — peluang vs. cabaran yang masih ada..." }]
      }
    ]
  },
  "wordCount": 800,
  "readingTimeMinutes": 4
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
