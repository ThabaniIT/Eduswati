// app/api/ping/route.ts
// Keep-alive endpoint — prevents Supabase free tier from pausing
// Set up cron-job.org to call GET /api/ping every 3 days
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    await supabase.from('plans').select('id').limit(1)
    return NextResponse.json({ ok: true, time: new Date().toISOString() })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
