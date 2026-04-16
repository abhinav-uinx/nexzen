import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ categories })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, slug, description, icon } = body

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon
      }
    })

    return NextResponse.json({ category })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json()
    const { id, name, slug, description, icon } = body

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        icon
      }
    })

    return NextResponse.json({ category })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json()
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
