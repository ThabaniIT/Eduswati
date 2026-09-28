// app/api/admin/ebooks/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? supabase : null
}

// GET — all ebooks (admin sees everything including inactive)
export async function GET() {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase.from('ebooks').select('*').order('subject').order('grade')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ebooks: data })
}

// POST — add a new ebook record (file is uploaded separately via Supabase Storage)
// Body: { title, subject, grade, emoji, color, pages, file_url }
export async function POST(request: Request) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { data, error } = await supabase.from('ebooks').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ebook: data }, { status: 201 })
}

// DELETE — deactivate an ebook (soft delete)
export async function DELETE(request: Request) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()
  const { error } = await supabase.from('ebooks').update({ is_active: false }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'eBook removed' })
}
