import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { requireAdminRequest } from '@/lib/admin/request'
import { logAdminAudit } from '@/lib/admin/audit'
import { normalizeText } from '@/lib/security/validation'

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const auth = await requireAdminRequest(request, { csrf: true })
    if (auth.error) {
      return auth.error
    }

    const body = await request.json()
    const status = normalizeText(body?.status, 32).toLowerCase()

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
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

    await logAdminAudit({
      adminId: auth.session.adminId,
      action: 'order_item_status_updated',
      entityType: 'order_item',
      entityId: updatedItem.id,
      description: `Updated order item ${updatedItem.id.slice(-8)} to ${status}.`,
      metadata: {
        orderId: updatedItem.orderId,
        status,
        orderStatus: newOrderStatus,
      },
      ipAddress: auth.ip,
      userAgent: request.headers.get('user-agent'),
    }).catch(() => null)

    return NextResponse.json({ item: updatedItem })
  } catch (error) {
    console.error('Error updating order item:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
