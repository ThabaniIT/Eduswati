
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
        { error: 'Please log in to read this resource.' },
        { status: 401 }
      )
    }

    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, role, grade, is_active')
      .eq('id', user.id)
      .maybeSingle()

    if (studentError) {
      console.error('Student lookup error:', studentError)
      return NextResponse.json(
        { error: 'Unable to verify your account.' },
        { status: 500 }
      )
    }

    if (
      !student ||
      student.role !== 'student' ||
      student.is_active === false
    ) {
      return NextResponse.json(
        { error: 'An active student account is required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const ebookId = searchParams.get('id')?.trim()

    if (!ebookId) {
      return NextResponse.json(
        { error: 'An eBook ID is required.' },
        { status: 400 }
      )
    }

    // Use the signed-in client so the existing ebooks RLS policy applies.
    const { data: ebook, error: ebookError } = await supabase
      .from('ebooks')
      .select('id, title, grade, storage_path, is_active')
      .eq('id', ebookId)
      .eq('is_active', true)
      .maybeSingle()

    if (ebookError) {
      console.error('eBook lookup error:', ebookError)
      return NextResponse.json(
        { error: 'Unable to verify resource access.' },
        { status: 500 }
      )
    }

    if (!ebook || !ebook.storage_path) {
      return NextResponse.json(
        { error: 'This resource is unavailable or you do not have access.' },
        { status: 404 }
      )
    }

    // A resource with no grade assigned is available to all grades.
    if (
      ebook.grade !== null &&
      ebook.grade !== undefined &&
      Number(ebook.grade) !== Number(student.grade)
    ) {
      return NextResponse.json(
        { error: 'This eBook is not assigned to your grade.' },
        { status: 403 }
      )
    }

    // No download:true option: allow the PDF to display inline.
    const { data: signedFile, error: storageError } =
      await supabase.storage
        .from('ebooks')
        .createSignedUrl(ebook.storage_path, 300)

    if (storageError || !signedFile?.signedUrl) {
      console.error('eBook reader signing error:', storageError)
      return NextResponse.json(
        { error: 'Unable to open this eBook right now.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: signedFile.signedUrl,
      title: ebook.title,
      expiresIn: 300,
    })
  } catch (error) {
    console.error('eBook reader API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
