import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { isAuthed } from '@/lib/api/isAuthed'

const BUCKET   = 'authors'
const MAX_BYTES = 4 * 1024 * 1024 // 4 MB

export async function POST(request) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData  = await request.formData()
  const file      = formData.get('file')

  if (!file)                           return Response.json({ error: 'file required' }, { status: 400 })
  if (file.size > MAX_BYTES)           return Response.json({ error: 'Fail terlalu besar (maks 4 MB)' }, { status: 400 })
  if (!file.type.startsWith('image/')) return Response.json({ error: 'Hanya fail imej dibenarkan' }, { status: 400 })

  const db  = createAdminSupabaseClient()
  const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // Ensure bucket exists
  await db.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, new Uint8Array(arrayBuffer), { contentType: file.type, upsert: true })

  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

  const { data } = db.storage.from(BUCKET).getPublicUrl(path)
  return Response.json({ url: data.publicUrl })
}
