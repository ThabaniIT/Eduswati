// app/api/student/study-alarms/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — all alarms for the student
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('study_alarms')
    .select('*')
    .eq('student_id', user.id)
    .order('alarm_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alarms: data })
}

// POST — create an alarm
// Body: { alarm_name, subject?, alarm_time, alarm_date?, repeat_mode, custom_days?,
//         notification_type, study_mode, study_minutes, break_minutes, goal? }
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    alarm_name, subject, alarm_time, alarm_date, repeat_mode, custom_days,
    notification_type, study_mode, study_minutes, break_minutes, goal,
  } = body

  if (!alarm_name || !alarm_time) {
    return NextResponse.json({ error: 'alarm_name and alarm_time are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('study_alarms')
    .insert({
      student_id: user.id,
      alarm_name, subject: subject ?? null,
      alarm_time, alarm_date: alarm_date ?? null,
      repeat_mode: repeat_mode ?? 'once',
      custom_days: custom_days ?? [],
      notification_type: notification_type ?? 'popup',
      study_mode: study_mode ?? 'pomodoro',
      study_minutes: study_minutes ?? 25,
      break_minutes: break_minutes ?? 5,
      goal: goal ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alarm: data })
}
