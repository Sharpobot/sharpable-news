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

  // All articles (for table + stat counts)
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, status, created_at')
    .order('created_at', { ascending: false })

  // Articles from last 7 days (for weekly chart + thisWeek count)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: weeklyArticles } = await supabase
    .from('articles')
    .select('id, status, created_at')
    .gte('created_at', sevenDaysAgo.toISOString())
    .neq('status', 'generating')

  // 5 most recently published
  const { data: recentPublished } = await supabase
    .from('articles')
    .select('id, title, slug, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(5)

  // Build per-day chart data (server-side, passed as serialisable array)
  const allArticles = articles ?? []
  const weekly = weeklyArticles ?? []

  const dailyCounts = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key   = d.toISOString().split('T')[0]         // YYYY-MM-DD
    const label = `${d.getDate()}/${d.getMonth() + 1}`  // D/M
    return {
      label,
      count: weekly.filter(a => a.created_at?.startsWith(key)).length,
    }
  })

  const analytics = {
    totalPublished:  allArticles.filter(a => a.status === 'published').length,
    totalDraft:      allArticles.filter(a => a.status === 'draft').length,
    totalGenerating: allArticles.filter(a => a.status === 'generating').length,
    thisWeek:        weekly.length,
    recentPublished: recentPublished ?? [],
    dailyCounts,
  }

  return <AdminClient initialArticles={allArticles} analytics={analytics} />
}
