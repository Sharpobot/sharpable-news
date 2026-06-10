import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import LanggananClient from './LanggananClient'

export const dynamic = 'force-dynamic'

export default async function LanggganPage() {
  const supabase = createAdminSupabaseClient()
  const { data: subscribers } = await supabase
    .from('subscribers')
    .select('id, email, source, subscribed_at')
    .order('subscribed_at', { ascending: false })

  return <LanggananClient initialSubscribers={subscribers ?? []} />
}
