import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { generateHTML } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
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
  // ProseMirror/Tiptap JSON
  if (body.type === 'doc' && body.content) {
    try {
      return generateHTML(body, [StarterKit])
    } catch {
      return ''
    }
  }
  // Fallback: plain html string stored under body.html
  if (typeof body.html === 'string') return body.html
  return ''
}

/* ── Page ─────────────────────────────────────────────────── */
export default async function ArticlePage({ params }) {
  const { slug } = await params
  const supabase = createServerSupabaseClient()

  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title, slug, body, tags, meta_description, created_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article || error) notFound()

  const bodyHTML = renderBody(article.body)
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
          <div className="container">
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
              <time dateTime={article.created_at}>{publishedDate}</time>
            </div>
          </div>
        </header>

        {/* ── Divider ── */}
        <div className="divider" />

        {/* ── Article body ── */}
        <article className="container">
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

        {/* ── Footer nav ── */}
        <div className="article-footer-nav">
          <div className="container">
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
