import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'

export async function GET() {
  try {
    const highlights = await prisma.siteHighlight.findMany({
      orderBy: { order: 'asc' }
    })
    return NextResponse.json({ highlights })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch highlights' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { label, value, detail, order } = body

    const highlight = await prisma.siteHighlight.create({
      data: {
        label,
        value,
        detail,
        order: parseInt(order) || 0
      }
    })

    return NextResponse.json({ highlight })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create highlight' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json()
    const { id, label, value, detail, order } = body

    const highlight = await prisma.siteHighlight.update({
      where: { id },
      data: {
        label,
        value,
        detail,
        order: parseInt(order) || 0
      }
    })

    return NextResponse.json({ highlight })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update highlight' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json()
    await prisma.siteHighlight.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete highlight' }, { status: 500 })
  }
}
