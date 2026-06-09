import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/* POST /api/subscribe — save email to subscribers table */
export async function POST(req) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email diperlukan.' }, { status: 400 })
    }

    // Basic email format check server-side
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Format emel tidak sah.' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    // Check for duplicate
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Emel ini sudah berdaftar.' }, { status: 409 })
    }

    const { error } = await supabase
      .from('subscribers')
      .insert({ email: email.trim().toLowerCase(), source: 'homepage' })

    if (error) {
      // Handle unique constraint violation (race condition)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Emel ini sudah berdaftar.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Ralat pelayan. Cuba lagi.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Ralat pelayan. Cuba lagi.' }, { status: 500 })
  }
}
