import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { getAdminSession, getAdminCookieName } from '@/lib/admin/auth'
import { cookies } from 'next/headers'

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminCookieName())?.value
    const session = await getAdminSession(sessionToken)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminCookieName())?.value
    const session = await getAdminSession(sessionToken)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, discountPercent, isActive } = body

    if (!id) {
       return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 })
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        discountPercent: discountPercent !== undefined ? Number(discountPercent) : undefined,
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
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminCookieName())?.value
    const session = await getAdminSession(sessionToken)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, discountPercent } = body

    if (!name || discountPercent === undefined) {
      return NextResponse.json({ error: 'Name and Discount Percentage required' }, { status: 400 })
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        name: name.toUpperCase().trim(),
        discountPercent: Number(discountPercent),
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


