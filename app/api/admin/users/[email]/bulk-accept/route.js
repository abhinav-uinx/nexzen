import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { getAdminSession, getAdminCookieName } from '@/lib/admin/auth'
import { cookies } from 'next/headers'

export async function POST(request, { params }) {
  try {
    const { email } = await params
    const decodedEmail = decodeURIComponent(email)
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getAdminCookieName())?.value
    const session = await getAdminSession(sessionToken)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in user bulk accept:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
