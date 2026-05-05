import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { requireAdminRequest } from '@/lib/admin/request'

export async function GET(request) {
  try {
    const auth = await requireAdminRequest(request)
    if (auth.error) {
      return auth.error
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
                brand: true,
                barcode: true,
                imageUrl: true,
                category: {
                  select: {
                    name: true
                  }
                }
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

