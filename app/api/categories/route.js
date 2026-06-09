import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { createServerSupabaseClient } from '@/lib/db/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/categories
 * Returns up to 6 nav categories:
 *   1. Pinned categories from site_settings (comma-separated)
 *   2. Fill remaining slots with most-used tags from published articles
 */
export async function GET() {
  try {
    const adminSb = createAdminSupabaseClient()
    const publicSb = createServerSupabaseClient()

    // 1. Fetch pinned categories from site_settings
    const { data: settingsRow } = await adminSb
      .from('site_settings')
      .select('value')
      .eq('key', 'pinned_categories')
      .single()

    const pinned = settingsRow?.value
      ? settingsRow.value.split(',').map(s => s.trim()).filter(Boolean)
      : []

    const MAX = 6
    const needed = MAX - pinned.length

    let topTags = []
    if (needed > 0) {
      // Fetch tags from all published articles to count frequency
      const { data: articles } = await publicSb
        .from('articles')
        .select('tags')
        .eq('status', 'published')
        .not('tags', 'is', null)

      // Count tag occurrences, skip already-pinned tags
      const counts = {}
      const pinnedLower = new Set(pinned.map(p => p.toLowerCase()))
      for (const row of articles ?? []) {
        for (const tag of row.tags ?? []) {
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

    const categories = [...pinned, ...topTags].slice(0, MAX)
    return NextResponse.json({ categories })
  } catch {
    return NextResponse.json({ categories: [] })
  }
}
