// app/api/student/quiz-results/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndAwardAchievements, touchStreak } from '@/lib/study-stats'

// GET — quiz history (most recent first)
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit') ?? 50)

  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('student_id', user.id)
    .order('taken_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ results: data })
}

// POST — save a completed quiz attempt
// Body: { subject, title, quiz_type, difficulty, total_questions, correct_answers,
//         wrong_answers, score, time_taken_seconds, quiz_id? }
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    subject, title, quiz_type, difficulty,
    total_questions, correct_answers, wrong_answers,
    score, time_taken_seconds, quiz_id,
  } = body

  if (!subject || !title || score == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('quiz_results')
    .insert({
      student_id: user.id,
      subject, title,
      quiz_type: quiz_type ?? 'multiple_choice',
      difficulty: difficulty ?? 'medium',
      total_questions: total_questions ?? 0,
      correct_answers: correct_answers ?? 0,
      wrong_answers: wrong_answers ?? 0,
      score,
      time_taken_seconds: time_taken_seconds ?? 0,
      quiz_id: quiz_id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await touchStreak(supabase, user.id)
  const newAchievements = await checkAndAwardAchievements(supabase, user.id, { type: 'quiz', score })

  return NextResponse.json({ result: data, new_achievements: newAchievements })
}
