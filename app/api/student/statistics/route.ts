// app/api/student/statistics/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — full statistics bundle: rollup row + chart-ready series + upcoming items
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let { data: stats } = await supabase
    .from('study_statistics')
    .select('*')
    .eq('student_id', user.id)
    .maybeSingle()

  if (!stats) {
    const { data: created } = await supabase
      .from('study_statistics')
      .insert({ student_id: user.id })
      .select()
      .single()
    stats = created
  }

  // Weekly study hours (last 7 days)
  const since = new Date()
  since.setDate(since.getDate() - 6)
  const sinceStr = since.toISOString().split('T')[0]

  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('hours, session_date, subject')
    .eq('student_id', user.id)
    .gte('session_date', sinceStr)
    .order('session_date')

  // Quiz performance — last 10 results
  const { data: quizResults } = await supabase
    .from('quiz_results')
    .select('subject, score, difficulty, taken_at')
    .eq('student_id', user.id)
    .order('taken_at', { ascending: false })
    .limit(10)

  // Subject progress — average score per subject across all quiz results
  const { data: allQuizResults } = await supabase
    .from('quiz_results')
    .select('subject, score')
    .eq('student_id', user.id)

  const subjectMap: Record<string, { total: number; count: number }> = {}
  for (const r of allQuizResults ?? []) {
    if (!subjectMap[r.subject]) subjectMap[r.subject] = { total: 0, count: 0 }
    subjectMap[r.subject].total += r.score
    subjectMap[r.subject].count += 1
  }
  const subjectProgress = Object.entries(subjectMap).map(([subject, v]) => ({
    subject,
    average_score: Math.round(v.total / v.count),
    quizzes_taken: v.count,
  }))

  // Upcoming tests (next 5)
  const { data: upcomingTests } = await supabase
    .from('school_tests')
    .select('*')
    .eq('student_id', user.id)
    .eq('status', 'upcoming')
    .order('test_date', { ascending: true })
    .limit(5)

  // Today's quiz/plan/alarm context for dashboard widgets
  const today = new Date().toISOString().split('T')[0]
  const { data: todaysPlans } = await supabase
    .from('study_plans')
    .select('*')
    .eq('student_id', user.id)
    .eq('scheduled_date', today)

  const { data: nextAlarm } = await supabase
    .from('study_alarms')
    .select('*')
    .eq('student_id', user.id)
    .eq('is_active', true)
    .order('alarm_time', { ascending: true })
    .limit(1)
    .maybeSingle()

  // Monthly consistency — sessions per day for last 30 days
  const since30 = new Date()
  since30.setDate(since30.getDate() - 29)
  const { data: monthSessions } = await supabase
    .from('study_sessions')
    .select('session_date')
    .eq('student_id', user.id)
    .gte('session_date', since30.toISOString().split('T')[0])

  return NextResponse.json({
    stats,
    weekly_study_hours: sessions ?? [],
    recent_quiz_results: quizResults ?? [],
    subject_progress: subjectProgress,
    upcoming_tests: upcomingTests ?? [],
    todays_plans: todaysPlans ?? [],
    next_alarm: nextAlarm ?? null,
    monthly_session_dates: (monthSessions ?? []).map(s => s.session_date),
  })
}
