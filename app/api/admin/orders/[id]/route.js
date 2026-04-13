import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { getAdminSession, getAdminCookieName } from '@/lib/admin/auth'
import { cookies } from 'next/headers'
import { sendOrderConfirmedEmail } from '@/lib/mail/mailer'

export async function PATCH(request, context) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminCookieName())?.value
    const session = await getAdminSession(sessionToken)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { status } = body

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

    return NextResponse.json({ ok: true, order: updatedOrder })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
