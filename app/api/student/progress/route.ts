// app/api/student/progress/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET  — fetch all progress for the student
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('student_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ progress: data })
}

// POST — upsert a resource's progress status
// Body: { resource_id, resource_type, status, score? }
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { resource_id, resource_type, status, score } = body

  const { data, error } = await supabase
    .from('progress')
    .upsert({
      student_id: user.id,
      resource_id,
      resource_type,
      status,
      score: score ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_id,resource_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ progress: data })
}
