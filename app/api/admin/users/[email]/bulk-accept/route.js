import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { requireAdminRequest } from '@/lib/admin/request'
import { logAdminAudit } from '@/lib/admin/audit'
import { normalizeEmail } from '@/lib/security/validation'

export async function POST(request, { params }) {
  try {
    const { email } = await params
    const auth = await requireAdminRequest(request, { csrf: true })
    if (auth.error) {
      return auth.error
    }
    const decodedEmail = normalizeEmail(decodeURIComponent(email))

    // Update all items for this user's orders that are pending
    await prisma.orderItem.updateMany({
      where: {
        customerEmail: decodedEmail,
        status: 'pending'
      },
      data: { status: 'accepted' }
    })

    // Update all matching orders to accepted status
    await prisma.order.updateMany({
      where: {
        customerEmail: decodedEmail,
        status: { in: ['pending', 'partially_resolved', 'waiting'] }
      },
      data: { status: 'accepted' }
    })

    await logAdminAudit({
      adminId: auth.session.adminId,
      action: 'accept_all_for_user',
      entityType: 'user_orders',
      entityId: decodedEmail,
      description: `Accepted all pending items for ${decodedEmail}.`,
      metadata: {
        customerEmail: decodedEmail,
      },
      ipAddress: auth.ip,
      userAgent: request.headers.get('user-agent'),
    }).catch(() => null)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in user bulk accept:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
