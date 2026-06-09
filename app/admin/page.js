import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createAdminSupabaseClient()

  const { data: articles } = await supabase
    .from('articles')
    .select('id, status, created_at')
    .order('created_at', { ascending: false })

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: weeklyArticles } = await supabase
    .from('articles')
    .select('id, status, created_at')
    .gte('created_at', sevenDaysAgo.toISOString())
    .neq('status', 'generating')

  const { data: recentPublished } = await supabase
    .from('articles')
    .select('id, title, slug, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(5)

  /* Most-read: top 5 published by views */
  const { data: mostRead } = await supabase
    .from('articles')
    .select('id, title, slug, views')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(5)

  /* Views this week (sum of published articles created in last 7 days) */
  const { data: weeklyPublished } = await supabase
    .from('articles')
    .select('views')
    .eq('status', 'published')
    .gte('created_at', sevenDaysAgo.toISOString())

  /* Failed this week */
  const { data: weeklyFailed } = await supabase
    .from('articles')
    .select('id')
    .eq('status', 'failed')
    .gte('created_at', sevenDaysAgo.toISOString())

  const allArticles = articles ?? []
  const weekly = weeklyArticles ?? []

  const dailyCounts = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key   = d.toISOString().split('T')[0]
    const label = `${d.getDate()}/${d.getMonth() + 1}`
    return { label, count: weekly.filter(a => a.created_at?.startsWith(key)).length }
  })

  const viewsThisWeek = (weeklyPublished ?? []).reduce((s, a) => s + (a.views ?? 0), 0)
  const failedThisWeek = (weeklyFailed ?? []).length

  const analytics = {
    totalPublished:  allArticles.filter(a => a.status === 'published').length,
    totalDraft:      allArticles.filter(a => a.status === 'draft').length,
    totalGenerating: allArticles.filter(a => a.status === 'generating').length,
    thisWeek:        weekly.length,
    recentPublished: recentPublished ?? [],
    mostRead:        mostRead ?? [],
    viewsThisWeek,
    failedThisWeek,
    dailyCounts,
  }

  return <AdminClient analytics={analytics} />
}
