// app/api/student/videos/route.ts
// Returns active video records for the signed-in student. Supabase RLS remains
// responsible for enforcing subscription and access-level permissions.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Please sign in to view video lessons.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subject = searchParams.get('subject')?.trim()
  const gradeValue = searchParams.get('grade')
  const grade = gradeValue ? Number(gradeValue) : null

  let query = supabase
    .from('videos')
    .select('*')
    .eq('is_active', true)
    .order('subject', { ascending: true })
    .order('grade', { ascending: true })

  if (subject) query = query.eq('subject', subject)
  if (grade !== null) {
    if (!Number.isInteger(grade) || grade < 8 || grade > 12) {
      return NextResponse.json({ error: 'Grade must be between 8 and 12.' }, { status: 400 })
    }
    query = query.or(`grade.eq.${grade},grade.is.null`)
  }

  const { data, error } = await query
  if (error) {
    console.error('Student video library query failed:', error.message)
    return NextResponse.json({ error: 'Video lessons could not be loaded. Please try again.' }, { status: 500 })
  }

  // This is a session-bound client: do not use a service-role key or bypass RLS.
  return NextResponse.json({ videos: data || [] })
}
