import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generateHTML } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { notFound } from 'next/navigation'
import PublicNavbar from '@/app/components/PublicNavbar'
import RelatedArticles from '@/app/components/RelatedArticles'
import Footer from '@/app/components/Footer'

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
  if (typeof body === 'string') return body
  if (body.type === 'doc' && body.content) {
    try { return generateHTML(body, [StarterKit, Image]) } catch { return '' }
  }
  if (typeof body.html === 'string') return body.html
  return ''
}

function addCaptions(html) {
  if (!html) return html
  return html.replace(
    /<img([^>]*?)title="([^"]+)"([^>]*)>/gi,
    (_, before, caption, after) =>
      `<figure class="article-figure"><img${before}${after}><figcaption>${caption}</figcaption></figure>`
  )
}

function parseImageBrief(raw) {
  if (!raw) return null
  try {
    const p = JSON.parse(raw)
    if (p && typeof p === 'object') return p
  } catch { /* legacy plain-text brief */ }
  return null
}

/* ── Page ─────────────────────────────────────────────────── */
export default async function ArticlePage({ params }) {
  const { slug } = await params
  const supabase = createServerSupabaseClient()

  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title, slug, body, tags, meta_description, featured_image, image_brief, created_at, author_id, authors(id, name, bio, photo_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article || error) notFound()

  /* ── Related articles: tag-matched first, fill with recent ── */
  let related = []
  if (article.tags?.length > 0) {
    const { data: tagMatched } = await supabase
      .from('articles')
      .select('id, title, slug, tags, meta_description, featured_image, created_at, authors(name)')
      .eq('status', 'published')
      .neq('id', article.id)
      .overlaps('tags', article.tags)
      .order('created_at', { ascending: false })
      .limit(3)
    related = tagMatched ?? []
  }
  if (related.length < 3) {
    const excludeIds = [article.id, ...related.map(a => a.id)]
    let q = supabase
      .from('articles')
      .select('id, title, slug, tags, meta_description, featured_image, created_at, authors(name)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(3 - related.length)
    for (const id of excludeIds) q = q.neq('id', id)
    const { data: recent } = await q
    related = [...related, ...(recent ?? [])]
  }

  const bodyHTML = addCaptions(renderBody(article.body))
  const imageBrief = parseImageBrief(article.image_brief)
  const featuredCaption = imageBrief?.caption?.trim() ?? ''
  const featuredAlt = imageBrief?.altText?.trim() || article.title
  const publishedDate = new Date(article.created_at).toLocaleDateString('ms-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      <PublicNavbar />

      <div className="article-page">

        {/* Spacer for fixed navbar */}
        <div style={{ height: '62px' }} />

        {/* ── Article header ── */}
        <header className="article-header">
          <div className="container" style={{ maxWidth: '860px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '20px', paddingRight: '20px', boxSizing: 'border-box' }}>

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
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
                      color: '#d4a853', fontSize: '11px', fontWeight: 700,
                    }}>
                      {article.authors.name[0]}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="article-byline-author" style={{
                      fontSize: '13.5px', fontWeight: 600, lineHeight: 1,
                      textDecoration: 'underline', textUnderlineOffset: '3px',
                      textDecorationColor: 'rgba(237,232,223,0.18)',
                    }}>
                      {article.authors.name}
                    </span>
                    <span className="article-byline-sep" style={{ fontSize: '13px', lineHeight: 1 }}>·</span>
                    <time dateTime={article.created_at} className="article-byline-date" style={{ fontSize: '13px', lineHeight: 1 }}>
                      {publishedDate}
                    </time>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Sharpable News</span>
                  <span style={{ opacity: 0.3, fontSize: '13px' }}>·</span>
                  <time dateTime={article.created_at} style={{ fontSize: '13px' }}>{publishedDate}</time>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Divider ── */}
        <div className="divider" />

        {/* ── Featured image ── */}
        {article.featured_image && (
          <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 20px 0', boxSizing: 'border-box' }}>
            {featuredCaption ? (
              <figure className="article-featured-figure">
                <img src={article.featured_image} alt={featuredAlt} />
                <figcaption>{featuredCaption}</figcaption>
              </figure>
            ) : (
              <img
                src={article.featured_image}
                alt={featuredAlt}
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
              />
            )}
          </div>
        )}

        {/* ── Article body ── */}
        <article className="container" style={{ maxWidth: '860px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '20px', paddingRight: '20px', boxSizing: 'border-box' }}>
          {bodyHTML ? (
            <div className="article-body" dangerouslySetInnerHTML={{ __html: bodyHTML }} />
          ) : (
            <div className="article-body article-body--empty">
              <p>Kandungan artikel belum tersedia.</p>
            </div>
          )}
        </article>

        {/* ── Author bio card ── */}
        {article.authors && (
          <div style={{ maxWidth: '860px', margin: '0 auto 40px', padding: '0 20px', boxSizing: 'border-box' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '16px',
              padding: '20px 24px',
              border: '1px solid rgba(237,232,223,0.13)',
              borderLeft: '3px solid #d4a853',
              borderRadius: '6px',
              background: 'rgba(212,168,83,0.06)',
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

        {/* ── Related articles ── */}
        <div style={{ marginBottom: '56px' }}>
          <RelatedArticles articles={related} />
        </div>

      </div>

      {/* ── Footer ── */}
      <Footer />
    </>
  )
}
