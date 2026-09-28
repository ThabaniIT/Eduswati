// app/api/student/quizzes/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list saved quizzes, optionally filtered by subject
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const subject = searchParams.get('subject')

  let query = supabase
    .from('quizzes')
    .select('*')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  if (subject) query = query.eq('subject', subject)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quizzes: data })
}

// POST — save a generated/selected quiz (question set) before/after taking it
// Body: { subject, title, quiz_type, difficulty, timer_minutes?, questions: [...] }
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject, title, quiz_type, difficulty, timer_minutes, questions } = await request.json()

  if (!subject || !title || !Array.isArray(questions)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      student_id: user.id,
      subject, title,
      quiz_type: quiz_type ?? 'multiple_choice',
      difficulty: difficulty ?? 'medium',
      timer_minutes: timer_minutes ?? null,
      questions,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quiz: data })
}
