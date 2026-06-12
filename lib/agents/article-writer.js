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

  // Secondary source/reference instruction (temporarily disabled):
  // const REFERENCE_INSTRUCTION = 'Gunakan CONTOH ARTIKEL RUJUKAN dalam panduan gaya di atas sebagai panduan NADA dan SUARA sahaja — bukan sebagai templat untuk disalin. Setiap artikel mesti ada keperibadian, pembukaan, dan penutup yang berbeza mengikut topiknya. Jangan guna frasa, struktur ayat, atau format yang sama dengan contoh tersebut secara langsung. Yang perlu dikekalkan: gaya editorial yang matang, kritis, dan berasaskan fakta — bukan susun atur atau ayat yang sama.'

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

TAJUK BERITA — NADA DAN GAYA WAJIB:
Tajuk mesti berbunyi seperti tajuk berita dalam media digital Malaysia moden — gaya Says.com atau
Malaysiakini. Bukan terjemahan terus dari Inggeris. Bukan kaku. Bukan laporan kerajaan.
Bayangkan anda sedang beritahu kawan sesuatu yang menarik yang baru berlaku dalam dunia AI.
Perbualan, langsung, sedikit santai tapi boleh dipercayai. Bukan gaya Dewan Bahasa. Bukan kenyataan akhbar.

CONTOH TAJUK YANG BAIK — tiru nada ini tepat-tepat:
✓ "Anthropic Minta Semua Lab AI Berhenti Sebentar — Sebelum Terlambat"
✓ "ChatGPT Kini Ingat Segalanya Tentang Anda — Ramai Tak Sedar"
✓ "Pelabur Dunia Tinggalkan 220 Syarikat Teknologi — Salah Mereka Sendiri?"
✓ "Google Gemini Tewaskan Model Gergasi — Tapi Ada Satu Masalah Besar"
✓ "AI Dah Tulis 80% Kod Anthropic — Pengaturcara Masih Relevan?"

CONTOH TAJUK YANG MESTI DIELAKKAN — jangan pernah tulis seperti ini:
✗ "220 Unicorn Gugur Kerana Bukan AI-First" — terjemahan terus, tidak natural dalam BM
✗ "Kecerdasan Buatan Mencipta Profil Pengguna Secara Autonomi" — terlalu formal dan kaku
✗ "Great American AI Act: AS Mahu Sekat Negeri Kawal AI Selama 3 Tahun" — separuh Inggeris separuh Melayu
✗ "Syarikat-Syarikat Teknologi Mengalami Kejatuhan Nilai" — bunyi seperti laporan rasmi kerajaan

Pola tajuk yang berkesan: [Subjek] + [Aksi/Perkembangan] + [— Implikasi/Soalan/Twist]
Contoh pola: "ChatGPT Kini Ingat Segalanya Tentang Anda — Ramai Tak Sedar"
Boleh guna soalan retorik di hujung untuk buat pembaca terus membaca.

PERATURAN KRITIKAL — BACA SEBELUM MENULIS:
1. HOOK WAJIB: Perenggan PERTAMA mesti buka dengan individu sebenar yang BERNAMA (ciptakan nama Malaysia yang munasabah jika tiada dalam penyelidikan) dengan jawatan/konteks konkrit, diikuti petikan langsung daripada individu tersebut. Contoh format: "Bagi [Nama], [jawatan/konteks], [situasi yang dia hadapi]. '[Petikan langsung],' katanya."
2. BOOKENDING WAJIB: Balik kepada individu yang sama di tengah atau akhir artikel untuk tutup kisah peribadinya.
3. SUBJUDUL: Artikel MESTI mengandungi 3–5 heading level 2. Subjudul BOLEH berbentuk soalan (contoh: "Soalan Ketepatan: 40% Lebih Baik Dari Apa?"). Subjudul terakhir boleh pendek dan forward-looking (contoh: "Masa Akan Menentukan").
4. NOMBOR: Setiap bahagian mesti ada sekurang-kurangnya satu statistik atau nombor spesifik.
5. PETIKAN PAKAR: Setiap petikan mesti ada nama penuh DAN jawatan/kelayakan.
6. PENUTUP: Realistik, bukan hype. Timbang peluang DAN cabaran yang masih ada.

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
    ,
    4000
  )

  // ── Markdown code-fence fallback ────────────────────────────────────────
  // If the shared parser couldn't extract JSON (e.g. response wrapped in
  // ```json ... ``` fences it didn't strip), strip the fences here and retry.
  if (result.raw) {
    const cleaned = String(result.raw).replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    try {
      const reparsed = JSON.parse(cleaned)
      Object.assign(result, reparsed)
      delete result.raw
    } catch {
      // still unparseable — fall through to diagnostic logging below
    }
  }

  if (result.raw) {
    console.log('[article-writer] ⚠️ JSON parse failed — raw response (first 1000 chars):')
    console.log(String(result.raw).slice(0, 1000))
  } else {
    console.log('[article-writer] parsed result keys:', Object.keys(result))
  }

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
