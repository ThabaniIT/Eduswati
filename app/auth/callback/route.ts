// app/auth/callback/route.ts
// Handles the redirect from Supabase email confirmation links
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Fetch role and redirect to the right dashboard
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()

      const destination = profile?.role === 'admin' ? '/admin' : '/dashboard'
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  // Return to login with error message if something went wrong
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
