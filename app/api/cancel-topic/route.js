import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { isAuthed } from '@/lib/api/isAuthed'

/**
 * POST /api/cancel-topic
 * Cancels a paused topic-selection pipeline:
 * 1. Deletes the article row from Supabase
 * 2. Fires topic/selected with cancelled:true so waitForEvent exits cleanly
 */
export async function POST(request) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { articleId } = await request.json()
  if (!articleId) return Response.json({ error: 'articleId required' }, { status: 400 })

  const db = createAdminSupabaseClient()

  // Delete article row first
  const { error: deleteError } = await db
    .from('articles')
    .delete()
    .eq('id', articleId)

  if (deleteError) {
    console.error('[cancel-topic] delete error:', deleteError.message)
    return Response.json({ error: 'Gagal memadam artikel' }, { status: 500 })
  }

  // Fire cancellation event to resume and cleanly exit the waiting pipeline
  const inngestUrl = process.env.INNGEST_DEV === '1'
    ? 'http://localhost:8288/e/test'
    : `https://inn.gs/e/${process.env.INNGEST_EVENT_KEY ?? ''}`

  try {
    await fetch(inngestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'topic/selected',
        data: { articleId, cancelled: true },
      }),
    })
  } catch (err) {
    // Non-fatal: pipeline will time out on its own in 24h if event fails
    console.warn('[cancel-topic] Inngest cancel event failed:', err.message)
  }

  return Response.json({ ok: true })
}
