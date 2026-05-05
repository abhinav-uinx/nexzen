import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { requireAdminRequest } from '@/lib/admin/request'
import { normalizeInteger, normalizeText } from '@/lib/security/validation'

export async function GET(request) {
  try {
    const auth = await requireAdminRequest(request)
    if (auth.error) {
      return auth.error
    }
    const highlights = await prisma.siteHighlight.findMany({
      orderBy: { order: 'asc' }
    })
    return NextResponse.json({ highlights })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch highlights' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const auth = await requireAdminRequest(req, { csrf: true })
    if (auth.error) {
      return auth.error
    }
    const body = await req.json()
    const label = normalizeText(body?.label, 80)
    const value = normalizeText(body?.value, 120)
    const detail = normalizeText(body?.detail, 300)
    const order = normalizeInteger(body?.order, { min: 0, max: 1000, fallback: 0 })

    const highlight = await prisma.siteHighlight.create({
      data: {
        label,
        value,
        detail,
        order: parseInt(order) || 0
      }
    })

    return NextResponse.json({ highlight })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create highlight' }, { status: 500 })
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
    const label = normalizeText(body?.label, 80)
    const value = normalizeText(body?.value, 120)
    const detail = normalizeText(body?.detail, 300)
    const order = normalizeInteger(body?.order, { min: 0, max: 1000, fallback: 0 })

    const highlight = await prisma.siteHighlight.update({
      where: { id },
      data: {
        label,
        value,
        detail,
        order: parseInt(order) || 0
      }
    })

    return NextResponse.json({ highlight })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update highlight' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const auth = await requireAdminRequest(req, { csrf: true })
    if (auth.error) {
      return auth.error
    }
    const { id } = await req.json()
    await prisma.siteHighlight.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete highlight' }, { status: 500 })
  }
}
