import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { isAuthed } from '@/lib/api/isAuthed'

export async function GET(request, { params }) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = createAdminSupabaseClient()
  const { data, error } = await db
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 404 })
  return Response.json({ article: data })
}

export async function PATCH(request, { params }) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const allowed = ['title', 'body', 'slug', 'meta_description', 'tags', 'status', 'featured_image']
  const patch = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  const db = createAdminSupabaseClient()
  const { data, error } = await db
    .from('articles')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ article: data })
}

export async function DELETE(request, { params }) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = createAdminSupabaseClient()

  // Remove progress rows first (FK constraint)
  await db.from('article_generation_progress').delete().eq('article_id', id)

  const { error } = await db.from('articles').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
