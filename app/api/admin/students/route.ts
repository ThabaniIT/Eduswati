// app/api/admin/students/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Guard: verify caller is an admin ──────────────────────────
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? supabase : null
}

// GET — full student list with subscription status (uses the admin view)
export async function GET() {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('admin_student_overview')
    .select('*')
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ students: data })
}

// POST — create a new student account (admin only)
// Body: { email, password, full_name, grade, plan_id, payment_method, expires_at }
export async function POST(request: Request) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const adminClient = createAdminClient()
  const body = await request.json()
  const { email, password, full_name, grade, plan_id, payment_method, expires_at } = body

  // 1. Create auth user with service role (bypasses email confirmation for admin-created accounts)
  const { data: { user }, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,   // auto-confirm admin-created students
    user_metadata: { full_name, role: 'student', grade },
  })

  if (createError) return NextResponse.json({ error: createError.message }, { status: 400 })

  // 2. Update the profile with grade (trigger creates it, we just fill grade)
  await adminClient.from('profiles').update({ grade }).eq('id', user!.id)

  // 3. Create subscription
  const { data: plan } = await supabase.from('plans').select('price_szl').eq('id', plan_id).single()
  const { error: subError } = await adminClient.from('subscriptions').insert({
    student_id: user!.id,
    plan_id,
    payment_method,
    status: 'active',
    expires_at,
  })

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 })

  // 4. Log the payment
  await adminClient.from('payments').insert({
    student_id: user!.id,
    amount_szl: plan?.price_szl ?? 0,
    method: payment_method,
    status: 'paid',
  })

  return NextResponse.json({ message: 'Student created', student_id: user!.id })
}
