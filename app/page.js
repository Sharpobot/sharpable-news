import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import HomePageClient from './HomePageClient'

export const revalidate = 60 // revalidate cached page every 60 seconds

export default async function Page() {
  const supabase = createServerSupabaseClient()

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, tags, meta_description, featured_image, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(6)

  return <HomePageClient articles={articles ?? []} />
}
