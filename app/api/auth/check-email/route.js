import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'

export async function POST(request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    return NextResponse.json({ exists: !!user })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check email' }, { status: 500 })
  }
}

