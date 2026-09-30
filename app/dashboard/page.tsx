// app/dashboard/page.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentDashboard from '@/components/StudentDashboard'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Verify the logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Get the student's profile
  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '600px',
            width: '100%',
            padding: '32px',
            borderRadius: '12px',
            background: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <h1>Profile not found</h1>
          <p>
            Your account is authenticated, but your EduSwati student
            profile could not be found.
          </p>
          <p>
            Please contact the administrator if this continues.
          </p>
        </div>
      </div>
    )
  }

  // Students use the student dashboard.
  // Admins should use the admin area.
  if (profile.role === 'admin') {
    redirect('/admin')
  }

  // Get the student's latest active subscription.
  //
  // The subscriptions table uses user_id according to the
  // database/RLS structure.
  const {
    data: subscription,
    error: subscriptionError,
  } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'expiring'])
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Don't prevent the dashboard from loading if the student
  // simply doesn't have a subscription yet.
  if (subscriptionError) {
    console.error(
      'Subscription query error:',
      subscriptionError
    )
  }

  return (
    <StudentDashboard
      profile={profile}
      subscription={subscription ?? null}
    />
  )
}
