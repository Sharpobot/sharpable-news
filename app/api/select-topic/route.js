import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { isAuthed } from '@/lib/api/isAuthed'

export async function POST(request) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { articleId, option } = await request.json()
  if (!articleId || !option) return Response.json({ error: 'articleId and option required' }, { status: 400 })

  const db = createAdminSupabaseClient()

  // Mark article as generating + store selected topic
  const { error } = await db.from('articles').update({
    status: 'generating',
    selected_topic: option,
  }).eq('id', articleId)

  if (error) {
    console.error('[select-topic] DB update error:', error.message)
    return Response.json({ error: 'Gagal mengemaskini artikel' }, { status: 500 })
  }

  // Fire the full generation pipeline with the pre-selected topic
  const inngestUrl = process.env.INNGEST_DEV === '1'
    ? 'http://localhost:8288/e/test'
    : `https://inn.gs/e/${process.env.INNGEST_EVENT_KEY ?? ''}`

  fetch(inngestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'article/generate',
      data: { articleId, preSelectedTopic: option },
    }),
  }).catch(err => console.error('[select-topic] Inngest send error:', err))

  return Response.json({ ok: true, articleId })
}
