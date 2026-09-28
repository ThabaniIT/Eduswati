// app/api/student/study-plans/reorder/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST — bulk-update sort_order after a drag-and-drop reorder
// Body: { order: [{ id, sort_order }, ...] }
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { order } = await request.json()
  if (!Array.isArray(order)) {
    return NextResponse.json({ error: 'order must be an array' }, { status: 400 })
  }

  const updates = await Promise.all(
    order.map(({ id, sort_order }: { id: string; sort_order: number }) =>
      supabase
        .from('study_plans')
        .update({ sort_order })
        .eq('id', id)
        .eq('student_id', user.id)
    )
  )

  const failed = updates.find(u => u.error)
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
