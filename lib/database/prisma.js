import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const globalForPrisma = globalThis

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Fix: Restrict each Next.js Build Worker to 1 connection to prevent Supabase Pool exhaustion
})
const adapter = new PrismaPg(pool)

// VERCEL CACHE BUSTER: 2026-04-12-001
function createPrismaClient() {
  return new PrismaClient({ adapter })
}

function hasExpectedModels(client) {
  return Boolean(
    client &&
      client.admin &&
      client.adminSession &&
      client.category &&
      client.product &&
      client.coupon &&
      client.user &&
      client.userIdentity &&
      client.userSession
  )
}

export function getPrismaClient() {
  if (!hasExpectedModels(globalForPrisma.prisma)) {
    globalForPrisma.prisma = createPrismaClient()
  }

  return globalForPrisma.prisma
}

export const prisma = getPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
