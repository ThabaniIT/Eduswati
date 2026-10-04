// app/api/student/plans/route.ts
// Returns active subscription plans for authenticated students

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

  // Verify that the authenticated user is a student
  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json(
      { error: 'User profile not found' },
      { status: 404 }
    )
  }

  if (profile.role !== 'student') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  // Students can view active subscription plans.
  const {
    data: plans,
    error: plansError,
  } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_szl', { ascending: true })

  if (plansError) {
    console.error('Student plans query error:', plansError)

    return NextResponse.json(
      { error: plansError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    plans: plans ?? [],
  })
}