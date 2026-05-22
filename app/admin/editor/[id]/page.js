import { redirect } from 'next/navigation'
import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import EditorClient from './EditorClient'

export const dynamic = 'force-dynamic'

export default async function EditorPage({ params }) {
  const { id } = await params
  const supabase = createAdminSupabaseClient()
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !article) redirect('/admin/artikel')

  return <EditorClient article={article} />
}
