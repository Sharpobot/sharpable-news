'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const TAG_CLASSES = {
  penyelidikan: 't-research', research: 't-research',
  analisis: 't-analysis',    analysis: 't-analysis',
  permulaan: 't-startups',   startups: 't-startups',
  dasar: 't-policy',         policy: 't-policy',
  alatan: 't-tools',         tools: 't-tools',
  industri: 't-industry',    industry: 't-industry',
}
function tagClass(tag) {
  return TAG_CLASSES[tag?.toLowerCase()] ?? 't-research'
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function HomePageClient({ articles = [] }) {
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    /* ── Navbar border on scroll ── */
    const handleScroll = () => {
      const navbar = document.getElementById('navbar')
      if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    /* ── Scroll-reveal ── */
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

    /* ── Keyboard shortcuts ── */
    const handleKeydown = (e) => {
      if (e.key === 'Escape') setSearchOpen(false)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    document.addEventListener('keydown', handleKeydown)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('keydown', handleKeydown)
      io.disconnect()
    }
  }, [])

  /* Focus search input when overlay opens */
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => document.getElementById('searchInput')?.focus(), 60)
    }
  }, [searchOpen])

  const toggleTheme = () => {
    const html = document.documentElement
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    html.setAttribute('data-theme', next)
    localStorage.setItem('sn-theme', next)
  }

  const fillSearch = (text) => {
    const input = document.getElementById('searchInput')
    if (input) { input.value = text; input.focus() }
  }

  return (
    <>
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className="navbar" id="navbar">
        <div className="container">
          <div className="navbar-inner">
            <a href="/" className="logo">
              <span className="logo-word">Sharpable</span>
              <span className="logo-dot"></span>
            </a>
            <div className="nav-pipe"></div>
            <nav className="nav-links">
              <a href="#" className="nav-link active">Terkini</a>
              <a href="#" className="nav-link">Penyelidikan</a>
              <a href="#" className="nav-link">Permulaan</a>
              <a href="#" className="nav-link">Alatan</a>
              <a href="#" className="nav-link">Dasar</a>
              <a href="#" className="nav-link">Analisis</a>
              <a href="#" className="nav-link">Industri</a>
            </nav>
            <div className="nav-right">
              <button className="btn-search" onClick={() => setSearchOpen(true)}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                Cari
                <kbd>⌘K</kbd>
              </button>
              <button className="btn-subscribe">Langgan</button>
              <button className="theme-icon-btn" onClick={toggleTheme} aria-label="Tukar tema">
                <svg className="icon-moon" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                <svg className="icon-sun" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

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
            {/* Duplicate for seamless loop */}
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
            {/* Main Feature */}
            <div className="hero-main">
              <div className="hero-img">
                <img className="hero-photo" src="https://picsum.photos/seed/openai-lab/1200/675" alt="AI research laboratory" />
              </div>
              <div className="eyebrow"><span className="eyebrow-dot"></span>Rencana Utama</div>
              <h1 className="hero-title">Perlumbaan ke AGI: Di Sebalik Program Penyelidikan Paling Berani OpenAI</h1>
              <p className="hero-excerpt">Apabila sempadan kecerdasan mesin semakin pesat berkembang, inisiatif dalaman terbaharu OpenAI bertujuan menyelesaikan penaakulan jangka panjang — keupayaan yang diyakini kebanyakan penyelidik sebagai jurang antara LLM masa kini dan sesuatu yang benar-benar transformatif.</p>
              <div className="meta-row">
                <span className="meta-author">
                  <span className="avatar"></span>
                  Marcus Chen
                </span>
                <span className="meta-sep">·</span>
                <span>18 Mei 2026</span>
                <span className="meta-sep">·</span>
                <span className="read-clock">9 min baca</span>
                <span className="tag t-research">Penyelidikan</span>
              </div>
            </div>

            {/* Sidebar */}
            <div className="hero-sidebar">
              <div className="sidebar-header">Berita Utama</div>
              <div className="sidebar-list">
                <div className="sidebar-item">
                  <div className="s-cat">Permulaan</div>
                  <div className="s-title">Anthropic Kumpul $3.5 Bilion Apabila Pelaburan Keselamatan AI Capai Paras Tertinggi</div>
                  <div className="s-meta">Laila Nasser · 6 min</div>
                </div>
                <div className="sidebar-item">
                  <div className="s-cat">Analisis</div>
                  <div className="s-title">Sempadan Baharu AI Bukan Kecerdasan — Ia Adalah Ingatan</div>
                  <div className="s-meta">David Okafor · 11 min</div>
                </div>
                <div className="sidebar-item">
                  <div className="s-cat">Dasar</div>
                  <div className="s-title">Fasa Kedua Akta AI EU Bermula: Apa Yang Perlu Diketahui Setiap Syarikat</div>
                  <div className="s-meta">Sofia Reyes · 7 min</div>
                </div>
                <div className="sidebar-item">
                  <div className="s-cat">Alatan</div>
                  <div className="s-title">Mod Agen Baharu Cursor Mengubah Cara Pembangun Bekerja Secara Menyeluruh</div>
                  <div className="s-meta">James Whitfield · 5 min</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* ═══════════ LATEST (3-col grid) ═══════════ */}
      <section className="section">
        <div className="container">
          <div className="sec-head">
            <div className="sec-label">Terkini</div>
            <a href="#" className="view-all">Lihat semua →</a>
          </div>
          <div className="cards-grid">

            {articles.length > 0 ? articles.map((article, i) => (
              <Link key={article.id} href={`/artikel/${article.slug}`} className="card reveal" style={{ textDecoration: 'none' }}>
                <div className="card-img">
                  <div className={`card-img-inner ci-${(i % 6) + 1}`}>
                    <img
                      className="card-photo"
                      src={`https://picsum.photos/seed/${article.slug}/800/500`}
                      alt={article.title}
                    />
                  </div>
                </div>
                <div className="card-cat">
                  {article.tags?.[0] && (
                    <span className={`tag ${tagClass(article.tags[0])}`}>{article.tags[0]}</span>
                  )}
                </div>
                <h3 className="card-title">{article.title}</h3>
                {article.meta_description && (
                  <p className="card-excerpt">{article.meta_description}</p>
                )}
                <div className="card-meta">
                  <span>{fmtDate(article.created_at)}</span>
                </div>
              </Link>
            )) : (
              /* ── Placeholder cards shown while DB has no published articles ── */
              <>
                <div className="card reveal">
                  <div className="card-img">
                    <div className="card-img-inner ci-1">
                      <img className="card-photo" src="https://picsum.photos/seed/deepmind-protein/800/500" alt="Penyelidikan saintifik" />
                    </div>
                  </div>
                  <div className="card-cat"><span className="tag t-research">Penyelidikan</span></div>
                  <h3 className="card-title">Google DeepMind Perkenal Pengganti AlphaFold dengan Pemodelan Interaksi Protein Penuh</h3>
                  <p className="card-excerpt">Versi terbaharu ini melampaui lipatan protein tunggal untuk memetakan interaksi pelbagai protein yang kompleks — satu kejayaan dengan implikasi besar kepada penemuan ubat dan biologi sintetik.</p>
                  <div className="card-meta">
                    <span>Priya Menon</span><span className="dot"></span>
                    <span>18 Mei</span><span className="dot"></span>
                    <span>8 min</span>
                  </div>
                </div>

                <div className="card reveal">
                  <div className="card-img">
                    <div className="card-img-inner ci-2">
                      <img className="card-photo" src="https://picsum.photos/seed/mistral-paris/800/500" alt="Pejabat syarikat teknologi" />
                    </div>
                  </div>
                  <div className="card-cat"><span className="tag t-startups">Permulaan</span></div>
                  <h3 className="card-title">Model Sumber Terbuka Mistral Mengatasi GPT-4 dalam Penanda Aras Penaakulan Undang-Undang</h3>
                  <p className="card-excerpt">Keluaran terbaharu makmal yang berpusat di Paris ini, dilatih pada korpus teks undang-undang terpilih merentas 12 bidang kuasa, menarik perhatian syarikat korporat dan komuniti sumber terbuka.</p>
                  <div className="card-meta">
                    <span>Thomas Laurent</span><span className="dot"></span>
                    <span>17 Mei</span><span className="dot"></span>
                    <span>6 min</span>
                  </div>
                </div>

                <div className="card reveal">
                  <div className="card-img">
                    <div className="card-img-inner ci-3">
                      <img className="card-photo" src="https://picsum.photos/seed/datacenter-gpu/800/500" alt="Pelayan pusat data" />
                    </div>
                  </div>
                  <div className="card-cat"><span className="tag t-analysis">Analisis</span></div>
                  <h3 className="card-title">Ekonomi Tersembunyi Menjalankan LLM dalam Skala Besar: Pecahan Kos Penuh</h3>
                  <p className="card-excerpt">Di sebalik setiap panggilan API tersembunyi rangkaian kluster GPU, kontrak kuasa, dan infrastruktur penyejukan yang kompleks. Kami memetakan keseluruhan unit ekonomi untuk mengerahkan model frontier dalam persekitaran produksi.</p>
                  <div className="card-meta">
                    <span>Elena Vasquez</span><span className="dot"></span>
                    <span>17 Mei</span><span className="dot"></span>
                    <span>12 min</span>
                  </div>
                </div>
              </>
            )}

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

            <div className="trending-item reveal">
              <span className="trend-num">01</span>
              <div className="trend-body">
                <div className="trend-cat"><span className="tag t-industry">Industri</span></div>
                <div className="trend-title">Sam Altman: &apos;Kita Mungkin Saksikan Sistem AI Mampu Menjalankan Penyelidikan Saintifik Baharu Menjelang 2026&apos;</div>
                <div className="trend-meta">16 Mei · 5 min baca</div>
              </div>
            </div>

            <div className="trending-item reveal">
              <span className="trend-num">02</span>
              <div className="trend-body">
                <div className="trend-cat"><span className="tag t-tools">Alatan</span></div>
                <div className="trend-title">Cursor lwn GitHub Copilot lwn Windsurf: Perbandingan Jujur Seorang Pembangun pada 2026</div>
                <div className="trend-meta">15 Mei · 14 min baca</div>
              </div>
            </div>

            <div className="trending-item reveal">
              <span className="trend-num">03</span>
              <div className="trend-body">
                <div className="trend-cat"><span className="tag t-policy">Dasar</span></div>
                <div className="trend-title">Majlis AI Negara China Keluarkan Garis Panduan Baharu untuk Penggunaan Model Domestik</div>
                <div className="trend-meta">15 Mei · 6 min baca</div>
              </div>
            </div>

            <div className="trending-item reveal">
              <span className="trend-num">04</span>
              <div className="trend-body">
                <div className="trend-cat"><span className="tag t-research">Penyelidikan</span></div>
                <div className="trend-title">Keterepretasian Mekanistik Hasilkan Kejayaan dalam Memahami Kepala Perhatian Model AI</div>
                <div className="trend-meta">14 Mei · 10 min baca</div>
              </div>
            </div>

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

            <div className="featured-card reveal">
              <div className="card-img">
                <div className="card-img-inner ci-4">
                  <img className="card-photo" src="https://picsum.photos/seed/memory-brain-ai/800/600" alt="Ingatan dan AI" />
                </div>
              </div>
              <div className="card-cat" style={{ marginBottom: '10px' }}><span className="tag t-analysis">Analisis</span></div>
              <h3 className="card-title" style={{ fontSize: '27px', marginBottom: '13px' }}>Sempadan Baharu AI Bukan Kecerdasan — Ia Adalah Ingatan</h3>
              <p className="card-excerpt" style={{ fontSize: '15px', marginBottom: '16px' }}>Bidang ini terpaku pada penanda aras untuk penaakulan dan pengekodan. Tetapi model yang akan mengubah dunia kerja pengetahuan berkongsi satu ciri yang kurang dihargai: keupayaan untuk mengingat, mendapatkan semula, dan menaakulkan konteks peribadi yang luas dari masa ke masa.</p>
              <div className="card-meta">
                <span className="meta-author"><span className="avatar"></span>David Okafor</span>
                <span className="dot"></span>
                <span>14 Mei 2026</span>
                <span className="dot"></span>
                <span>11 min</span>
              </div>
            </div>

            <div className="stack-list">

              <div className="stack-item reveal">
                <div className="stack-thumb ci-5">
                  <img className="stack-photo" src="https://picsum.photos/seed/bigtech-acquire/180/130" alt="Penyatuan teknologi" />
                </div>
                <div className="stack-body">
                  <div className="stack-cat"><span className="tag t-startups">Permulaan</span></div>
                  <div className="stack-title">Penyatuan Senyap: Bagaimana Gergasi Teknologi Menyerap Ekosistem Syarikat Permulaan AI</div>
                  <div className="stack-meta">Elena Vasquez · 13 Mei · 9 min</div>
                </div>
              </div>

              <div className="stack-item reveal">
                <div className="stack-thumb ci-6">
                  <img className="stack-photo" src="https://picsum.photos/seed/ai-agent-robot/180/130" alt="Automasi AI" />
                </div>
                <div className="stack-body">
                  <div className="stack-cat"><span className="tag t-tools">Alatan</span></div>
                  <div className="stack-title">Melampaui Autolengkap: Gelombang Baharu Ejen AI yang Benar-Benar Menghasilkan Produk</div>
                  <div className="stack-meta">Marcus Chen · 12 Mei · 7 min</div>
                </div>
              </div>

              <div className="stack-item reveal">
                <div className="stack-thumb ci-1">
                  <img className="stack-photo" src="https://picsum.photos/seed/law-court-policy/180/130" alt="Dasar dan undang-undang AI" />
                </div>
                <div className="stack-body">
                  <div className="stack-cat"><span className="tag t-policy">Dasar</span></div>
                  <div className="stack-title">Liabiliti di Era AI: Siapa Menanggung Akibat Apabila Model Tersasar Secara Bencana?</div>
                  <div className="stack-meta">Sofia Reyes · 11 Mei · 8 min</div>
                </div>
              </div>

              <div className="stack-item reveal">
                <div className="stack-thumb ci-3">
                  <img className="stack-photo" src="https://picsum.photos/seed/nvidia-chip/180/130" alt="Cip semikonduktor GPU" />
                </div>
                <div className="stack-body">
                  <div className="stack-cat"><span className="tag t-industry">Industri</span></div>
                  <div className="stack-title">Platform NIM NVIDIA Senyap-Senyap Menjadi Kubernetes untuk Inferens AI</div>
                  <div className="stack-meta">James Whitfield · 10 Mei · 6 min</div>
                </div>
              </div>

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
            <a href="#" className="view-all">Semua Penyelidikan →</a>
          </div>
          <div className="cat-grid">

            <div className="cat-main reveal">
              <div className="cat-main-img">
                <img className="card-photo" src="https://picsum.photos/seed/neural-interpretability/1200/675" alt="Penyelidikan rangkaian neural" />
              </div>
              <div style={{ marginBottom: '12px' }}><span className="tag t-research">Penyelidikan</span></div>
              <h3 className="cat-main-title">Keterepretasian Mekanistik Capai Kejayaan Besar: Penyelidik Kini Mampu Membaca Apa yang &apos;Difikirkan&apos; Kepala Perhatian</h3>
              <p className="cat-main-excerpt">Sebuah kertas daripada pasukan keterepretasian Anthropic menunjukkan kaedah yang boleh dipercayai untuk menyahkod peranan kepala perhatian individu dalam model bahasa besar — berpotensi membuka era baharu ketelusan model dan penyahpepijatan yang lebih tepat sasaran.</p>
              <div className="card-meta">
                <span>Priya Menon</span>
                <span className="dot"></span>
                <span>14 Mei 2026</span>
                <span className="dot"></span>
                <span>10 min baca</span>
              </div>
            </div>

            <div className="cat-side-list">
              <div className="cat-side-item reveal">
                <div className="cat-side-thumb">
                  <img className="stack-photo" src="https://picsum.photos/seed/training-data-quality/120/80" alt="Data latihan" />
                </div>
                <div className="cat-side-body">
                  <div style={{ marginBottom: '5px' }}><span className="tag t-research">Penyelidikan</span></div>
                  <div className="cat-side-title">Hukum Penskalaan Dikaji Semula: Bukti Baharu Bahawa Kualiti Mengatasi Kuantiti dalam Data Latihan</div>
                  <div className="cat-side-meta">Marcus Chen · 13 Mei · 7 min</div>
                </div>
              </div>
              <div className="cat-side-item reveal">
                <div className="cat-side-thumb">
                  <img className="stack-photo" src="https://picsum.photos/seed/mit-lab-research/120/80" alt="Makmal penyelidikan" />
                </div>
                <div className="cat-side-body">
                  <div style={{ marginBottom: '5px' }}><span className="tag t-research">Penyelidikan</span></div>
                  <div className="cat-side-title">Pendekatan Baharu MIT terhadap RLHF Jimatkan Kos Anotasi 60% dengan Penjajaran Setanding</div>
                  <div className="cat-side-meta">Elena Vasquez · 12 Mei · 9 min</div>
                </div>
              </div>
              <div className="cat-side-item reveal">
                <div className="cat-side-thumb">
                  <img className="stack-photo" src="https://picsum.photos/seed/chain-thought-model/120/80" alt="Model pemikiran" />
                </div>
                <div className="cat-side-body">
                  <div style={{ marginBottom: '5px' }}><span className="tag t-research">Penyelidikan</span></div>
                  <div className="cat-side-title">Prompting Rantaian Pemikiran Mungkin Mengajar Model untuk Mereka-Reka, Amaran Penyelidik</div>
                  <div className="cat-side-meta">Thomas Laurent · 10 Mei · 6 min</div>
                </div>
              </div>
              <div className="cat-side-item reveal">
                <div className="cat-side-thumb">
                  <img className="stack-photo" src="https://picsum.photos/seed/autoencoder-nodes/120/80" alt="Nod rangkaian neural" />
                </div>
                <div className="cat-side-body">
                  <div style={{ marginBottom: '5px' }}><span className="tag t-research">Penyelidikan</span></div>
                  <div className="cat-side-title">Autoenkoder Jarang Muncul sebagai Alat Utama untuk Memahami Dalaman Rangkaian Neural</div>
                  <div className="cat-side-meta">Priya Menon · 8 Mei · 8 min</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ STARTUP WATCH ═══════════ */}
      <section className="cat-sec">
        <div className="container">
          <div className="sec-head">
            <div className="sec-label">Pantau Permulaan</div>
            <a href="#" className="view-all">Semua Permulaan →</a>
          </div>
          <div className="cat-grid">

            <div className="cat-main reveal">
              <div className="cat-main-img">
                <img className="card-photo" src="https://picsum.photos/seed/venture-funding/1200/675" alt="Pembiayaan syarikat permulaan" />
              </div>
              <div style={{ marginBottom: '12px' }}><span className="tag t-startups">Permulaan</span></div>
              <h3 className="cat-main-title">Masalah $10 Bilion: Mengapa Syarikat Permulaan AI Membakar Wang Lebih Cepat daripada Mana-Mana Generasi Sebelumnya</h3>
              <p className="cat-main-excerpt">Kos pengkomputeran, perang bakat, dan tekanan tanpa henti untuk mencapai keupayaan frontier telah mencipta persekitaran pembiayaan yang belum pernah berlaku sebelum ini — dan satu pertempuran sedang menanti syarikat tanpa laluan jelas menuju pendapatan.</p>
              <div className="card-meta">
                <span>Laila Nasser</span>
                <span className="dot"></span>
                <span>13 Mei 2026</span>
                <span className="dot"></span>
                <span>13 min baca</span>
              </div>
            </div>

            <div className="cat-side-list">
              <div className="cat-side-item reveal">
                <div className="cat-side-thumb">
                  <img className="stack-photo" src="https://picsum.photos/seed/cohere-enterprise/120/80" alt="Cohere korporat" />
                </div>
                <div className="cat-side-body">
                  <div style={{ marginBottom: '5px' }}><span className="tag t-startups">Permulaan</span></div>
                  <div className="cat-side-title">Cohere Beralih ke Hanya Korporat, Tutup Akses API B2C Secara Kekal</div>
                  <div className="cat-side-meta">James Whitfield · 12 Mei · 4 min</div>
                </div>
              </div>
              <div className="cat-side-item reveal">
                <div className="cat-side-thumb">
                  <img className="stack-photo" src="https://picsum.photos/seed/character-ai-social/120/80" alt="Character AI pengguna" />
                </div>
                <div className="cat-side-body">
                  <div style={{ marginBottom: '5px' }}><span className="tag t-startups">Permulaan</span></div>
                  <div className="cat-side-title">Character.AI Lapor 100 Juta Pengguna Aktif — Bolehkah Ia Jana Pendapatan Sebelum Wang Habis?</div>
                  <div className="cat-side-meta">Sofia Reyes · 11 Mei · 7 min</div>
                </div>
              </div>
              <div className="cat-side-item reveal">
                <div className="cat-side-thumb">
                  <img className="stack-photo" src="https://picsum.photos/seed/research-startup-lab/120/80" alt="Makmal penyelidikan" />
                </div>
                <div className="cat-side-body">
                  <div style={{ marginBottom: '5px' }}><span className="tag t-startups">Permulaan</span></div>
                  <div className="cat-side-title">Bekas Penyelidik OpenAI Lancar &apos;Northlight&apos; — Makmal Asas Berfokus Perancangan Jangka Panjang</div>
                  <div className="cat-side-meta">Marcus Chen · 9 Mei · 5 min</div>
                </div>
              </div>
              <div className="cat-side-item reveal">
                <div className="cat-side-thumb">
                  <img className="stack-photo" src="https://picsum.photos/seed/startup-pitch-demo/120/80" alt="Pitching syarikat permulaan" />
                </div>
                <div className="cat-side-body">
                  <div style={{ marginBottom: '5px' }}><span className="tag t-startups">Permulaan</span></div>
                  <div className="cat-side-title">YC W26: Syarikat AI Paling Patut Diperhati daripada Kumpulan Tahun Ini</div>
                  <div className="cat-side-meta">Laila Nasser · 7 Mei · 8 min</div>
                </div>
              </div>
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

            <div className="card reveal">
              <div className="card-img">
                <div className="card-img-inner ci-6">
                  <img className="card-photo" src="https://picsum.photos/seed/whitehouse-gov/800/500" alt="Kerajaan dan dasar" />
                </div>
              </div>
              <div className="card-cat"><span className="tag t-policy">Dasar</span></div>
              <h3 className="card-title">Di Sebalik Majlis AI Rumah Putih: Apa yang Sebenarnya Membimbangkan Mereka</h3>
              <p className="card-excerpt">Laporan eksklusif tentang perdebatan dalaman yang membentuk tadbir urus AI Amerika Syarikat — dari kawalan eksport hingga hak cipta, taruhannya tidak pernah lebih tinggi.</p>
              <div className="card-meta">
                <span>Sofia Reyes</span>
                <span className="dot"></span>
                <span>12 Mei</span>
                <span className="dot"></span>
                <span>8 min</span>
              </div>
            </div>

            <div className="card reveal">
              <div className="card-img">
                <div className="card-img-inner ci-2">
                  <img className="card-photo" src="https://picsum.photos/seed/coding-developer/800/500" alt="Alatan pengekodan pembangun" />
                </div>
              </div>
              <div className="card-cat"><span className="tag t-tools">Alatan</span></div>
              <h3 className="card-title">Kami Uji Semua AI Penulisan Kod Utama pada 2026. Inilah yang Sebenarnya Berubah.</h3>
              <p className="card-excerpt">Daripada Cursor dan Copilot hingga Devin dan Claude Code, landskap pembangunan kod berbantukan AI telah berubah secara dramatik dalam dua belas bulan yang lalu.</p>
              <div className="card-meta">
                <span>James Whitfield</span>
                <span className="dot"></span>
                <span>11 Mei</span>
                <span className="dot"></span>
                <span>15 min</span>
              </div>
            </div>

            <div className="card reveal">
              <div className="card-img">
                <div className="card-img-inner ci-4">
                  <img className="card-photo" src="https://picsum.photos/seed/global-geopolitics/800/500" alt="Geopolitik teknologi global" />
                </div>
              </div>
              <div className="card-cat"><span className="tag t-industry">Industri</span></div>
              <h3 className="card-title">Geopolitik Kawalan Eksport GPU: Tinjauan Enam Bulan</h3>
              <p className="card-excerpt">Enam bulan selepas sekatan cip terbaharu, kami mengkaji negara-negara yang menemui jalan alternatif — dan apa maknanya bagi keseimbangan kuasa AI global.</p>
              <div className="card-meta">
                <span>Laila Nasser</span>
                <span className="dot"></span>
                <span>10 Mei</span>
                <span className="dot"></span>
                <span>10 min</span>
              </div>
            </div>

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
                <div>
                  <div className="stat-n">84k</div>
                  <div className="stat-l">Pelanggan</div>
                </div>
                <div>
                  <div className="stat-n">4.9</div>
                  <div className="stat-l">Penilaian purata</div>
                </div>
                <div>
                  <div className="stat-n">Harian</div>
                  <div className="stat-l">Kekerapan</div>
                </div>
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

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">
                Sharpable<span className="logo-dot" style={{ marginBottom: '3px' }}></span>
              </div>
              <p className="footer-desc">Kewartawanan AI bebas untuk penyelidik, pembangun, dan pembuat keputusan. Meliput sempadan baharu sejak 2024.</p>
              <div className="footer-social">
                <a href="#" className="soc-link" title="X / Twitter">𝕏</a>
                <a href="#" className="soc-link" title="LinkedIn">in</a>
                <a href="#" className="soc-link" title="RSS Feed">
                  <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20 4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <div className="fc-title">Liputan</div>
              <div className="fc-links">
                <a href="#" className="fc-link">Penyelidikan</a>
                <a href="#" className="fc-link">Permulaan</a>
                <a href="#" className="fc-link">Alatan &amp; Produk</a>
                <a href="#" className="fc-link">Dasar</a>
                <a href="#" className="fc-link">Analisis</a>
                <a href="#" className="fc-link">Industri</a>
              </div>
            </div>

            <div>
              <div className="fc-title">Syarikat</div>
              <div className="fc-links">
                <a href="#" className="fc-link">Tentang Kami</a>
                <a href="#" className="fc-link">Lembaga Redaksi</a>
                <a href="#" className="fc-link">Iklan</a>
                <a href="#" className="fc-link">Kerjaya</a>
                <a href="#" className="fc-link">Hubungi</a>
              </div>
            </div>

            <div>
              <div className="fc-title">Surat Berita</div>
              <div className="fc-links">
                <a href="#" className="fc-link">Ringkasan Harian</a>
                <a href="#" className="fc-link">Digest Penyelidikan</a>
                <a href="#" className="fc-link">Pantau Permulaan</a>
                <a href="#" className="fc-link">Monitor Dasar</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span className="fb-text">© 2026 Sharpable News. Hak cipta terpelihara.</span>
            <div className="fb-links">
              <a href="#" className="fb-link">Privasi</a>
              <a href="#" className="fb-link">Syarat</a>
              <a href="#" className="fb-link">Dasar Kuki</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════ SEARCH OVERLAY ═══════════ */}
      <div className={`search-overlay${searchOpen ? ' open' : ''}`} id="searchOverlay">
        <button className="s-close" onClick={() => setSearchOpen(false)}>✕</button>
        <div className="s-wrap">
          <input className="s-input" type="text" id="searchInput" placeholder="Cari rencana…" />
          <p className="s-hint">Carian popular:</p>
          <div className="s-tags">
            {['GPT-5', 'Akta AI EU', 'keterepretasian', 'Mistral', 'Claude', 'ejen AI', 'RLHF'].map(tag => (
              <span key={tag} className="s-tag" onClick={() => fillSearch(tag)}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
