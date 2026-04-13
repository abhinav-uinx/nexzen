import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const globalForPrisma = globalThis

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Fix: Restrict each Next.js Build Worker to 1 connection to prevent Supabase Pool exhaustion
})
const adapter = new PrismaPg(pool)

// VERCEL CACHE BUSTER: 2026-04-13-002
function createPrismaClient() {
  return new PrismaClient({ adapter })
}

function hasExpectedModels(client) {
  if (client) {
    const keys = Object.keys(client).filter(k => !k.startsWith('_') && !k.startsWith('$'))
    console.log('[PRISMA_DIAGNOSTIC] Available Models:', keys.join(', '))
  }
  return Boolean(
    client &&
      client.admin &&
      client.adminSession &&
      client.category &&
      client.product &&
      client.coupon &&
      client.user &&
      client.userIdentity &&
      client.userSession &&
      client.order &&
      client.orderItem &&
      client.wishlistItem
  )
}

export function getPrismaClient() {
  if (!hasExpectedModels(globalForPrisma.prisma_vULTIMATE)) {
    globalForPrisma.prisma_vULTIMATE = createPrismaClient()
  }

  return globalForPrisma.prisma_vULTIMATE
}

export const prisma = getPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma_vULTIMATE = prisma
}
