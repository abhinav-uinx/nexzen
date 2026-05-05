import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { getAppUserForRequest } from '@/lib/auth/user-session'
import { normalizeEmail, normalizeMultilineText, normalizeText } from '@/lib/security/validation'

export async function POST(req) {
  try {
    const { appUser } = await getAppUserForRequest(req)
    const body = await req.json()
    const name = normalizeText(body?.name, 120)
    const email = normalizeEmail(body?.email)
    const subject = normalizeText(body?.subject, 160)
    const message = normalizeMultilineText(body?.message, 4000)

    if (!email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        name,
        email,
        subject,
        message,
        userId: appUser?.id || null,
        status: 'OPEN',
        priority: 'NORMAL'
      }
    })

    return NextResponse.json({ success: true, ticketId: ticket.id }, { status: 201 })
  } catch (error) {
    console.error('Failed to create support ticket:', error)
    return NextResponse.json({ error: 'Failed to create support ticket' }, { status: 500 })
  }
}
