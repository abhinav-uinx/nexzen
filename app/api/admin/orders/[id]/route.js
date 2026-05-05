import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { requireAdminRequest } from '@/lib/admin/request'
import { logAdminAudit } from '@/lib/admin/audit'
import { sendOrderConfirmedEmail } from '@/lib/mail/mailer'
import { normalizeText } from '@/lib/security/validation'

export async function PATCH(request, context) {
  try {
    const auth = await requireAdminRequest(request, { csrf: true })
    if (auth.error) {
      return auth.error
    }

    const { id } = await context.params
    const body = await request.json()
    const status = normalizeText(body?.status, 32).toLowerCase()

    if (!['pending', 'processing', 'accepted', 'waiting', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status }
    })

    // If order is explicitly accepted, send the confirmation
    if (status === 'accepted' && existingOrder.status !== 'accepted') {
      sendOrderConfirmedEmail(
        updatedOrder.customerEmail,
        updatedOrder.id,
        Number(updatedOrder.total)
      ).catch(console.error)
    }

    await logAdminAudit({
      adminId: auth.session.adminId,
      action: 'order_status_updated',
      entityType: 'order',
      entityId: id,
      description: `Updated order ${id.slice(-8)} from ${existingOrder.status} to ${status}.`,
      metadata: {
        previousStatus: existingOrder.status,
        status,
      },
      ipAddress: auth.ip,
      userAgent: request.headers.get('user-agent'),
    }).catch(() => null)

    return NextResponse.json({ ok: true, order: updatedOrder })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
