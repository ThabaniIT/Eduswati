
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  // The actual profile table in EduSwati is "users", not "profiles".
  const { data: profile, error } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (error || profile?.role !== 'admin' || !profile.is_active) {
    return null
  }

  return { supabase, user }
}

// GET — list quizzes and their questions for the admin dashboard.
export async function GET() {
  const admin = await requireAdmin()

  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: quizzes, error } = await admin.supabase
    .from('quizzes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const quizIds = (quizzes ?? []).map((quiz) => quiz.id)

  let questions: Record<string, unknown>[] = []

  if (quizIds.length > 0) {
    const { data, error: questionError } = await admin.supabase
      .from('quiz_questions')
      .select('*')
      .in('quiz_id', quizIds)
      .order('question_order', { ascending: true })

    if (questionError) {
      return NextResponse.json(
        { error: questionError.message },
        { status: 500 }
      )
    }

    questions = data ?? []
  }

  return NextResponse.json({ quizzes: quizzes ?? [], questions })
}

// POST — create a quiz and its questions.
// Body: { title, subject, grade, quiz_type, difficulty,
//         time_limit_seconds, required_access_level, questions: [...] }
export async function POST(request: Request) {
  const admin = await requireAdmin()

  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: any

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    title,
    subject,
    grade,
    quiz_type,
    difficulty,
    time_limit_seconds,
    required_access_level,
    questions,
  } = body

  if (
    typeof title !== 'string' || !title.trim() ||
    typeof subject !== 'string' || !subject.trim() ||
    !Number.isInteger(Number(grade)) ||
    Number(grade) < 8 || Number(grade) > 12 ||
    !Array.isArray(questions) || questions.length === 0
  ) {
    return NextResponse.json(
      { error: 'Provide a title, subject, grade (8–12), and at least one question.' },
      { status: 400 }
    )
  }

  const validTypes = [
    'multiple_choice',
    'true_false',
    'fill_blank',
    'short_answer',
  ]

  for (const question of questions) {
    if (
      typeof question.question !== 'string' ||
      !question.question.trim() ||
      !validTypes.includes(question.question_type) ||
      typeof question.correct_answer !== 'string' ||
      !question.correct_answer.trim() ||
      !Number.isInteger(Number(question.points ?? 1)) ||
      Number(question.points ?? 1) < 1
    ) {
      return NextResponse.json(
        { error: 'Each question needs text, a supported question type, a correct answer, and positive marks.' },
        { status: 400 }
      )
    }

    if (
      question.question_type === 'multiple_choice' &&
      (!Array.isArray(question.options) || question.options.length < 2)
    ) {
      return NextResponse.json(
        { error: 'Multiple-choice questions need at least two options.' },
        { status: 400 }
      )
    }
  }

  const { supabase, user } = admin

  // Create the quiz as inactive first so incomplete quizzes are not published.
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      title: title.trim(),
      subject: subject.trim(),
      grade: Number(grade),
      quiz_type: quiz_type || 'multiple_choice',
      difficulty: difficulty || 'medium',
      time_limit_seconds:
        time_limit_seconds == null || time_limit_seconds === ''
          ? null
          : Number(time_limit_seconds),
      required_access_level: Number(required_access_level ?? 0),
      is_active: false,
      created_by: user.id,
    })
    .select()
    .single()

  if (quizError || !quiz) {
    return NextResponse.json(
      { error: quizError?.message || 'Could not create quiz.' },
      { status: 500 }
    )
  }

  const questionRows = questions.map((question: any, index: number) => ({
    quiz_id: quiz.id,
    question: question.question.trim(),
    question_type: question.question_type,
    options: question.options ?? null,
    correct_answer: question.correct_answer.trim(),
    points: Number(question.points ?? 1),
    question_order: index + 1,
    explanation: question.explanation ?? null,
  }))

  const { error: questionError } = await supabase
    .from('quiz_questions')
    .insert(questionRows)

  if (questionError) {
    // Best-effort cleanup so an incomplete quiz is not left behind.
    await supabase.from('quizzes').delete().eq('id', quiz.id)

    return NextResponse.json(
      { error: questionError.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      message: 'Quiz created as a draft. Publish it after reviewing the questions.',
      quiz,
      question_count: questionRows.length,
    },
    { status: 201 }
  )
}

// PATCH — publish or unpublish a quiz.
export async function PATCH(request: Request) {
  const admin = await requireAdmin()

  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: any

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.id || typeof body.is_active !== 'boolean') {
    return NextResponse.json(
      { error: 'Provide a quiz id and is_active true or false.' },
      { status: 400 }
    )
  }

  const { data: quiz, error } = await admin.supabase
    .from('quizzes')
    .update({ is_active: body.is_active })
    .eq('id', body.id)
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 })
  }

  return NextResponse.json({ quiz })
}