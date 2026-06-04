import { isAuthed } from '@/lib/api/isAuthed'

/**
 * POST /api/select-topic
 * Fires a 'topic/selected' Inngest event to resume the paused pipeline.
 * The pipeline itself handles DB updates (status, selected_topic).
 */
export async function POST(request) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { articleId, option } = await request.json()
  if (!articleId || !option) return Response.json({ error: 'articleId and option required' }, { status: 400 })

  const inngestUrl = process.env.INNGEST_DEV === '1'
    ? 'http://localhost:8288/e/test'
    : `https://inn.gs/e/${process.env.INNGEST_EVENT_KEY ?? ''}`

  try {
    const res = await fetch(inngestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'topic/selected',
        data: { articleId, selectedTopic: option },
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('[select-topic] Inngest error:', res.status, text)
      return Response.json({ error: 'Gagal menghantar pilihan topik' }, { status: 500 })
    }
  } catch (err) {
    console.error('[select-topic] fetch error:', err.message)
    return Response.json({ error: 'Gagal menghubungi Inngest' }, { status: 500 })
  }

  return Response.json({ ok: true, articleId })
}
