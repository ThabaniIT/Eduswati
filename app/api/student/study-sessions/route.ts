// app/api/student/study-sessions/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — weekly summary for the chart
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Last 7 days
  const since = new Date()
  since.setDate(since.getDate() - 6)

  const { data, error } = await supabase
    .from('study_sessions')
    .select('hours, session_date')
    .eq('student_id', user.id)
    .gte('session_date', since.toISOString().split('T')[0])
    .order('session_date')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessions: data })
}

// POST — log a study session
// Body: { hours, session_date? }
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { hours, session_date } = await request.json()

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({ student_id: user.id, hours, session_date: session_date ?? new Date().toISOString().split('T')[0] })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session: data })
}
