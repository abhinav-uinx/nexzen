import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { requireAdminRequest } from '@/lib/admin/request'
import { normalizeDecimal, normalizeInteger, normalizeText } from '@/lib/security/validation'

export async function GET(request) {
  try {
    const auth = await requireAdminRequest(request)
    if (auth.error) {
      return auth.error
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ coupons })
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdminRequest(request, { csrf: true })
    if (auth.error) {
      return auth.error
    }

    const body = await request.json()
    const { id, discountPercent, isActive, minOrderValue, maxUses, expiresAt, categorySlug } = body

    if (!id) {
       return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 })
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id: normalizeText(id, 64) },
      data: {
        discountPercent: discountPercent !== undefined ? normalizeInteger(discountPercent, { min: 0, max: 90, fallback: 0 }) : undefined,
        minOrderValue: minOrderValue !== undefined && minOrderValue !== null && `${minOrderValue}` !== ''
          ? normalizeDecimal(minOrderValue, { min: 0, max: 999999, fallback: 0 })
          : null,
        maxUses: maxUses !== undefined && maxUses !== null && `${maxUses}` !== ''
          ? normalizeInteger(maxUses, { min: 1, max: 100000, fallback: 1 })
          : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        categorySlug: normalizeText(categorySlug, 120) || null,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined
      }
    })

    return NextResponse.json({ coupon: updatedCoupon })
  } catch (error) {
    console.error('Error updating coupon:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdminRequest(request, { csrf: true })
    if (auth.error) {
      return auth.error
    }

    const body = await request.json()
    const { name, discountPercent, minOrderValue, maxUses, expiresAt, categorySlug } = body

    if (!name || discountPercent === undefined) {
      return NextResponse.json({ error: 'Name and Discount Percentage required' }, { status: 400 })
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        name: normalizeText(name, 64).toUpperCase(),
        discountPercent: normalizeInteger(discountPercent, { min: 0, max: 90, fallback: 0 }),
        minOrderValue: minOrderValue !== undefined && minOrderValue !== null && `${minOrderValue}` !== ''
          ? normalizeDecimal(minOrderValue, { min: 0, max: 999999, fallback: 0 })
          : null,
        maxUses: maxUses !== undefined && maxUses !== null && `${maxUses}` !== ''
          ? normalizeInteger(maxUses, { min: 1, max: 100000, fallback: 1 })
          : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        categorySlug: normalizeText(categorySlug, 120) || null,
        isActive: true
      }
    })

    return NextResponse.json({ coupon: newCoupon })
  } catch (error) {
    console.error('Error creating coupon:', error)
    if (error.code === 'P2002') {
       return NextResponse.json({ error: 'A coupon with this name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


