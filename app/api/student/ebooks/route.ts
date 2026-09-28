// app/api/student/ebooks/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const subject = searchParams.get('subject')
  const grade = searchParams.get('grade')

  let query = supabase
    .from('ebooks')
    .select('*')
    .eq('is_active', true)
    .order('subject')

  if (subject) query = query.eq('subject', subject)
  if (grade) query = query.eq('grade', parseInt(grade))

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // RLS already ensures only subscribed students see ebooks
  return NextResponse.json({ ebooks: data })
}
