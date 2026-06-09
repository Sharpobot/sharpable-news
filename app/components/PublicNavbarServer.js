/**
 * Server component wrapper — fetches nav categories once, passes to client PublicNavbar.
 * Use this instead of <PublicNavbar /> in any server page component.
 * Never import inside a 'use client' file.
 */
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import PublicNavbar from './PublicNavbar'

const DEFAULT_CATEGORIES = ['Penyelidikan', 'Permulaan', 'Alatan', 'Dasar', 'Analisis', 'Industri']

export default async function PublicNavbarServer() {
  let categories = DEFAULT_CATEGORIES

  try {
    // 1. Fetch pinned categories from site_settings
    const adminSb = createAdminSupabaseClient()
    const { data: row } = await adminSb
      .from('site_settings')
      .select('value')
      .eq('key', 'pinned_categories')
      .maybeSingle()

    const pinned = row?.value
      ? row.value.split(',').map(s => s.trim()).filter(Boolean)
      : []

    const MAX = 6
    const needed = MAX - pinned.length
    let topTags = []

    // 2. Fill remaining slots from most-used tags in published articles
    if (needed > 0) {
      const publicSb = createServerSupabaseClient()
      const { data: articles } = await publicSb
        .from('articles')
        .select('tags')
        .eq('status', 'published')
        .not('tags', 'is', null)

      const counts = {}
      const pinnedLower = new Set(pinned.map(p => p.toLowerCase()))
      for (const a of articles ?? []) {
        for (const tag of a.tags ?? []) {
          if (!pinnedLower.has(tag.toLowerCase())) {
            counts[tag] = (counts[tag] ?? 0) + 1
          }
        }
      }

      topTags = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, needed)
        .map(([tag]) => tag)
    }

    const merged = [...pinned, ...topTags].slice(0, MAX)
    if (merged.length > 0) categories = merged
  } catch {
    /* use defaults on any error */
  }

  return <PublicNavbar categories={categories} />
}
