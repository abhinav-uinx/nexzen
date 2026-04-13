import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { getAdminSession, getAdminCookieName } from '@/lib/admin/auth'
import { cookies } from 'next/headers'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminCookieName())?.value
    const session = await getAdminSession(sessionToken)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body // e.g., 'accept_all', 'reject_all'

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 })
    }

    const newStatus = action === 'accept_all' ? 'accepted' : 'rejected'

    // Perform bulk update of items
    await prisma.orderItem.updateMany({
      where: { orderId: id },
      data: { status: newStatus }
    })

    // Update parent order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: newStatus },
      include: {
        items: true
      }
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Error in bulk order action:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
