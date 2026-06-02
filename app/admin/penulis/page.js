import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import PenulisClient from './PenulisClient'

export const dynamic = 'force-dynamic'

export default async function PenulisPage() {
  const db = createAdminSupabaseClient()
  const { data: authors } = await db
    .from('authors')
    .select('*')
    .order('name', { ascending: true })

  return <PenulisClient initialAuthors={authors ?? []} />
}
