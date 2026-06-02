import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generateHTML } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 60

/* ── Metadata ─────────────────────────────────────────────── */
export async function generateMetadata({ params }) {
  const { slug } = await params
  const supabase = createServerSupabaseClient()

  const { data: article } = await supabase
    .from('articles')
    .select('title, meta_description')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article) return { title: 'Artikel tidak dijumpai — Sharpable News' }

  return {
    title: `${article.title} — Sharpable News`,
    description: article.meta_description ?? undefined,
  }
}

/* ── Tag label → CSS class ────────────────────────────────── */
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

/* ── Body renderer ────────────────────────────────────────── */
function renderBody(body) {
  if (!body) return ''
  // Plain HTML string (saved by TipTap's getHTML())
  if (typeof body === 'string') return body
  // ProseMirror/Tiptap JSON
  if (body.type === 'doc' && body.content) {
    try {
      return generateHTML(body, [StarterKit, Image])
    } catch {
      return ''
    }
  }
  // Fallback: plain html string stored under body.html
  if (typeof body.html === 'string') return body.html
  return ''
}

/** Wrap <img title="caption"> in <figure><figcaption> for rendered articles */
function addCaptions(html) {
  if (!html) return html
  return html.replace(
    /<img([^>]*?)title="([^"]+)"([^>]*)>/gi,
    (_, before, caption, after) =>
      `<figure class="article-figure"><img${before}${after}><figcaption>${caption}</figcaption></figure>`
  )
}

/* ── Page ─────────────────────────────────────────────────── */
export default async function ArticlePage({ params }) {
  const { slug } = await params
  const supabase = createServerSupabaseClient()

  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title, slug, body, tags, meta_description, featured_image, created_at, author_id, authors(id, name, bio, photo_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article || error) notFound()

  const bodyHTML = addCaptions(renderBody(article.body))
  const publishedDate = new Date(article.created_at).toLocaleDateString('ms-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      <div className="article-page">

        {/* ── Nav bar spacer ── */}
        <div style={{ height: '62px' }} />

        {/* ── Article header ── */}
        <header className="article-header">
          <div className="container" style={{ maxWidth: '860px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '20px', paddingRight: '20px', boxSizing: 'border-box' }}>
            <Link href="/" className="article-back">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Kembali ke laman utama
            </Link>

            {article.tags?.length > 0 && (
              <div className="article-tags">
                {article.tags.map(tag => (
                  <span key={tag} className={`tag ${tagClass(tag)}`}>{tag}</span>
                ))}
              </div>
            )}

            <h1 className="article-title">{article.title}</h1>

            {article.meta_description && (
              <p className="article-deck">{article.meta_description}</p>
            )}

            <div className="article-byline">
              {article.authors ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {article.authors.photo_url ? (
                    <img
                      src={article.authors.photo_url}
                      alt={article.authors.name}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'rgba(212,168,83,0.15)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#d4a853', fontSize: '14px', fontWeight: 700,
                    }}>
                      {article.authors.name[0]}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.3 }}>{article.authors.name}</div>
                    <time dateTime={article.created_at} style={{ fontSize: '12.5px', opacity: 0.55 }}>{publishedDate}</time>
                  </div>
                </div>
              ) : (
                <>
                  <span>Sharpable News</span>
                  <time dateTime={article.created_at}>{publishedDate}</time>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Divider ── */}
        <div className="divider" />

        {/* ── Featured image ── */}
        {article.featured_image && (
          <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 20px 0', boxSizing: 'border-box' }}>
            <img
              src={article.featured_image}
              alt={article.title}
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
            />
          </div>
        )}

        {/* ── Article body ── */}
        <article className="container" style={{ maxWidth: '860px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '20px', paddingRight: '20px', boxSizing: 'border-box' }}>
          {bodyHTML ? (
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: bodyHTML }}
            />
          ) : (
            <div className="article-body article-body--empty">
              <p>Kandungan artikel belum tersedia.</p>
            </div>
          )}
        </article>

        {/* ── Author bio card ── */}
        {article.authors && (
          <div style={{ maxWidth: '860px', margin: '24px auto 40px', padding: '0 20px', boxSizing: 'border-box' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '16px',
              padding: '20px 24px',
              border: '1px solid rgba(237,232,223,0.09)',
              borderLeft: '3px solid rgba(212,168,83,0.4)',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.02)',
            }}>
              {article.authors.photo_url ? (
                <img
                  src={article.authors.photo_url}
                  alt={article.authors.name}
                  style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' }}
                />
              ) : (
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                  background: 'rgba(212,168,83,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#d4a853', fontSize: '18px', fontWeight: 700,
                }}>
                  {article.authors.name[0]}
                </div>
              )}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(212,168,83,0.7)', marginBottom: '4px' }}>
                  Tentang Penulis
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{article.authors.name}</div>
                {article.authors.bio && (
                  <div style={{ fontSize: '13.5px', lineHeight: 1.6, opacity: 0.65 }}>{article.authors.bio}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Footer nav ── */}
        <div className="article-footer-nav">
          <div className="container" style={{ maxWidth: '860px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '20px', paddingRight: '20px', boxSizing: 'border-box' }}>
            <Link href="/" className="article-back">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Kembali ke laman utama
            </Link>
          </div>
        </div>

      </div>
    </>
  )
}
