import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/* GET /api/settings — returns all key-value settings as a plain object */
export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')

    if (error) return NextResponse.json({}, { status: 500 })

    const obj = {}
    for (const row of data ?? []) obj[row.key] = row.value
    return NextResponse.json(obj)
  } catch {
    return NextResponse.json({}, { status: 500 })
  }
}

/* POST /api/settings — upsert a single { key, value } */
export async function POST(req) {
  try {
    const { key, value } = await req.json()
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

    const supabase = createAdminSupabaseClient()
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
