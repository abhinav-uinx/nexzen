import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { requireAdminRequest } from '@/lib/admin/request'
import { validateImageFile } from '@/lib/security/upload'
import { isValidHttpsUrl, normalizeInteger, normalizeText } from '@/lib/security/validation'

export async function GET(request) {
  try {
    const auth = await requireAdminRequest(request)
    if (auth.error) {
      return auth.error
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
    const auth = await requireAdminRequest(request, { csrf: true })
    if (auth.error) {
      return auth.error
    }

    const formData = await request.formData()
    const title = normalizeText(formData.get('title'), 160)
    const subtitle = normalizeText(formData.get('subtitle'), 300)
    const eyebrow = normalizeText(formData.get('eyebrow'), 80)
    const metric = normalizeText(formData.get('metric'), 80)
    const ctaText = normalizeText(formData.get('ctaText'), 60)
    const secondaryCtaText = normalizeText(formData.get('secondaryCtaText'), 60)
    const secondaryHref = normalizeText(formData.get('secondaryHref'), 500)
    const accent = normalizeText(formData.get('accent'), 200)
    const link = normalizeText(formData.get('link'), 500)
    const order = normalizeInteger(formData.get('order'), { min: 0, max: 1000, fallback: 0 })
    const imageFile = formData.get('image')

    if (!title || !imageFile) {
      return NextResponse.json({ error: 'Title and image are required' }, { status: 400 })
    }
    if ((secondaryHref && !isValidHttpsUrl(secondaryHref) && !secondaryHref.startsWith('/')) || (link && !isValidHttpsUrl(link) && !link.startsWith('/'))) {
      return NextResponse.json({ error: 'Banner links must be https URLs or relative paths.' }, { status: 400 })
    }
    const validatedImage = validateImageFile(imageFile, { required: true })

    // 1. Upload to Supabase Storage
    const supabase = createSupabaseServerClient()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${validatedImage.extension}`
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

export async function PATCH(request) {
  try {
    const auth = await requireAdminRequest(request, { csrf: true })
    if (auth.error) {
      return auth.error
    }

    const formData = await request.formData()
    const id = normalizeText(formData.get('id'), 64)
    const title = normalizeText(formData.get('title'), 160)
    const subtitle = normalizeText(formData.get('subtitle'), 300)
    const eyebrow = normalizeText(formData.get('eyebrow'), 80)
    const metric = normalizeText(formData.get('metric'), 80)
    const ctaText = normalizeText(formData.get('ctaText'), 60)
    const secondaryCtaText = normalizeText(formData.get('secondaryCtaText'), 60)
    const secondaryHref = normalizeText(formData.get('secondaryHref'), 500)
    const accent = normalizeText(formData.get('accent'), 200)
    const link = normalizeText(formData.get('link'), 500)
    const order = normalizeInteger(formData.get('order'), { min: 0, max: 1000, fallback: 0 })
    const imageFile = formData.get('image')

    if (!id || !title) {
      return NextResponse.json({ error: 'ID and title are required' }, { status: 400 })
    }
    if ((secondaryHref && !isValidHttpsUrl(secondaryHref) && !secondaryHref.startsWith('/')) || (link && !isValidHttpsUrl(link) && !link.startsWith('/'))) {
      return NextResponse.json({ error: 'Banner links must be https URLs or relative paths.' }, { status: 400 })
    }

    const updateData = {
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
    }

    // Handle optional image upload
    if (imageFile && typeof imageFile === 'object' && imageFile.size > 0) {
      const supabase = createSupabaseServerClient()
      const validatedImage = validateImageFile(imageFile, { required: true })
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${validatedImage.extension}`
      const filePath = `banners/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('hero-banners')
        .upload(filePath, imageFile)

      if (uploadError) {
        console.error('Storage Upload Error:', uploadError)
        return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
      }

      const { data: { publicUrl } } = supabase.storage
        .from('hero-banners')
        .getPublicUrl(filePath)

      updateData.imageUrl = publicUrl
    }

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ banner: updatedBanner })
  } catch (error) {
    console.error('Error updating banner:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAdminRequest(request, { csrf: true })
    if (auth.error) {
      return auth.error
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
