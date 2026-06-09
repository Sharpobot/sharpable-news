import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import HomePageClient from './HomePageClient'
import PublicNavbarServer from './components/PublicNavbarServer'

export const revalidate = 60

/* Compute read time server-side so body JSON never reaches the client */
function calcReadTime(body) {
  if (!body) return 1
  let text = ''
  try {
    if (typeof body === 'string') {
      text = body.replace(/<[^>]*>/g, ' ')
    } else if (body?.type === 'doc' && Array.isArray(body?.content)) {
      const extract = (nodes) => {
        for (const n of nodes ?? []) {
          if (n.text) text += n.text + ' '
          if (n.content) extract(n.content)
        }
      }
      extract(body.content)
    }
  } catch { /* ignore malformed body */ }
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export default async function Page() {
  const supabase = createServerSupabaseClient()

  const { data: raw } = await supabase
    .from('articles')
    .select('id, title, slug, tags, meta_description, featured_image, body, created_at, authors(name, photo_url)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(33) // enough to fill all slots across the page

  // Strip body after computing read_time — don't ship large TipTap JSON to client
  const articles = (raw ?? []).map(({ body, ...rest }) => ({
    ...rest,
    read_time: calcReadTime(body),
  }))

  // PublicNavbarServer fetches categories server-side — no client flash
  return (
    <>
      <PublicNavbarServer />
      <HomePageClient articles={articles} />
    </>
  )
}
