import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import ArtikelClient from './ArtikelClient'

export const dynamic = 'force-dynamic'

export default async function ArtikelPage() {
  const supabase = createAdminSupabaseClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, status, created_at, views')
    .order('created_at', { ascending: false })

  return <ArtikelClient initialArticles={articles ?? []} />
}
