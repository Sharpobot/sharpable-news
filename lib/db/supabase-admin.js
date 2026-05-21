import { createClient } from '@supabase/supabase-js'

/**
 * Supabase admin client — uses the service role key.
 * Bypasses RLS. Only use server-side (Inngest functions, API routes).
 * Never expose this client to the browser.
 */
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}
