import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { isAuthed } from '@/lib/api/isAuthed'

export async function GET() {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminSupabaseClient()
  const { data, error } = await db
    .from('authors')
    .select('*')
    .order('name', { ascending: true })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ authors: data ?? [] })
}

export async function POST(request) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { name, bio, photo_url } = body
  if (!name?.trim()) return Response.json({ error: 'name required' }, { status: 400 })
  const db = createAdminSupabaseClient()
  const { data, error } = await db
    .from('authors')
    .insert({ name: name.trim(), bio: bio?.trim() ?? null, photo_url: photo_url ?? null })
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ author: data })
}
