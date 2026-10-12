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

/**
 * PATCH /api/student/me
 * Updates the authenticated student's personal information,
 * password, or notification preferences.
 */
export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Please sign in to continue.' },
      { status: 401 }
    )
  }

  // Only students may use this endpoint.
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json(
      { error: 'Student account not found.' },
      { status: 404 }
    )
  }

  if (profile.role !== 'student') {
    return NextResponse.json(
      { error: 'Forbidden.' },
      { status: 403 }
    )
  }

  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request data.' },
      { status: 400 }
    )
  }

  // 1. Update the authenticated student's password in Supabase Auth.
  if (Object.prototype.hasOwnProperty.call(body, 'password')) {
    const password = body.password

    if (
      typeof password !== 'string' ||
      password.length < 6 ||
      password.length > 128
    ) {
      return NextResponse.json(
        { error: 'Password must be between 6 and 128 characters.' },
        { status: 400 }
      )
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      console.error('Student password update failed:', error.message)

      return NextResponse.json(
        { error: 'Password could not be updated. Please try again.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.',
    })
  }

  // 2. Save notification preferences in the users JSONB column.
  if (
    Object.prototype.hasOwnProperty.call(
      body,
      'notification_preferences'
    )
  ) {
    const preferences = body.notification_preferences

    if (
      !preferences ||
      typeof preferences !== 'object' ||
      Array.isArray(preferences)
    ) {
      return NextResponse.json(
        { error: 'Invalid notification preferences.' },
        { status: 400 }
      )
    }

    const supplied = preferences as Record<string, unknown>
    const allowedKeys = [
      'subscription_reminders',
      'weekly_progress_report',
      'new_content_alerts',
    ]

    if (
      Object.keys(supplied).some(
        key => !allowedKeys.includes(key)
      ) ||
      Object.values(supplied).some(
        value => typeof value !== 'boolean'
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid notification preference values.' },
        { status: 400 }
      )
    }

    // Preserve any other existing preference keys.
    const { data: current, error: currentError } = await supabase
      .from('users')
      .select('notification_preferences')
      .eq('id', user.id)
      .single()

    if (currentError) {
      return NextResponse.json(
        { error: 'Could not load existing preferences.' },
        { status: 500 }
      )
    }

    const mergedPreferences = {
      ...(current.notification_preferences || {}),
      ...supplied,
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update({
        notification_preferences: mergedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('notification_preferences')
      .single()

    if (error) {
      console.error('Notification preference update failed:', error)

      return NextResponse.json(
        { error: 'Could not save notification preferences.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notification_preferences: updated.notification_preferences,
      message: 'Notification preferences saved.',
    })
  }

  // 3. Update permitted personal information only.
  const updates: Record<string, unknown> = {}

  if (Object.prototype.hasOwnProperty.call(body, 'full_name')) {
    if (
      typeof body.full_name !== 'string' ||
      body.full_name.trim().length < 2 ||
      body.full_name.trim().length > 100
    ) {
      return NextResponse.json(
        { error: 'Please enter a valid full name.' },
        { status: 400 }
      )
    }

    updates.full_name = body.full_name.trim()
  }

  if (Object.prototype.hasOwnProperty.call(body, 'grade')) {
    const grade = body.grade

    if (
      grade !== null &&
      (!Number.isInteger(grade) || Number(grade) < 8 || Number(grade) > 12)
    ) {
      return NextResponse.json(
        { error: 'Grade must be between 8 and 12.' },
        { status: 400 }
      )
    }

    updates.grade = grade
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'No valid profile changes were provided.' },
      { status: 400 }
    )
  }

  updates.updated_at = new Date().toISOString()

  const { data: updatedProfile, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select('*')
    .single()

  if (error) {
    console.error('Student profile update failed:', error)

    return NextResponse.json(
      { error: 'Could not save your profile changes.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    profile: {
      ...updatedProfile,
      // The authenticated account is the source of truth for email.
      email: user.email,
    },
    message: 'Profile updated successfully.',
  })
}
