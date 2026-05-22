import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  const isAuth = cookieStore.get('admin-auth')?.value === 'true'
  if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminSupabaseClient()

  // Create a blank article placeholder row
  // slug is NOT NULL in the schema — use a temp value; seo-metadata agent overwrites it
  const tempSlug = `draft-${Date.now()}`
  const { data, error } = await db
    .from('articles')
    .insert({ status: 'generating', slug: tempSlug })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const articleId = data.id

  // Fire the Inngest pipeline via direct HTTP — bypasses SDK which blocks in dev mode.
  // In dev mode the SDK call waits for function execution; raw fetch returns immediately.
  const inngestUrl = process.env.INNGEST_DEV === '1'
    ? 'http://localhost:8288/e/test'
    : `https://inn.gs/e/${process.env.INNGEST_EVENT_KEY ?? ''}`

  fetch(inngestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'article/generate', data: { articleId } }),
  }).catch(err => console.error('[generate] Inngest send error:', err))

  return Response.json({ articleId })
}
