import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { getAdminSession, getAdminCookieName } from '@/lib/admin/auth'
import { cookies } from 'next/headers'

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminCookieName())?.value
    const session = await getAdminSession(sessionToken)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status required' }, { status: 400 })
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id },
      data: { status },
      include: {
        order: {
          include: {
            items: true
          }
        }
      }
    })

    // Optional: Auto-update parent order status if all items are resolved
    const allItems = updatedItem.order.items
    const allAccepted = allItems.every(item => item.status === 'accepted')
    const allRejected = allItems.every(item => item.status === 'rejected')
    
    let newOrderStatus = updatedItem.order.status
    if (allAccepted) newOrderStatus = 'accepted'
    else if (allRejected) newOrderStatus = 'rejected'
    else if (allItems.some(item => item.status === 'accepted' || item.status === 'rejected')) {
      newOrderStatus = 'partially_resolved'
    }

    if (newOrderStatus !== updatedItem.order.status) {
      await prisma.order.update({
        where: { id: updatedItem.orderId },
        data: { status: newOrderStatus }
      })
    }

    return NextResponse.json({ item: updatedItem })
  } catch (error) {
    console.error('Error updating order item:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
