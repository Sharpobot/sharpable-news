import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import JanaClient from './JanaClient'

export const dynamic = 'force-dynamic'

export default async function JanaPage() {
  const supabase = createAdminSupabaseClient()
  const { data: active } = await supabase
    .from('articles')
    .select('id, title, slug, status, created_at, topic_options, selected_topic')
    .in('status', ['generating', 'awaiting_topic_selection'])
    .order('created_at', { ascending: false })

  return <JanaClient initialArticles={active ?? []} />
}
