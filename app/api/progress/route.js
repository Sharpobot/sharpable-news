import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { cookies } from 'next/headers'

export async function GET(request) {
  const cookieStore = await cookies()
  const isAuth = cookieStore.get('admin-auth')?.value === 'true'
  if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const articleId = searchParams.get('articleId')
  if (!articleId) return Response.json({ error: 'articleId required' }, { status: 400 })

  const db = createAdminSupabaseClient()
  const { data, error } = await db
    .from('article_generation_progress')
    .select('agent_name, status, message, created_at')
    .eq('article_id', articleId)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ progress: [] })

  return Response.json({ progress: data ?? [] })
}
