import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, email, subject, message, userId } = body

    if (!email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        name,
        email,
        subject,
        message,
        userId: userId || null,
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
