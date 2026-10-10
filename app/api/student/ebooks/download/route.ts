
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
        { error: 'Please log in to download this resource.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const ebookId = searchParams.get('id')

    if (!ebookId) {
      return NextResponse.json(
        { error: 'An eBook ID is required.' },
        { status: 400 }
      )
    }

    // RLS must permit this user to read the requested eBook.
    const { data: ebook, error: ebookError } = await supabase
      .from('ebooks')
      .select('id, title, storage_path, is_active')
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
        { error: 'Resource unavailable or access denied.' },
        { status: 404 }
      )
    }

    const { data: signedFile, error: storageError } =
      await supabase.storage
        .from('ebooks')
        .createSignedUrl(
          ebook.storage_path,
          300,
          { download: true }
        )

    if (storageError || !signedFile?.signedUrl) {
      console.error('eBook signing error:', storageError)

      return NextResponse.json(
        { error: 'Unable to prepare this download.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: signedFile.signedUrl,
      expiresIn: 300,
    })
  } catch (error) {
    console.error('eBook download API error:', error)

    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}