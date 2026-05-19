import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client.
 * Safe to call from server components, API routes, and server actions.
 * Uses the anon key — RLS controls what is readable.
 * Upgrade to @supabase/ssr + createServerClient when you add auth.
 */
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
    )
  }

  return createClient(url, key)
}
