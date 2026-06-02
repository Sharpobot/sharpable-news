import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'

/**
 * GET /api/search?q=query
 * Public endpoint — no auth required.
 * Searches published articles across title + meta_description.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) return Response.json({ results: [] })

  const db = createAdminSupabaseClient()

  const { data, error } = await db
    .from('articles')
    .select('id, title, slug, tags, meta_description, featured_image, created_at')
    .eq('status', 'published')
    .or(`title.ilike.%${q}%,meta_description.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('[search] error:', error.message)
    return Response.json({ results: [] })
  }

  return Response.json({ results: data ?? [] })
}
