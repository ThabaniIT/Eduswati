// app/api/student/study-plans/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — all study plan tasks
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('study_plans')
    .select('*')
    .eq('student_id', user.id)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plans: data })
}

// POST — create a study plan task
// Body: { subject, topic?, duration_minutes, priority, study_type, repeat_mode, scheduled_date? }
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { subject, topic, duration_minutes, priority, study_type, repeat_mode, scheduled_date } = body

  if (!subject) {
    return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
  }

  // place new task at the end of the list
  const { count } = await supabase
    .from('study_plans')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', user.id)

  const { data, error } = await supabase
    .from('study_plans')
    .insert({
      student_id: user.id,
      subject, topic: topic ?? null,
      duration_minutes: duration_minutes ?? 45,
      priority: priority ?? 'medium',
      study_type: study_type ?? 'reading',
      repeat_mode: repeat_mode ?? 'once',
      scheduled_date: scheduled_date ?? null,
      sort_order: count ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plan: data })
}
