import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { requireAdminRequest } from '@/lib/admin/request'
import { logAdminAudit } from '@/lib/admin/audit'
import { normalizeText } from '@/lib/security/validation'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const auth = await requireAdminRequest(request, { csrf: true })
    if (auth.error) {
      return auth.error
    }

    const body = await request.json()
    const action = normalizeText(body?.action, 32)

    if (!['accept_all', 'reject_all'].includes(action)) {
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

    await logAdminAudit({
      adminId: auth.session.adminId,
      action: action,
      entityType: 'order',
      entityId: id,
      description: `${action === 'accept_all' ? 'Accepted' : 'Rejected'} all items for order ${id.slice(-8)}.`,
      metadata: {
        status: newStatus,
      },
      ipAddress: auth.ip,
      userAgent: request.headers.get('user-agent'),
    }).catch(() => null)

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Error in bulk order action:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
