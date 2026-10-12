
import { createClient as createAuthClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/student/me
// Returns the authenticated student's profile, subscription, and stats.
export async function GET() {
  const supabase = await createClient()

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
      { error: 'Student profile not found.' },
      { status: 404 }
    )
  }

  if (profile.role !== 'student') {
    return NextResponse.json(
      { error: 'Forbidden.' },
      { status: 403 }
    )
  }

  // Active subscription
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
    console.error('Student subscription query error:', subscriptionError)
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
    console.error('Study sessions query error:', sessionsError)
  }

  const totalHours =
    sessions?.reduce(
      (sum, session) => sum + Number(session.hours || 0),
      0
    ) ?? 0

  // Completed learning resources
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
    console.error('Progress query error:', progressError)
  }

  // Recent quiz results
  const {
    data: quizResults,
    error: quizError,
  } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('student_id', user.id)
    .order('taken_at', { ascending: false })
    .limit(10)

  if (quizError) {
    console.error('Quiz results query error:', quizError)
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
    profile: {
      ...profile,
      // Supabase Auth is the source of truth for the email.
      email: user.email ?? profile.email ?? '',
    },
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

// PATCH /api/student/me
// Updates the authenticated student's password, profile, or notifications.
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

  // Only a student can use this endpoint.
  const {
    data: account,
    error: accountError,
  } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (accountError || !account) {
    return NextResponse.json(
      { error: 'Student account not found.' },
      { status: 404 }
    )
  }

  if (account.role !== 'student') {
    return NextResponse.json(
      { error: 'Forbidden.' },
      { status: 403 }
    )
  }

  let body: Record<string, unknown>

  try {
    const parsedBody: unknown = await request.json()

    if (
      !parsedBody ||
      typeof parsedBody !== 'object' ||
      Array.isArray(parsedBody)
    ) {
      return NextResponse.json(
        { error: 'Request body must be a JSON object.' },
        { status: 400 }
      )
    }

    body = parsedBody as Record<string, unknown>
  } catch {
    return NextResponse.json(
      { error: 'Invalid request data.' },
      { status: 400 }
    )
  }

  // --------------------------------------------------
  // 1. PASSWORD CHANGE
  // Verify the current password before changing it.
  // --------------------------------------------------
  if (Object.prototype.hasOwnProperty.call(body, 'password')) {
    const currentPassword =
      typeof body.current_password === 'string'
        ? body.current_password
        : ''

    const newPassword =
      typeof body.password === 'string'
        ? body.password
        : ''

    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Enter your current password.' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6 || newPassword.length > 128) {
      return NextResponse.json(
        { error: 'The new password must contain 6–128 characters.' },
        { status: 400 }
      )
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'Choose a different password.' },
        { status: 400 }
      )
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'Your account email could not be verified.' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase public environment variables are missing.')

      return NextResponse.json(
        { error: 'Password verification is temporarily unavailable.' },
        { status: 500 }
      )
    }

    // Use a separate client so credential verification does not replace
    // the student's existing authenticated session.
    const verifier = createAuthClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    )

    const {
      data: verification,
      error: verificationError,
    } = await verifier.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (verificationError || !verification.user) {
      return NextResponse.json(
        { error: 'Your current password is incorrect.' },
        { status: 401 }
      )
    }

    // Change the password only after successful verification.
    const {
      data: updatedAuth,
      error: passwordUpdateError,
    } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (passwordUpdateError || !updatedAuth.user) {
      console.error(
        'Password update failed:',
        passwordUpdateError?.message
      )

      return NextResponse.json(
        { error: 'Your password could not be updated. Please try again.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully.',
    })
  }

  // --------------------------------------------------
  // 2. NOTIFICATION PREFERENCES
  // --------------------------------------------------
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

    const suppliedKeys = Object.keys(supplied)

    if (
      suppliedKeys.length === 0 ||
      suppliedKeys.some(key => !allowedKeys.includes(key)) ||
      Object.values(supplied).some(
        value => typeof value !== 'boolean'
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid notification preference values.' },
        { status: 400 }
      )
    }

    const {
      data: current,
      error: currentError,
    } = await supabase
      .from('users')
      .select('notification_preferences')
      .eq('id', user.id)
      .single()

    if (currentError || !current) {
      console.error(
        'Could not load notification preferences:',
        currentError
      )

      return NextResponse.json(
        { error: 'Could not load existing preferences.' },
        { status: 500 }
      )
    }

    const currentValue: unknown = current.notification_preferences

    const existingPreferences =
      currentValue &&
      typeof currentValue === 'object' &&
      !Array.isArray(currentValue)
        ? currentValue as Record<string, unknown>
        : {}

    const mergedPreferences = {
      ...existingPreferences,
      ...supplied,
    }

    const {
      data: updated,
      error: preferenceUpdateError,
    } = await supabase
      .from('users')
      .update({
        notification_preferences: mergedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('notification_preferences')
      .single()

    if (preferenceUpdateError || !updated) {
      console.error(
        'Notification preference update failed:',
        preferenceUpdateError
      )

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

  // --------------------------------------------------
  // 3. PERSONAL INFORMATION
  // --------------------------------------------------
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
      (
        typeof grade !== 'number' ||
        !Number.isInteger(grade) ||
        grade < 8 ||
        grade > 12
      )
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

  const {
    data: updatedProfile,
    error: profileUpdateError,
  } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select('*')
    .single()

  if (profileUpdateError || !updatedProfile) {
    console.error(
      'Student profile update failed:',
      profileUpdateError
    )

    return NextResponse.json(
      { error: 'Could not save your profile changes.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    profile: {
      ...updatedProfile,
      email: user.email ?? updatedProfile.email ?? '',
    },
    message: 'Profile updated successfully.',
  })
}
