import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { order: 'asc' }
    })
    return NextResponse.json({ collections })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, slug, description, imageUrl, order, isActive } = body

    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        order: parseInt(order) || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({ collection })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json()
    const { id, name, slug, description, imageUrl, order, isActive } = body

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        imageUrl,
        order: parseInt(order) || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({ collection })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json()
    await prisma.collection.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 })
  }
}
