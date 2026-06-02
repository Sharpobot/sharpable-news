import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { isAuthed } from '@/lib/api/isAuthed'

export async function PATCH(request, { params }) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const allowed = ['name', 'bio', 'photo_url']
  const patch = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )
  if (patch.name !== undefined) patch.name = patch.name?.trim()
  if (!patch.name) return Response.json({ error: 'name required' }, { status: 400 })
  const db = createAdminSupabaseClient()
  const { data, error } = await db
    .from('authors')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ author: data })
}

export async function DELETE(request, { params }) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = createAdminSupabaseClient()
  // ON DELETE SET NULL handles article unlinking automatically
  const { error } = await db.from('authors').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
