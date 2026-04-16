import { prisma } from '@/lib/database/nexus-db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })
    
    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Failed to fetch banners:', error)
    // Fallback to empty array if DB is not ready or table doesn't exist yet
    return NextResponse.json({ banners: [] })
  }
}
