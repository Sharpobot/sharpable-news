import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/* POST /api/subscribe — insert email into subscribers table */
export async function POST(req) {
  try {
    const body = await req.json()
    const email = (body?.email ?? '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'Sila masukkan alamat emel anda.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Format emel tidak sah. Sila semak semula.' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    // Insert directly — let the unique constraint on email catch duplicates
    const { error } = await supabase
      .from('subscribers')
      .insert({
        email,
        source: 'homepage',
        subscribed_at: new Date().toISOString(),
      })

    if (error) {
      // Unique violation = already subscribed
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Emel ini sudah berdaftar.' }, { status: 409 })
      }
      console.error('[subscribe] insert error:', error.message)
      return NextResponse.json({ error: 'Ralat pelayan. Cuba lagi.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[subscribe] unexpected error:', err)
    return NextResponse.json({ error: 'Ralat pelayan. Cuba lagi.' }, { status: 500 })
  }
}
