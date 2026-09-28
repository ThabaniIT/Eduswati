// app/api/student/me/route.ts
// Returns the logged-in student's profile, subscription, and stats
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  // Block admin from student API
  if (profile.role !== 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Active subscription with plan details
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('student_id', user.id)
    .in('status', ['active', 'expiring'])
    .order('expires_at', { ascending: false })
    .limit(1)
    .single()

  // Study session totals
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('hours')
    .eq('student_id', user.id)

  const totalHours = sessions?.reduce((sum, s) => sum + Number(s.hours), 0) ?? 0

  // Progress count
  const { count: progressCount } = await supabase
    .from('progress')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .eq('status', 'completed')

  // Recent quiz results
  const { data: quizResults } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('student_id', user.id)
    .order('taken_at', { ascending: false })
    .limit(10)

  const avgScore = quizResults && quizResults.length > 0
    ? Math.round(quizResults.reduce((s, q) => s + q.score, 0) / quizResults.length)
    : 0

  return NextResponse.json({
    profile,
    subscription,
    stats: {
      totalHours: Math.round(totalHours),
      completedResources: progressCount ?? 0,
      quizzesTaken: quizResults?.length ?? 0,
      avgScore,
    },
    quizResults,
  })
}
