import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import LoginForm from '@/app/admin/LoginForm'
import EditorClient from './EditorClient'

export const dynamic = 'force-dynamic'

export default async function EditorPage({ params }) {
  const cookieStore = await cookies()
  const isAuth = cookieStore.get('admin-auth')?.value === 'true'

  if (!isAuth) return <LoginForm />

  const { id } = await params
  const supabase = createAdminSupabaseClient()
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !article) redirect('/admin')

  return <EditorClient article={article} />
}
