// app/api/student/study-plans/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { touchStreak, recordStudyHours, incrementSessionsCompleted } from '@/lib/study-stats'

// PATCH — edit fields or update status. If status is set to 'completed',
// logs a study_session and updates statistics automatically.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const updates = await request.json()

  const { data, error } = await supabase
    .from('study_plans')
    .update(updates)
    .eq('id', id)
    .eq('student_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (updates.status === 'completed' && data) {
    const hours = (data.duration_minutes ?? 0) / 60
    await supabase.from('study_sessions').insert({
      student_id: user.id,
      hours,
      subject: data.subject,
      source: 'planner',
      plan_id: data.id,
    })
    await touchStreak(supabase, user.id)
    await recordStudyHours(supabase, user.id, hours)
    await incrementSessionsCompleted(supabase, user.id)
  }

  return NextResponse.json({ plan: data })
}

// DELETE — remove a study plan task
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('study_plans')
    .delete()
    .eq('id', id)
    .eq('student_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
