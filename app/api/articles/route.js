import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { isAuthed } from '@/lib/api/isAuthed'

export async function GET() {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminSupabaseClient()
  const { data, error } = await db
    .from('articles')
    .select('id, title, slug, status, created_at')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ articles: data ?? [] })
}
