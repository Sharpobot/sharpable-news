import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import Link from 'next/link'
import PublicNavbar from '@/app/components/PublicNavbar'
import Footer from '@/app/components/Footer'
import { notFound } from 'next/navigation'

export const revalidate = 60

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
function readTime(body) {
  if (!body) return 1
  let text = ''
  if (typeof body === 'string') {
    text = body.replace(/<[^>]*>/g, ' ')
  } else if (body?.type === 'doc' && body?.content) {
    const extract = (nodes) => {
      for (const n of nodes ?? []) {
        if (n.text) text += n.text + ' '
        if (n.content) extract(n.content)
      }
    }
    extract(body.content)
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export async function generateMetadata({ params }) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  return {
    title: `${decoded} — Sharpable News`,
    description: `Artikel terkini berkaitan ${decoded} di Sharpable News.`,
  }
}

export default async function KategoriPage({ params }) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)

  const supabase = createServerSupabaseClient()

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, tags, meta_description, featured_image, body, created_at, authors(name, photo_url)')
    .eq('status', 'published')
    .contains('tags', [decoded])
    .order('created_at', { ascending: false })

  // Also try case-insensitive match via ilike on tags if exact match returns nothing
  // (tags are stored as-is, so try capitalized version too)
  const results = articles ?? []

  return (
    <>
      <PublicNavbar />
      <div style={{
        minHeight: '100vh',
        paddingTop: '80px',
        background: 'var(--bg)',
        fontFamily: '"DM Sans", sans-serif',
      }}>
        {/* Page header */}
        <div style={{
          borderBottom: '1px solid var(--border)',
          paddingBottom: '28px',
          marginBottom: '40px',
        }}>
          <div className="container" style={{ paddingTop: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Link href="/" style={{ color: 'var(--t3)', fontSize: '13px', textDecoration: 'none' }}>
                Laman Utama
              </Link>
              <span style={{ color: 'var(--t3)', fontSize: '13px' }}>›</span>
              <span style={{ color: 'var(--t2)', fontSize: '13px' }}>Kategori</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
              <h1 style={{
                margin: 0,
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 800,
                color: 'var(--h1)',
                letterSpacing: '-0.02em',
                fontFamily: '"Fraunces", serif',
              }}>
                {decoded}
              </h1>
              <span className={`tag ${tagClass(decoded)}`} style={{ fontSize: '12px' }}>
                {decoded}
              </span>
              <span style={{ color: 'var(--t3)', fontSize: '14px' }}>
                {results.length} artikel
              </span>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingBottom: '60px' }}>
          {results.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: 'var(--t3)',
              fontSize: '15px',
              lineHeight: 1.8,
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.4 }}>📂</div>
              Tiada artikel dalam kategori ini buat masa ini.
              <br />
              <Link href="/" style={{ color: '#d4a853', textDecoration: 'none', marginTop: '12px', display: 'inline-block' }}>
                ← Kembali ke laman utama
              </Link>
            </div>
          ) : (
            <div className="cards-grid">
              {results.map((article, i) => {
                const mins = readTime(article.body)
                return (
                  <Link
                    key={article.id}
                    href={`/artikel/${article.slug}`}
                    className="card"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="card-img">
                      <div className={`card-img-inner ci-${(i % 6) + 1}`}>
                        <img
                          className="card-photo"
                          src={article.featured_image ?? `https://picsum.photos/seed/${article.slug}/800/500`}
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
                      {article.authors?.photo_url ? (
                        <img
                          src={article.authors.photo_url}
                          alt={article.authors.name}
                          style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.6 }}>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      )}
                      <span>{article.authors?.name ?? 'Sharpable News'}</span>
                      <span className="dot" />
                      <span>{fmtDate(article.created_at)}</span>
                      <span className="dot" />
                      <span className="read-clock">{mins} min baca</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
