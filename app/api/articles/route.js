import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const isAuth = cookieStore.get('admin-auth')?.value === 'true'
  if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminSupabaseClient()
  const { data, error } = await db
    .from('articles')
    .select('id, title, slug, status, created_at')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ articles: data ?? [] })
}
