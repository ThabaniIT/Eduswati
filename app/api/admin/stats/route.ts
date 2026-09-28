// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? supabase : null
}

export async function GET() {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Total students
  const { count: totalStudents } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')

  // Active subscriptions
  const { count: activeSubscriptions } = await supabase
    .from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active')

  // Expiring subscriptions (next 7 days)
  const in7days = new Date(); in7days.setDate(in7days.getDate() + 7)
  const { count: expiring } = await supabase
    .from('subscriptions').select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .lte('expires_at', in7days.toISOString())

  // Overdue
  const { count: overdue } = await supabase
    .from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'overdue')

  // This month's revenue
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
  const { data: monthPayments } = await supabase
    .from('payments').select('amount_szl')
    .eq('status', 'paid')
    .gte('paid_at', startOfMonth.toISOString())

  const monthRevenue = monthPayments?.reduce((sum, p) => sum + p.amount_szl, 0) ?? 0

  // Revenue summary (last 6 months) from view
  const { data: revenueSummary } = await supabase
    .from('admin_revenue_summary').select('*').limit(6)

  // Subscription plan breakdown
  const { data: planBreakdown } = await supabase
    .from('subscriptions')
    .select('plan_id, plans(name)')
    .eq('status', 'active')

  // Count per plan
  const planCounts: Record<string, number> = {}
  planBreakdown?.forEach((s: any) => {
    const name = s.plans?.name ?? 'Unknown'
    planCounts[name] = (planCounts[name] ?? 0) + 1
  })

  // Payment method breakdown
  const { data: paymentMethods } = await supabase
    .from('subscriptions').select('payment_method').eq('status', 'active')

  const methodCounts: Record<string, number> = {}
  paymentMethods?.forEach((s: any) => {
    methodCounts[s.payment_method] = (methodCounts[s.payment_method] ?? 0) + 1
  })

  return NextResponse.json({
    totalStudents,
    activeSubscriptions,
    expiring,
    overdue,
    monthRevenue,
    revenueSummary,
    planCounts,
    methodCounts,
  })
}
