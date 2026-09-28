// app/api/admin/students/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? supabase : null
}

// GET — single student's full details
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', params.id).single()
  const { data: subscription } = await supabase
    .from('subscriptions').select('*, plan:plans(*)').eq('student_id', params.id)
    .order('created_at', { ascending: false }).limit(1).single()
  const { data: quizResults } = await supabase
    .from('quiz_results').select('*').eq('student_id', params.id).order('taken_at', { ascending: false })
  const { data: payments } = await supabase
    .from('payments').select('*').eq('student_id', params.id).order('paid_at', { ascending: false })

  return NextResponse.json({ profile, subscription, quizResults, payments })
}

// PATCH — update subscription status
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { subscription_status, expires_at } = body

  const { data, error } = await supabase
    .from('subscriptions')
    .update({ status: subscription_status, expires_at })
    .eq('student_id', params.id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ subscription: data })
}

// DELETE — remove student and their auth account
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const adminClient = createAdminClient()
  // Deleting the auth user cascades to profiles via ON DELETE CASCADE
  const { error } = await adminClient.auth.admin.deleteUser(params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message: 'Student deleted' })
}
