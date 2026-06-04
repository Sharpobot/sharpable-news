import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { isAuthed } from '@/lib/api/isAuthed'

export async function GET(request) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const articleId = searchParams.get('articleId')
  if (!articleId) return Response.json({ error: 'articleId required' }, { status: 400 })

  const db = createAdminSupabaseClient()

  const [{ data: progress, error }, { data: article }] = await Promise.all([
    db.from('article_generation_progress')
      .select('agent_name, status, message, updated_at')
      .eq('article_id', articleId)
      .order('updated_at', { ascending: false }),
    db.from('articles')
      .select('status, topic_options')
      .eq('id', articleId)
      .single(),
  ])

  if (error) return Response.json({ progress: [], articleStatus: null, topicOptions: null })

  return Response.json({
    progress:      progress ?? [],
    articleStatus: article?.status ?? null,
    topicOptions:  article?.topic_options ?? null,
  })
}
