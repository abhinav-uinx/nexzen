import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { getAdminSession, getAdminCookieName } from '@/lib/admin/auth'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/auth/supabase-server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminCookieName())?.value
    const session = await getAdminSession(sessionToken)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const banners = await prisma.banner.findMany({
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Error fetching admin banners:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminCookieName())?.value
    const session = await getAdminSession(sessionToken)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const title = formData.get('title')
    const subtitle = formData.get('subtitle')
    const eyebrow = formData.get('eyebrow')
    const metric = formData.get('metric')
    const ctaText = formData.get('ctaText')
    const secondaryCtaText = formData.get('secondaryCtaText')
    const secondaryHref = formData.get('secondaryHref')
    const accent = formData.get('accent')
    const link = formData.get('link')
    const order = parseInt(formData.get('order') || '0', 10)
    const imageFile = formData.get('image')

    if (!title || !imageFile) {
      return NextResponse.json({ error: 'Title and image are required' }, { status: 400 })
    }

    // 1. Upload to Supabase Storage
    const supabase = createSupabaseServerClient()
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `banners/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('hero-banners')
      .upload(filePath, imageFile)

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}. Ensure the "hero-banners" bucket exists and is public.` }, { status: 500 })
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('hero-banners')
      .getPublicUrl(filePath)

    // 3. Save to Database
    const newBanner = await prisma.banner.create({
      data: {
        title,
        subtitle,
        eyebrow,
        metric,
        ctaText,
        secondaryCtaText,
        secondaryHref,
        accent,
        link,
        order,
        imageUrl: publicUrl,
        isActive: true
      }
    })

    return NextResponse.json({ banner: newBanner })
  } catch (error) {
    console.error('Error creating banner:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminCookieName())?.value
    const session = await getAdminSession(sessionToken)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()
    if (!id) {
       return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    await prisma.banner.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting banner:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
