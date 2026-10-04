// app/api/student/me/route.ts
// Returns the logged-in student's profile, subscription, and stats

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Get the student's profile.
  // The actual EduSwati table is "users", not "profiles".
  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Student profile query error:', profileError)

    return NextResponse.json(
      {
        error: profileError?.message ?? 'Student profile not found',
      },
      { status: 500 }
    )
  }

  // Block admins from using the student API
  if (profile.role !== 'student') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  // Get the student's active subscription.
  // The subscription table uses student_id.
  // The plan relationship uses subscription_plans.
  const {
    data: subscription,
    error: subscriptionError,
  } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('student_id', user.id)
    .in('status', ['active', 'expiring'])
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (subscriptionError) {
    console.error(
      'Student subscription query error:',
      subscriptionError
    )
  }

  // Study session totals
  const {
    data: sessions,
    error: sessionsError,
  } = await supabase
    .from('study_sessions')
    .select('hours')
    .eq('student_id', user.id)

  if (sessionsError) {
    console.error(
      'Study sessions query error:',
      sessionsError
    )
  }

  const totalHours =
    sessions?.reduce(
      (sum, session) => sum + Number(session.hours || 0),
      0
    ) ?? 0

  // Completed resources
  const {
    count: progressCount,
    error: progressError,
  } = await supabase
    .from('progress')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .eq('student_id', user.id)
    .eq('status', 'completed')

  if (progressError) {
    console.error(
      'Progress query error:',
      progressError
    )
  }

  // Recent quiz results
  const {
    data: quizResults,
    error: quizError,
  } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('student_id', user.id)
    .order('taken_at', {
      ascending: false,
    })
    .limit(10)

  if (quizError) {
    console.error(
      'Quiz results query error:',
      quizError
    )
  }

  const avgScore =
    quizResults && quizResults.length > 0
      ? Math.round(
          quizResults.reduce(
            (sum, quiz) => sum + Number(quiz.score || 0),
            0
          ) / quizResults.length
        )
      : 0

  return NextResponse.json({
    profile,
    subscription: subscription ?? null,
    stats: {
      totalHours: Math.round(totalHours),
      completedResources: progressCount ?? 0,
      quizzesTaken: quizResults?.length ?? 0,
      avgScore,
    },
    quizResults: quizResults ?? [],
  })
}
