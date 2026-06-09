'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Footer from './components/Footer'

/* ── Tag helpers ──────────────────────────────────────────── */
const TAG_CLASSES = {
  penyelidikan: 't-research', research: 't-research',
  analisis: 't-analysis',    analysis: 't-analysis',
  permulaan: 't-startups',   startups: 't-startups',
  dasar: 't-policy',         policy: 't-policy',
  alatan: 't-tools',         tools: 't-tools',
  industri: 't-industry',    industry: 't-industry',
}
function tagClass(tag) { return TAG_CLASSES[tag?.toLowerCase()] ?? 't-research' }
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ── Author photo (falls back to CSS avatar circle) ──────── */
function AuthorPip({ author, size = 24 }) {
  if (author?.photo_url) {
    return (
      <img
        src={author.photo_url}
        alt={author.name ?? ''}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return <span className="avatar" />
}

/* ── Shared placeholder styles ───────────────────────────── */
const PH_BADGE = {
  fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'rgba(237,232,223,0.35)',
  border: '1px solid rgba(237,232,223,0.15)',
  padding: '2px 7px', borderRadius: '3px',
  fontFamily: '"DM Sans", sans-serif', display: 'inline-block',
}
const PH = { opacity: 0.48, cursor: 'default', pointerEvents: 'none' }

/* ── Placeholder pools (used when real article slot is empty) ── */
const TERKINI_PH = [
  { id:'ph-1',  tags:['Penyelidikan'], title:'Google DeepMind Perkenal Pengganti AlphaFold dengan Pemodelan Interaksi Protein Penuh', meta_description:'Versi terbaharu melampaui lipatan protein tunggal untuk memetakan interaksi pelbagai protein yang kompleks.', featured_image:'https://picsum.photos/seed/deepmind-protein/800/500',   created_at:'2026-05-18T00:00:00Z', authors:{name:'Priya Menon'} },
  { id:'ph-2',  tags:['Permulaan'],    title:'Model Sumber Terbuka Mistral Mengatasi GPT-4 dalam Penanda Aras Penaakulan Undang-Undang', meta_description:'Keluaran terbaharu makmal Paris ini menarik perhatian syarikat korporat besar.', featured_image:'https://picsum.photos/seed/mistral-paris/800/500',   created_at:'2026-05-17T00:00:00Z', authors:{name:'Thomas Laurent'} },
  { id:'ph-3',  tags:['Analisis'],     title:'Ekonomi Tersembunyi Menjalankan LLM dalam Skala Besar: Pecahan Kos Penuh', meta_description:'Di sebalik setiap panggilan API tersembunyi rangkaian kluster GPU dan kontrak kuasa.', featured_image:'https://picsum.photos/seed/datacenter-gpu/800/500',   created_at:'2026-05-17T00:00:00Z', authors:{name:'Elena Vasquez'} },
  { id:'ph-4',  tags:['Dasar'],        title:'Akta AI EU Masuk Fasa Kedua: Syarikat Malaysia Perlu Bersedia untuk Audit Pematuhan', meta_description:'Fasa penguatkuasaan penuh bermula suku ketiga 2026.', featured_image:'https://picsum.photos/seed/eu-policy-law/800/500',   created_at:'2026-05-16T00:00:00Z', authors:{name:'Sofia Reyes'} },
  { id:'ph-5',  tags:['Alatan'],       title:'Cursor Melancarkan Mod Ejen: Pembangun Boleh Serahkan Keseluruhan Tugasan kepada AI', meta_description:'Kemas kini terbesar Cursor sejak pelancaran mengubah cara pembangun berinteraksi dengan kod.', featured_image:'https://picsum.photos/seed/cursor-ide-dev/800/500',   created_at:'2026-05-15T00:00:00Z', authors:{name:'James Whitfield'} },
  { id:'ph-6',  tags:['Industri'],     title:'NVIDIA Catat Hasil Suku Tahunan Rekod $44 Bilion Didorong Permintaan GPU Pusat Data', meta_description:'Jenama H100 dan H200 terus mendominasi pasaran dengan senarai tunggu berbulan-bulan.', featured_image:'https://picsum.photos/seed/nvidia-chip-gpu/800/500',   created_at:'2026-05-14T00:00:00Z', authors:{name:'Marcus Chen'} },
]

export default function HomePageClient({ articles = [] }) {

  /* ── Sequential slot assignment — no duplicates across page ── */
  let cursor = 0
  const next = () => articles[cursor++] ?? null

  // Hero (5 slots)
  const heroMain = next()
  const heroSide = [next(), next(), next(), next()]

  // Terkini grid — exactly 3 slots, 1×3 single row
  const terkiniSlots = [next(), next(), next()]

  // Trending (4 slots)
  const trendItems = [next(), next(), next(), next()]

  // Deep Dive (5 slots)
  const deepMain  = next()
  const deepStack = [next(), next(), next(), next()]

  // Research Spotlight (5 slots)
  const researchMain = next()
  const researchSide = [next(), next(), next(), next()]

  // Startup Watch (5 slots)
  const startupMain = next()
  const startupSide = [next(), next(), next(), next()]

  // More from Sharpable (3 slots)
  const moreCards = [next(), next(), next()]

  /* ── Scroll-reveal ── */
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.style.transition = 'opacity 0.55s ease, transform 0.55s ease'
          en.target.style.opacity = '1'
          en.target.style.transform = 'translateY(0)'
          io.unobserve(en.target)
        }
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })

    document.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.opacity = '0'
      el.style.transform = 'translateY(18px)'
      el.style.transitionDelay = `${(i % 4) * 0.07}s`
      io.observe(el)
    })

    return () => { io.disconnect() }
  }, [])

  return (
    <>
      {/* ═══════════ BREAKING TICKER ═══════════ */}
      <div className="ticker-bar">
        <div className="ticker-label">LIVE</div>
        <div className="ticker-track-wrap">
          <div className="ticker-track">
            <span className="ticker-item">OpenAI umumkan pratonton penyelidikan GPT-5 untuk pelanggan korporat</span>
            <span className="ticker-item">Anthropic perluaskan API Claude ke 40 negara baharu</span>
            <span className="ticker-item">Gemini Ultra Google DeepMind catat rekod MMLU baharu pada 92.4%</span>
            <span className="ticker-item">Penguatkuasaan Akta AI EU bermula — audit pertama sedang berjalan di 12 negara anggota</span>
            <span className="ticker-item">Microsoft integrasikan Copilot merentas keseluruhan suite Office 365</span>
            <span className="ticker-item">Mistral terbitkan model 47B parameter di bawah lesen MIT</span>
            <span className="ticker-item">Makmal AI Meta ambil 10 penyelidik kanan dari OpenAI</span>
            <span className="ticker-item">Y Combinator W26: 38% syarikat adalah berasaskan AI</span>
            <span className="ticker-item">OpenAI umumkan pratonton penyelidikan GPT-5 untuk pelanggan korporat</span>
            <span className="ticker-item">Anthropic perluaskan API Claude ke 40 negara baharu</span>
            <span className="ticker-item">Gemini Ultra Google DeepMind catat rekod MMLU baharu pada 92.4%</span>
            <span className="ticker-item">Penguatkuasaan Akta AI EU bermula — audit pertama sedang berjalan di 12 negara anggota</span>
            <span className="ticker-item">Microsoft integrasikan Copilot merentas keseluruhan suite Office 365</span>
            <span className="ticker-item">Mistral terbitkan model 47B parameter di bawah lesen MIT</span>
            <span className="ticker-item">Makmal AI Meta ambil 10 penyelidik kanan dari OpenAI</span>
            <span className="ticker-item">Y Combinator W26: 38% syarikat adalah berasaskan AI</span>
          </div>
        </div>
      </div>

      {/* ═══════════ HERO ═══════════ */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid" style={{ opacity: 0, animation: 'fadeUp 0.75s ease 0.05s forwards' }}>

            {/* Hero main */}
            {heroMain ? (
              <div className="hero-main">
                <Link href={`/artikel/${heroMain.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
                  <div className="hero-img">
                    <img
                      className="hero-photo"
                      src={heroMain.featured_image ?? `https://picsum.photos/seed/${heroMain.slug}/1200/675`}
                      alt={heroMain.title}
                    />
                  </div>
                </Link>
                <div className="eyebrow"><span className="eyebrow-dot"></span>Rencana Utama</div>
                <Link href={`/artikel/${heroMain.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h1 className="hero-title">{heroMain.title}</h1>
                </Link>
                <p className="hero-excerpt">{heroMain.meta_description}</p>
                <div className="meta-row">
                  <span className="meta-author">
                    <AuthorPip author={heroMain.authors} />
                    {heroMain.authors?.name ?? 'Sharpable News'}
                  </span>
                  <span className="meta-sep">·</span>
                  <span>{fmtDate(heroMain.created_at)}</span>
                  <span className="meta-sep">·</span>
                  <span className="read-clock">{heroMain.read_time} min baca</span>
                  {heroMain.tags?.[0] && (
                    <span className={`tag ${tagClass(heroMain.tags[0])}`}>{heroMain.tags[0]}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="hero-main" style={PH}>
                <div className="hero-img">
                  <img className="hero-photo" src="https://picsum.photos/seed/openai-lab/1200/675" alt="AI research laboratory" />
                </div>
                <div className="eyebrow"><span className="eyebrow-dot"></span>Rencana Utama</div>
                <h1 className="hero-title">Perlumbaan ke AGI: Di Sebalik Program Penyelidikan Paling Berani OpenAI</h1>
                <p className="hero-excerpt">Apabila sempadan kecerdasan mesin semakin pesat berkembang, inisiatif dalaman terbaharu OpenAI bertujuan menyelesaikan penaakulan jangka panjang — keupayaan yang diyakini kebanyakan penyelidik sebagai jurang antara LLM masa kini dan sesuatu yang benar-benar transformatif.</p>
                <div className="meta-row">
                  <span className="meta-author"><span className="avatar"></span>Marcus Chen</span>
                  <span className="meta-sep">·</span>
                  <span>18 Mei 2026</span>
                  <span className="meta-sep">·</span>
                  <span className="read-clock">9 min baca</span>
                  <span className="tag t-research">Penyelidikan</span>
                </div>
              </div>
            )}

            {/* Hero sidebar */}
            <div className="hero-sidebar">
              <div className="sidebar-header">Berita Utama</div>
              <div className="sidebar-list">
                {heroSide.map((a, i) => a ? (
                  <Link key={a.id} href={`/artikel/${a.slug}`} className="sidebar-item" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div className="s-cat">{a.tags?.[0] ?? 'Umum'}</div>
                    <div className="s-title">{a.title}</div>
                    <div className="s-meta">{a.authors?.name ?? 'Sharpable News'} · {a.read_time} min</div>
                  </Link>
                ) : (
                  <div key={`hph-${i}`} className="sidebar-item" style={PH}>
                    {i === 0 && <><div className="s-cat">Permulaan</div><div className="s-title">Anthropic Kumpul $3.5 Bilion Apabila Pelaburan Keselamatan AI Capai Paras Tertinggi</div><div className="s-meta"><span style={PH_BADGE}>Akan Datang</span></div></>}
                    {i === 1 && <><div className="s-cat">Analisis</div><div className="s-title">Sempadan Baharu AI Bukan Kecerdasan — Ia Adalah Ingatan</div><div className="s-meta"><span style={PH_BADGE}>Akan Datang</span></div></>}
                    {i === 2 && <><div className="s-cat">Dasar</div><div className="s-title">Fasa Kedua Akta AI EU Bermula: Apa Yang Perlu Diketahui Setiap Syarikat</div><div className="s-meta"><span style={PH_BADGE}>Akan Datang</span></div></>}
                    {i === 3 && <><div className="s-cat">Alatan</div><div className="s-title">Mod Agen Baharu Cursor Mengubah Cara Pembangun Bekerja Secara Menyeluruh</div><div className="s-meta"><span style={PH_BADGE}>Akan Datang</span></div></>}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* ═══════════ LATEST — exactly 6 slots, 3×2 grid ═══════════ */}
      <section className="section">
        <div className="container">
          <div className="sec-head">
            <div className="sec-label">Terkini</div>
            <a href="#" className="view-all">Lihat semua →</a>
          </div>
          <div className="cards-grid">
            {terkiniSlots.map((card, i) => {
              if (!card) {
                const ph = TERKINI_PH[i] ?? TERKINI_PH[i % TERKINI_PH.length]
                return (
                  <div key={`tkph-${i}`} className="card reveal" style={PH}>
                    <div className="card-img">
                      <div className={`card-img-inner ci-${(i % 6) + 1}`}>
                        <img className="card-photo" src={ph.featured_image} alt={ph.title} />
                      </div>
                    </div>
                    <div className="card-cat"><span style={PH_BADGE}>Akan Datang</span></div>
                    <h3 className="card-title">{ph.title}</h3>
                    <p className="card-excerpt">{ph.meta_description}</p>
                    <div className="card-meta">
                      <span>{ph.authors?.name}</span>
                      <span className="dot" />
                      <span>{fmtDate(ph.created_at)}</span>
                    </div>
                  </div>
                )
              }
              return (
                <Link key={card.id} href={`/artikel/${card.slug}`} className="card reveal" style={{ textDecoration: 'none' }}>
                  <div className="card-img">
                    <div className={`card-img-inner ci-${(i % 6) + 1}`}>
                      <img
                        className="card-photo"
                        src={card.featured_image ?? `https://picsum.photos/seed/${card.slug}/800/500`}
                        alt={card.title}
                      />
                    </div>
                  </div>
                  <div className="card-cat">
                    {card.tags?.[0] && <span className={`tag ${tagClass(card.tags[0])}`}>{card.tags[0]}</span>}
                  </div>
                  <h3 className="card-title">{card.title}</h3>
                  {card.meta_description && <p className="card-excerpt">{card.meta_description}</p>}
                  <div className="card-meta">
                    <AuthorPip author={card.authors} size={18} />
                    <span>{card.authors?.name ?? 'Sharpable News'}</span>
                    <span className="dot" />
                    <span>{fmtDate(card.created_at)}</span>
                    <span className="dot" />
                    <span className="read-clock">{card.read_time} min baca</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* ═══════════ TRENDING ═══════════ */}
      <div className="trending-strip">
        <div className="container">
          <div className="sec-head">
            <div className="sec-label">Sedang Trending</div>
          </div>
          <div className="trending-grid">
            {trendItems.map((a, i) => a ? (
              <Link key={a.id} href={`/artikel/${a.slug}`} className="trending-item reveal" style={{ textDecoration: 'none', color: 'inherit' }}>
                <span className="trend-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="trend-body">
                  <div className="trend-cat">
                    {a.tags?.[0] && <span className={`tag ${tagClass(a.tags[0])}`}>{a.tags[0]}</span>}
                  </div>
                  <div className="trend-title">{a.title}</div>
                  <div className="trend-meta">{fmtDate(a.created_at)} · {a.read_time} min baca</div>
                </div>
              </Link>
            ) : (
              <div key={`tph-${i}`} className="trending-item reveal" style={PH}>
                <span className="trend-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="trend-body">
                  <div className="trend-cat">
                    {[<span key="t" className="tag t-industry">Industri</span>, <span key="t" className="tag t-tools">Alatan</span>, <span key="t" className="tag t-policy">Dasar</span>, <span key="t" className="tag t-research">Penyelidikan</span>][i]}
                  </div>
                  <div className="trend-title">
                    {["Sam Altman: 'Kita Mungkin Saksikan Sistem AI Mampu Menjalankan Penyelidikan Saintifik Baharu Menjelang 2026'", 'Cursor lwn GitHub Copilot lwn Windsurf: Perbandingan Jujur Seorang Pembangun pada 2026', 'Majlis AI Negara China Keluarkan Garis Panduan Baharu untuk Penggunaan Model Domestik', 'Keterepretasian Mekanistik Hasilkan Kejayaan dalam Memahami Kepala Perhatian Model AI'][i]}
                  </div>
                  <div className="trend-meta"><span style={PH_BADGE}>Akan Datang</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ DEEP DIVE ═══════════ */}
      <section className="section">
        <div className="container">
          <div className="sec-head">
            <div className="sec-label">Liputan Mendalam</div>
            <a href="#" className="view-all">Lihat semua →</a>
          </div>
          <div className="deep-grid">

            {deepMain ? (
              <Link href={`/artikel/${deepMain.slug}`} className="featured-card reveal" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card-img">
                  <div className="card-img-inner ci-4">
                    <img className="card-photo" src={deepMain.featured_image ?? `https://picsum.photos/seed/${deepMain.slug}/800/600`} alt={deepMain.title} />
                  </div>
                </div>
                <div className="card-cat" style={{ marginBottom: '10px' }}>
                  {deepMain.tags?.[0] && <span className={`tag ${tagClass(deepMain.tags[0])}`}>{deepMain.tags[0]}</span>}
                </div>
                <h3 className="card-title" style={{ fontSize: '27px', marginBottom: '13px' }}>{deepMain.title}</h3>
                <p className="card-excerpt" style={{ fontSize: '15px', marginBottom: '16px' }}>{deepMain.meta_description}</p>
                <div className="card-meta">
                  <AuthorPip author={deepMain.authors} />
                  <span className="meta-author">{deepMain.authors?.name ?? 'Sharpable News'}</span>
                  <span className="dot"></span>
                  <span>{fmtDate(deepMain.created_at)}</span>
                  <span className="dot"></span>
                  <span>{deepMain.read_time} min</span>
                </div>
              </Link>
            ) : (
              <div className="featured-card reveal" style={PH}>
                <div className="card-img">
                  <div className="card-img-inner ci-4">
                    <img className="card-photo" src="https://picsum.photos/seed/memory-brain-ai/800/600" alt="Ingatan dan AI" />
                  </div>
                </div>
                <div className="card-cat" style={{ marginBottom: '10px' }}><span style={PH_BADGE}>Akan Datang</span></div>
                <h3 className="card-title" style={{ fontSize: '27px', marginBottom: '13px' }}>Sempadan Baharu AI Bukan Kecerdasan — Ia Adalah Ingatan</h3>
                <p className="card-excerpt" style={{ fontSize: '15px', marginBottom: '16px' }}>Bidang ini terpaku pada penanda aras untuk penaakulan dan pengekodan. Tetapi model yang akan mengubah dunia kerja pengetahuan berkongsi satu ciri yang kurang dihargai: keupayaan untuk mengingat.</p>
                <div className="card-meta">
                  <span className="meta-author"><span className="avatar"></span>David Okafor</span>
                  <span className="dot"></span><span>14 Mei 2026</span>
                  <span className="dot"></span><span>11 min</span>
                </div>
              </div>
            )}

            <div className="stack-list">
              {deepStack.map((a, i) => {
                const ci = [5, 6, 1, 3][i]
                const phData = [
                  { seed: 'bigtech-acquire', alt: 'Penyatuan teknologi', cat: 't-startups', label: 'Permulaan', title: 'Penyatuan Senyap: Bagaimana Gergasi Teknologi Menyerap Ekosistem Syarikat Permulaan AI' },
                  { seed: 'ai-agent-robot',  alt: 'Automasi AI',        cat: 't-tools',    label: 'Alatan',    title: 'Melampaui Autolengkap: Gelombang Baharu Ejen AI yang Benar-Benar Menghasilkan Produk' },
                  { seed: 'law-court-policy',alt: 'Dasar AI',            cat: 't-policy',   label: 'Dasar',     title: 'Liabiliti di Era AI: Siapa Menanggung Akibat Apabila Model Tersasar Secara Bencana?' },
                  { seed: 'nvidia-chip',     alt: 'GPU semikonduktor',   cat: 't-industry', label: 'Industri',  title: 'Platform NIM NVIDIA Senyap-Senyap Menjadi Kubernetes untuk Inferens AI' },
                ][i]
                return a ? (
                  <Link key={a.id} href={`/artikel/${a.slug}`} className="stack-item reveal" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className={`stack-thumb ci-${ci}`}>
                      <img className="stack-photo" src={a.featured_image ?? `https://picsum.photos/seed/${a.slug}/180/130`} alt={a.title} />
                    </div>
                    <div className="stack-body">
                      <div className="stack-cat">
                        {a.tags?.[0] && <span className={`tag ${tagClass(a.tags[0])}`}>{a.tags[0]}</span>}
                      </div>
                      <div className="stack-title">{a.title}</div>
                      <div className="stack-meta">{a.authors?.name ?? 'Sharpable News'} · {fmtDate(a.created_at)} · {a.read_time} min</div>
                    </div>
                  </Link>
                ) : (
                  <div key={`dsph-${i}`} className="stack-item reveal" style={PH}>
                    <div className={`stack-thumb ci-${ci}`}>
                      <img className="stack-photo" src={`https://picsum.photos/seed/${phData.seed}/180/130`} alt={phData.alt} />
                    </div>
                    <div className="stack-body">
                      <div className="stack-cat"><span className={`tag ${phData.cat}`}>{phData.label}</span></div>
                      <div className="stack-title">{phData.title}</div>
                      <div className="stack-meta"><span style={PH_BADGE}>Akan Datang</span></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* ═══════════ RESEARCH SPOTLIGHT ═══════════ */}
      <section className="cat-sec">
        <div className="container">
          <div className="sec-head">
            <div className="sec-label">Sorotan Penyelidikan</div>
            <Link href="/kategori/Penyelidikan" className="view-all">Semua Penyelidikan →</Link>
          </div>
          <div className="cat-grid">
            {researchMain ? (
              <Link href={`/artikel/${researchMain.slug}`} className="cat-main reveal" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="cat-main-img">
                  <img className="card-photo" src={researchMain.featured_image ?? `https://picsum.photos/seed/${researchMain.slug}/1200/675`} alt={researchMain.title} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  {researchMain.tags?.[0] && <span className={`tag ${tagClass(researchMain.tags[0])}`}>{researchMain.tags[0]}</span>}
                </div>
                <h3 className="cat-main-title">{researchMain.title}</h3>
                <p className="cat-main-excerpt">{researchMain.meta_description}</p>
                <div className="card-meta">
                  <AuthorPip author={researchMain.authors} size={18} />
                  <span>{researchMain.authors?.name ?? 'Sharpable News'}</span>
                  <span className="dot"></span>
                  <span>{fmtDate(researchMain.created_at)}</span>
                  <span className="dot"></span>
                  <span>{researchMain.read_time} min baca</span>
                </div>
              </Link>
            ) : (
              <div className="cat-main reveal" style={PH}>
                <div className="cat-main-img">
                  <img className="card-photo" src="https://picsum.photos/seed/neural-interpretability/1200/675" alt="Penyelidikan rangkaian neural" />
                </div>
                <div style={{ marginBottom: '12px' }}><span style={PH_BADGE}>Akan Datang</span></div>
                <h3 className="cat-main-title">Keterepretasian Mekanistik Capai Kejayaan Besar: Penyelidik Kini Mampu Membaca Apa yang &apos;Difikirkan&apos; Kepala Perhatian</h3>
                <p className="cat-main-excerpt">Sebuah kertas daripada pasukan keterepretasian Anthropic menunjukkan kaedah yang boleh dipercayai untuk menyahkod peranan kepala perhatian individu dalam model bahasa besar.</p>
                <div className="card-meta">
                  <span>Priya Menon</span><span className="dot"></span>
                  <span>14 Mei 2026</span><span className="dot"></span>
                  <span>10 min baca</span>
                </div>
              </div>
            )}

            <div className="cat-side-list">
              {researchSide.map((a, i) => {
                const phData = [
                  { seed: 'training-data-quality', alt: 'Data latihan', title: 'Hukum Penskalaan Dikaji Semula: Bukti Baharu Bahawa Kualiti Mengatasi Kuantiti dalam Data Latihan', meta: 'Marcus Chen · 13 Mei · 7 min' },
                  { seed: 'mit-lab-research',       alt: 'Makmal MIT',   title: 'Pendekatan Baharu MIT terhadap RLHF Jimatkan Kos Anotasi 60% dengan Penjajaran Setanding', meta: 'Elena Vasquez · 12 Mei · 9 min' },
                  { seed: 'chain-thought-model',    alt: 'CoT model',    title: 'Prompting Rantaian Pemikiran Mungkin Mengajar Model untuk Mereka-Reka, Amaran Penyelidik', meta: 'Thomas Laurent · 10 Mei · 6 min' },
                  { seed: 'autoencoder-nodes',      alt: 'Autoencoder',  title: 'Autoenkoder Jarang Muncul sebagai Alat Utama untuk Memahami Dalaman Rangkaian Neural', meta: 'Priya Menon · 8 Mei · 8 min' },
                ][i]
                return a ? (
                  <Link key={a.id} href={`/artikel/${a.slug}`} className="cat-side-item reveal" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="cat-side-thumb">
                      <img className="stack-photo" src={a.featured_image ?? `https://picsum.photos/seed/${a.slug}/120/80`} alt={a.title} />
                    </div>
                    <div className="cat-side-body">
                      <div style={{ marginBottom: '5px' }}>
                        {a.tags?.[0] && <span className={`tag ${tagClass(a.tags[0])}`}>{a.tags[0]}</span>}
                      </div>
                      <div className="cat-side-title">{a.title}</div>
                      <div className="cat-side-meta">{a.authors?.name ?? 'Sharpable News'} · {fmtDate(a.created_at)} · {a.read_time} min</div>
                    </div>
                  </Link>
                ) : (
                  <div key={`rsph-${i}`} className="cat-side-item reveal" style={PH}>
                    <div className="cat-side-thumb">
                      <img className="stack-photo" src={`https://picsum.photos/seed/${phData.seed}/120/80`} alt={phData.alt} />
                    </div>
                    <div className="cat-side-body">
                      <div style={{ marginBottom: '5px' }}><span style={PH_BADGE}>Akan Datang</span></div>
                      <div className="cat-side-title">{phData.title}</div>
                      <div className="cat-side-meta">{phData.meta}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ STARTUP WATCH ═══════════ */}
      <section className="cat-sec">
        <div className="container">
          <div className="sec-head">
            <div className="sec-label">Pantau Permulaan</div>
            <Link href="/kategori/Permulaan" className="view-all">Semua Permulaan →</Link>
          </div>
          <div className="cat-grid">
            {startupMain ? (
              <Link href={`/artikel/${startupMain.slug}`} className="cat-main reveal" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="cat-main-img">
                  <img className="card-photo" src={startupMain.featured_image ?? `https://picsum.photos/seed/${startupMain.slug}/1200/675`} alt={startupMain.title} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  {startupMain.tags?.[0] && <span className={`tag ${tagClass(startupMain.tags[0])}`}>{startupMain.tags[0]}</span>}
                </div>
                <h3 className="cat-main-title">{startupMain.title}</h3>
                <p className="cat-main-excerpt">{startupMain.meta_description}</p>
                <div className="card-meta">
                  <AuthorPip author={startupMain.authors} size={18} />
                  <span>{startupMain.authors?.name ?? 'Sharpable News'}</span>
                  <span className="dot"></span>
                  <span>{fmtDate(startupMain.created_at)}</span>
                  <span className="dot"></span>
                  <span>{startupMain.read_time} min baca</span>
                </div>
              </Link>
            ) : (
              <div className="cat-main reveal" style={PH}>
                <div className="cat-main-img">
                  <img className="card-photo" src="https://picsum.photos/seed/venture-funding/1200/675" alt="Pembiayaan syarikat permulaan" />
                </div>
                <div style={{ marginBottom: '12px' }}><span style={PH_BADGE}>Akan Datang</span></div>
                <h3 className="cat-main-title">Masalah $10 Bilion: Mengapa Syarikat Permulaan AI Membakar Wang Lebih Cepat daripada Mana-Mana Generasi Sebelumnya</h3>
                <p className="cat-main-excerpt">Kos pengkomputeran, perang bakat, dan tekanan tanpa henti untuk mencapai keupayaan frontier telah mencipta persekitaran pembiayaan yang belum pernah berlaku sebelum ini.</p>
                <div className="card-meta">
                  <span>Laila Nasser</span><span className="dot"></span>
                  <span>13 Mei 2026</span><span className="dot"></span>
                  <span>13 min baca</span>
                </div>
              </div>
            )}

            <div className="cat-side-list">
              {startupSide.map((a, i) => {
                const phData = [
                  { seed: 'cohere-enterprise',    alt: 'Cohere korporat',     title: 'Cohere Beralih ke Hanya Korporat, Tutup Akses API B2C Secara Kekal', meta: 'James Whitfield · 12 Mei · 4 min' },
                  { seed: 'character-ai-social',  alt: 'Character AI',        title: 'Character.AI Lapor 100 Juta Pengguna Aktif — Bolehkah Ia Jana Pendapatan Sebelum Wang Habis?', meta: 'Sofia Reyes · 11 Mei · 7 min' },
                  { seed: 'research-startup-lab', alt: 'Makmal penyelidikan', title: "Bekas Penyelidik OpenAI Lancar 'Northlight' — Makmal Asas Berfokus Perancangan Jangka Panjang", meta: 'Marcus Chen · 9 Mei · 5 min' },
                  { seed: 'startup-pitch-demo',   alt: 'Pitching permulaan',  title: 'YC W26: Syarikat AI Paling Patut Diperhati daripada Kumpulan Tahun Ini', meta: 'Laila Nasser · 7 Mei · 8 min' },
                ][i]
                return a ? (
                  <Link key={a.id} href={`/artikel/${a.slug}`} className="cat-side-item reveal" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="cat-side-thumb">
                      <img className="stack-photo" src={a.featured_image ?? `https://picsum.photos/seed/${a.slug}/120/80`} alt={a.title} />
                    </div>
                    <div className="cat-side-body">
                      <div style={{ marginBottom: '5px' }}>
                        {a.tags?.[0] && <span className={`tag ${tagClass(a.tags[0])}`}>{a.tags[0]}</span>}
                      </div>
                      <div className="cat-side-title">{a.title}</div>
                      <div className="cat-side-meta">{a.authors?.name ?? 'Sharpable News'} · {fmtDate(a.created_at)} · {a.read_time} min</div>
                    </div>
                  </Link>
                ) : (
                  <div key={`ssph-${i}`} className="cat-side-item reveal" style={PH}>
                    <div className="cat-side-thumb">
                      <img className="stack-photo" src={`https://picsum.photos/seed/${phData.seed}/120/80`} alt={phData.alt} />
                    </div>
                    <div className="cat-side-body">
                      <div style={{ marginBottom: '5px' }}><span style={PH_BADGE}>Akan Datang</span></div>
                      <div className="cat-side-title">{phData.title}</div>
                      <div className="cat-side-meta">{phData.meta}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ MORE FROM SHARPABLE ═══════════ */}
      <section className="section" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="sec-head">
            <div className="sec-label">Lebih Banyak dari Sharpable</div>
          </div>
          <div className="cards-grid">
            {moreCards.map((a, i) => {
              const phData = [
                { seed: 'whitehouse-gov',    alt: 'Kerajaan dan dasar',         cat: 't-policy',   label: 'Dasar',    title: 'Di Sebalik Majlis AI Rumah Putih: Apa yang Sebenarnya Membimbangkan Mereka', excerpt: 'Laporan eksklusif tentang perdebatan dalaman yang membentuk tadbir urus AI Amerika Syarikat.' },
                { seed: 'coding-developer',  alt: 'Alatan pengekodan pembangun', cat: 't-tools',    label: 'Alatan',   title: 'Kami Uji Semua AI Penulisan Kod Utama pada 2026. Inilah yang Sebenarnya Berubah.', excerpt: 'Daripada Cursor dan Copilot hingga Devin dan Claude Code, landskap pembangunan kod berbantukan AI telah berubah.' },
                { seed: 'global-geopolitics',alt: 'Geopolitik teknologi global', cat: 't-industry', label: 'Industri', title: 'Geopolitik Kawalan Eksport GPU: Tinjauan Enam Bulan', excerpt: 'Enam bulan selepas sekatan cip terbaharu, kami mengkaji negara-negara yang menemui jalan alternatif.' },
              ][i]
              return a ? (
                <Link key={a.id} href={`/artikel/${a.slug}`} className="card reveal" style={{ textDecoration: 'none' }}>
                  <div className="card-img">
                    <div className={`card-img-inner ci-${[6, 2, 4][i]}`}>
                      <img className="card-photo" src={a.featured_image ?? `https://picsum.photos/seed/${a.slug}/800/500`} alt={a.title} />
                    </div>
                  </div>
                  <div className="card-cat">
                    {a.tags?.[0] && <span className={`tag ${tagClass(a.tags[0])}`}>{a.tags[0]}</span>}
                  </div>
                  <h3 className="card-title">{a.title}</h3>
                  {a.meta_description && <p className="card-excerpt">{a.meta_description}</p>}
                  <div className="card-meta">
                    <AuthorPip author={a.authors} size={18} />
                    <span>{a.authors?.name ?? 'Sharpable News'}</span>
                    <span className="dot"></span>
                    <span>{fmtDate(a.created_at)}</span>
                    <span className="dot"></span>
                    <span>{a.read_time} min</span>
                  </div>
                </Link>
              ) : (
                <div key={`mph-${i}`} className="card reveal" style={PH}>
                  <div className="card-img">
                    <div className={`card-img-inner ci-${[6, 2, 4][i]}`}>
                      <img className="card-photo" src={`https://picsum.photos/seed/${phData.seed}/800/500`} alt={phData.alt} />
                    </div>
                  </div>
                  <div className="card-cat"><span style={PH_BADGE}>Akan Datang</span></div>
                  <h3 className="card-title">{phData.title}</h3>
                  <p className="card-excerpt">{phData.excerpt}</p>
                  <div className="card-meta"><span style={PH_BADGE}>Akan Datang</span></div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ NEWSLETTER ═══════════ */}
      <section className="nl-section">
        <div className="container">
          <div className="nl-grid">
            <div>
              <div className="nl-eyebrow">Kecerdasan Harian</div>
              <h2 className="nl-title">Kekal selangkah lebih maju dalam dunia AI — setiap pagi.</h2>
              <p className="nl-desc">The Sharpable Brief menapis isyarat daripada gangguan: lima cerita AI penting, dipilih oleh pasukan editorial kami, dihantar ke peti masuk anda sebelum jam 8 pagi.</p>
              <div className="nl-stats">
                <div><div className="stat-n">84k</div><div className="stat-l">Pelanggan</div></div>
                <div><div className="stat-n">4.9</div><div className="stat-l">Penilaian purata</div></div>
                <div><div className="stat-n">Harian</div><div className="stat-l">Kekerapan</div></div>
              </div>
            </div>
            <div className="nl-form">
              <div className="nl-row">
                <input className="nl-input" type="email" placeholder="anda@emel.com" />
                <button className="nl-btn">Langgan Percuma</button>
              </div>
              <p className="nl-note">Tiada spam, sama sekali. Berhenti langgan dengan satu klik. Dengan melanggan, anda bersetuju dengan Dasar Privasi kami.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
