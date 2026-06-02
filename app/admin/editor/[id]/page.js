import { redirect } from 'next/navigation'
import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import EditorClient from './EditorClient'

export const dynamic = 'force-dynamic'

export default async function EditorPage({ params }) {
  const { id } = await params
  const supabase = createAdminSupabaseClient()

  const [{ data: article, error }, { data: authors }] = await Promise.all([
    supabase.from('articles').select('*, authors(id, name, photo_url)').eq('id', id).single(),
    supabase.from('authors').select('id, name, photo_url').order('name', { ascending: true }),
  ])

  if (error || !article) redirect('/admin/artikel')

  return <EditorClient article={article} authors={authors ?? []} />
}
