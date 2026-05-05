import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { requireAdminRequest } from '@/lib/admin/request'
import { createSupabaseAdminClient, getCategoryImagesBucket } from '@/lib/supabase-admin'
import { isSafeRelativeAssetPath, isValidHttpsUrl, normalizeText } from '@/lib/security/validation'
import { validateImageFile } from '@/lib/security/upload'

function normalizeCategoryImageUrl(value) {
  const normalized = normalizeText(value, 500)
  if (!normalized) {
    return null
  }

  return isValidHttpsUrl(normalized) || isSafeRelativeAssetPath(normalized) ? normalized : null
}

function slugify(value) {
  return `${value || ''}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function saveUploadedImage(image, slug) {
  const validated = validateImageFile(image)

  if (!validated) {
    return null
  }
  const arrayBuffer = await image.arrayBuffer()
  const safeSlug = slug || 'card'
  const filePath = `category-architecture/${safeSlug}-${randomUUID()}${validated.extension}`
  const supabase = createSupabaseAdminClient()
  const bucket = getCategoryImagesBucket()

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, Buffer.from(arrayBuffer), {
      contentType: image.type,
      upsert: false,
      cacheControl: '3600',
    })

  if (error) {
    throw new Error(error.message || 'Could not upload category image to Supabase.')
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data?.publicUrl || null
}

async function readCategoryInput(request, fallbackImageUrl = null) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const name = normalizeText(formData.get('name'), 120)
    const slug = normalizeText(formData.get('slug'), 120)
    const description = normalizeText(formData.get('description'), 500)
    const icon = normalizeText(formData.get('icon'), 60)
    const uploadedImageUrl = await saveUploadedImage(formData.get('image'), slugify(icon || slug || name))
    const manualImageUrl = normalizeCategoryImageUrl(formData.get('imageUrl'))

    return {
      id: normalizeText(formData.get('id'), 64),
      name,
      slug,
      description,
      icon,
      imageUrl: uploadedImageUrl || manualImageUrl || fallbackImageUrl || null,
    }
  }

  const body = await request.json()
  return {
    id: normalizeText(body?.id, 64),
    name: normalizeText(body?.name, 120),
    slug: normalizeText(body?.slug, 120),
    description: normalizeText(body?.description, 500),
    icon: normalizeText(body?.icon, 60),
    imageUrl: normalizeCategoryImageUrl(body?.imageUrl) || fallbackImageUrl || null,
  }
}

export async function GET(request) {
  try {
    const auth = await requireAdminRequest(request)
    if (auth.error) {
      return auth.error
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ categories })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const auth = await requireAdminRequest(req, { csrf: true })
    if (auth.error) {
      return auth.error
    }
    const { name, slug, description, icon, imageUrl } = await readCategoryInput(req)

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon,
        imageUrl,
      }
    })

    return NextResponse.json({ category })
  } catch {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const auth = await requireAdminRequest(req, { csrf: true })
    if (auth.error) {
      return auth.error
    }
    const contentType = req.headers.get('content-type') || ''
    let existingImageUrl = null
    let requestId = ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      requestId = normalizeText(formData.get('id'), 64)
      const existingCategory = await prisma.category.findUnique({
        where: { id: requestId },
        select: { imageUrl: true },
      })
      existingImageUrl = existingCategory?.imageUrl || null

      const name = normalizeText(formData.get('name'), 120)
      const slug = normalizeText(formData.get('slug'), 120)
      const description = normalizeText(formData.get('description'), 500)
      const icon = normalizeText(formData.get('icon'), 60)
      const uploadedImageUrl = await saveUploadedImage(formData.get('image'), slugify(icon || slug || name))
      const manualImageUrl = normalizeCategoryImageUrl(formData.get('imageUrl'))
      const imageUrl = uploadedImageUrl || manualImageUrl || existingImageUrl

      const category = await prisma.category.update({
        where: { id: requestId },
        data: {
          name,
          slug,
          description,
          icon,
          imageUrl,
        }
      })

      return NextResponse.json({ category })
    }

    const { id, name, slug, description, icon, imageUrl } = await readCategoryInput(req)

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        icon,
        imageUrl,
      }
    })

    return NextResponse.json({ category })
  } catch {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const auth = await requireAdminRequest(req, { csrf: true })
    if (auth.error) {
      return auth.error
    }
    const { id } = await req.json()
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
