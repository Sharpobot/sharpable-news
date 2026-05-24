'use server'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/db/supabase-ssr'

export async function logoutAction() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
