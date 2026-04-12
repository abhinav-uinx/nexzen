import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { getAdminSession } from '@/lib/admin/auth'
import { cookies } from 'next/headers'
import { getAdminCookieName } from '@/lib/admin/config'

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminCookieName())?.value
    const session = await getAdminSession(sessionToken)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('q') || ''

    let whereClause = {}

    if (search) {
      whereClause = {
        OR: [
          { trackingNumber: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { phone: { contains: search, mode: 'insensitive' } } }
        ]
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50, // limit to 50 for performance
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                imageUrl: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ orders }, { status: 200 })
  } catch (error) {
    console.error('Error fetching admin orders:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
