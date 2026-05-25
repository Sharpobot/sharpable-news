import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { isAuthed } from '@/lib/api/isAuthed'

const BUCKET = 'article-images'
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB

export async function POST(request) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file      = formData.get('file')
  const articleId = formData.get('articleId')

  if (!file || !articleId)
    return Response.json({ error: 'file and articleId required' }, { status: 400 })

  if (file.size > MAX_BYTES)
    return Response.json({ error: 'Fail terlalu besar (maks 8 MB)' }, { status: 400 })

  if (!file.type.startsWith('image/'))
    return Response.json({ error: 'Hanya fail imej dibenarkan' }, { status: 400 })

  const db  = createAdminSupabaseClient()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  // Use inline/ prefix to distinguish from featured images
  const path = `${articleId}/inline/${Date.now()}.${ext}`

  await db.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, new Uint8Array(arrayBuffer), { contentType: file.type, upsert: true })

  if (uploadError)
    return Response.json({ error: uploadError.message }, { status: 500 })

  const { data } = db.storage.from(BUCKET).getPublicUrl(path)
  return Response.json({ url: data.publicUrl })
}
