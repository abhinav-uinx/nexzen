import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { requireAdminRequest } from '@/lib/admin/request'
import { isSafeRelativeAssetPath, isValidHttpsUrl, normalizeInteger, normalizeText } from '@/lib/security/validation'

export async function GET(request) {
  try {
    const auth = await requireAdminRequest(request)
    if (auth.error) {
      return auth.error
    }
    const collections = await prisma.collection.findMany({
      orderBy: { order: 'asc' }
    })
    return NextResponse.json({ collections })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const auth = await requireAdminRequest(req, { csrf: true })
    if (auth.error) {
      return auth.error
    }
    const body = await req.json()
    const name = normalizeText(body?.name, 120)
    const slug = normalizeText(body?.slug, 120)
    const description = normalizeText(body?.description, 500)
    const imageUrl = normalizeText(body?.imageUrl, 500)
    const order = normalizeInteger(body?.order, { min: 0, max: 1000, fallback: 0 })
    const isActive = body?.isActive !== undefined ? Boolean(body.isActive) : true

    if (imageUrl && !isValidHttpsUrl(imageUrl) && !isSafeRelativeAssetPath(imageUrl)) {
      return NextResponse.json({ error: 'Collection image URL must be https or a local asset path.' }, { status: 400 })
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        order,
        isActive
      }
    })

    return NextResponse.json({ collection })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const auth = await requireAdminRequest(req, { csrf: true })
    if (auth.error) {
      return auth.error
    }
    const body = await req.json()
    const id = normalizeText(body?.id, 64)
    const name = normalizeText(body?.name, 120)
    const slug = normalizeText(body?.slug, 120)
    const description = normalizeText(body?.description, 500)
    const imageUrl = normalizeText(body?.imageUrl, 500)
    const order = normalizeInteger(body?.order, { min: 0, max: 1000, fallback: 0 })
    const isActive = body?.isActive !== undefined ? Boolean(body.isActive) : true

    if (imageUrl && !isValidHttpsUrl(imageUrl) && !isSafeRelativeAssetPath(imageUrl)) {
      return NextResponse.json({ error: 'Collection image URL must be https or a local asset path.' }, { status: 400 })
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        imageUrl,
        order: parseInt(order) || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({ collection })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const auth = await requireAdminRequest(req, { csrf: true })
    if (auth.error) {
      return auth.error
    }
    const { id } = await req.json()
    await prisma.collection.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 })
  }
}
