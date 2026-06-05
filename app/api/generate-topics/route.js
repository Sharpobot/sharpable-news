import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { isAuthed } from '@/lib/api/isAuthed'

export async function POST(request) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const topicDirection = body.topicDirection?.trim() || null

  const db = createAdminSupabaseClient()

  // Create article as 'generating' — the pipeline transitions it to
  // 'awaiting_topic_selection' once agents 1+2 complete and options are ready
  const tempSlug = `draft-${Date.now()}`
  const { data, error } = await db
    .from('articles')
    .insert({ status: 'awaiting_topic_selection', slug: tempSlug })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[generate-topics] DB insert error:', error?.message)
    return Response.json({ error: 'Gagal mencipta artikel' }, { status: 500 })
  }

  const articleId = data.id

  // Fire the full pipeline — it will pause at waitForEvent after agents 1+2
  const inngestUrl = process.env.INNGEST_DEV === '1'
    ? 'http://localhost:8288/e/test'
    : `https://inn.gs/e/${process.env.INNGEST_EVENT_KEY ?? ''}`

  fetch(inngestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'article/generate',
      data: { articleId, topicDirection },
    }),
  }).catch(err => console.error('[generate-topics] Inngest send error:', err))

  return Response.json({ articleId })
}
