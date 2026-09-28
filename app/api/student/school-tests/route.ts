// app/api/student/school-tests/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — all tests for the student (upcoming + completed), auto-flips past-due to completed
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.rpc('mark_past_tests_completed', { p_student: user.id })

  const { data, error } = await supabase
    .from('school_tests')
    .select('*')
    .eq('student_id', user.id)
    .order('test_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tests: data })
}

// POST — create a test
// Body: { subject, topic?, test_date, test_time?, classroom?, teacher?, notes? }
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { subject, topic, test_date, test_time, classroom, teacher, notes } = body

  if (!subject || !test_date) {
    return NextResponse.json({ error: 'Subject and test_date are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('school_tests')
    .insert({
      student_id: user.id,
      subject, topic: topic ?? null,
      test_date, test_time: test_time ?? null,
      classroom: classroom ?? null, teacher: teacher ?? null,
      notes: notes ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ test: data })
}
