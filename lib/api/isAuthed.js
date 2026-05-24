import { createSupabaseServerClient } from '@/lib/db/supabase-ssr'

/** Returns true if the incoming request has a valid Supabase Auth session. */
export async function isAuthed() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch {
    return false
  }
}
