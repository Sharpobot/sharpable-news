import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import JanaClient from './JanaClient'

export const dynamic = 'force-dynamic'

export default async function JanaPage() {
  const supabase = createAdminSupabaseClient()
  const { data: generating } = await supabase
    .from('articles')
    .select('id, title, slug, status, created_at')
    .eq('status', 'generating')
    .order('created_at', { ascending: false })

  return <JanaClient initialGenerating={generating ?? []} />
}
