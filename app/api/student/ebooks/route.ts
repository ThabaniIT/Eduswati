
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject')
    const gradeParam = searchParams.get('grade')

    let grade: number | undefined

    if (gradeParam) {
      grade = Number(gradeParam)

      if (
        !Number.isInteger(grade) ||
        grade < 8 ||
        grade > 12
      ) {
        return NextResponse.json(
          { error: 'Grade must be between 8 and 12' },
          { status: 400 }
        )
      }
    }

    let query = supabase
      .from('ebooks')
      .select(`
        id,
        title,
        subject,
        grade,
        description,
        thumbnail_url,
        pages,
        emoji,
        is_free,
        required_access_level,
        is_active
      `)
      .eq('is_active', true)
      .order('subject')

    if (subject) {
      query = query.eq('subject', subject)
    }

    if (grade !== undefined) {
      query = query.eq('grade', grade)
    }

    const { data, error } = await query

    if (error) {
      console.error('eBooks query error:', error)

      return NextResponse.json(
        { error: 'Unable to load eBooks' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ebooks: data ?? [] })
  } catch (error) {
    console.error('eBooks API error:', error)

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
