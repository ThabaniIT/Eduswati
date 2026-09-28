// app/api/student/study-alarms/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { touchStreak, recordStudyHours, incrementSessionsCompleted } from '@/lib/study-stats'

// PATCH — edit fields, toggle is_active, or log a finished Pomodoro session.
// Pass { session_completed: true, minutes_studied } to log a study session tied to this alarm.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { session_completed, minutes_studied, ...updates } = body

  let alarm = null
  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabase
      .from('study_alarms')
      .update(updates)
      .eq('id', id)
      .eq('student_id', user.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    alarm = data
  } else {
    const { data } = await supabase
      .from('study_alarms')
      .select('*')
      .eq('id', id)
      .eq('student_id', user.id)
      .single()
    alarm = data
  }

  if (session_completed && alarm) {
    const hours = (minutes_studied ?? alarm.study_minutes ?? 25) / 60
    await supabase.from('study_sessions').insert({
      student_id: user.id,
      hours,
      subject: alarm.subject,
      source: 'alarm',
      alarm_id: alarm.id,
    })
    await touchStreak(supabase, user.id)
    await recordStudyHours(supabase, user.id, hours)
    await incrementSessionsCompleted(supabase, user.id)
  }

  return NextResponse.json({ alarm })
}

// DELETE — remove an alarm
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('study_alarms')
    .delete()
    .eq('id', id)
    .eq('student_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
