import { NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/database/nexus-db'

export async function GET() {
  try {
    const prisma = getPrismaClient()
    const keys = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'))
    
    return NextResponse.json({ 
        ok: true, 
        models: keys,
        stats: { 
            wishlist: typeof prisma.wishlistItem !== 'undefined', 
            users: typeof prisma.user !== 'undefined', 
            products: typeof prisma.product !== 'undefined' 
        } 
    })
  } catch (error) {
    return NextResponse.json({ 
        ok: false, 
        error: error.message, 
        stack: error.stack 
    }, { status: 500 })
  }
}
