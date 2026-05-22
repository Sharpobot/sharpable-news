import { cookies } from 'next/headers'
import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import LoginForm from './LoginForm'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const isAuth = cookieStore.get('admin-auth')?.value === 'true'

  if (!isAuth) return <LoginForm />

  const supabase = createAdminSupabaseClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, status, created_at')
    .order('created_at', { ascending: false })

  return <AdminClient initialArticles={articles ?? []} />
}
