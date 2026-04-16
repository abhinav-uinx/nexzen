import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/client/index.js'
import { Pool } from 'pg'

const globalForPrisma = globalThis

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Fix: Restrict each Next.js Build Worker to 1 connection to prevent Supabase Pool exhaustion
})
const adapter = new PrismaPg(pool)

// VERCEL CACHE BUSTER: 2026-04-13-BANNER-SYSTEM
function createPrismaClient() {
  return new PrismaClient({ adapter })
}

function hasExpectedModels(client) {
  if (!client) return false
  
  // Performance: Check existence of core newly added models first
  return Boolean(
    client.siteHighlight &&
    client.collection &&
    client.banner &&
      client.admin &&
      client.adminSession &&
      client.category &&
      client.product &&
      client.coupon &&
      client.user &&
      client.userIdentity &&
      client.userSession &&
      client.order &&
      client.product &&
      client.category
  )
}

export function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }

  // Self-healing: if models are missing (e.g. after a hot reload with schema change)
  if (!hasExpectedModels(globalForPrisma.prisma)) {
    console.log('[PRISMA] Refreshing client models...')
    globalForPrisma.prisma = createPrismaClient()
  }

  return globalForPrisma.prisma
}

export const prisma = getPrismaClient()
