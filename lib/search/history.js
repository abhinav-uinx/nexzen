import { getPrismaClient } from '@/lib/database/nexus-db'
import { normalizeInteger, normalizeText } from '@/lib/security/validation'

function normalizeSearchQuery(query) {
  return normalizeText(query, 120).replace(/\s+/g, ' ').trim()
}

function normalizeSearchKey(query) {
  return normalizeSearchQuery(query).toLowerCase()
}

export async function saveUserSearch({ userId, authUserId, query }) {
  const normalizedQuery = normalizeSearchQuery(query)
  const normalizedKey = normalizeSearchKey(query)

  if (!userId || normalizedQuery.length < 2 || !normalizedKey) {
    return null
  }

  const prisma = getPrismaClient()
  const existingEntry = await prisma.searchHistory.findUnique({
    where: {
      userId_normalizedQuery: {
        userId,
        normalizedQuery: normalizedKey,
      },
    },
    select: {
      id: true,
      searchCount: true,
    },
  })

  if (existingEntry) {
    return prisma.searchHistory.update({
      where: { id: existingEntry.id },
      data: {
        query: normalizedQuery,
        authUserId: authUserId || null,
        searchCount: existingEntry.searchCount + 1,
        lastSearchedAt: new Date(),
      },
    })
  }

  return prisma.searchHistory.create({
    data: {
      userId,
      authUserId: authUserId || null,
      query: normalizedQuery,
      normalizedQuery: normalizedKey,
      lastSearchedAt: new Date(),
    },
  })
}

export async function getRecentUserSearches({ userId, limit = 6 }) {
  if (!userId) {
    return []
  }

  const prisma = getPrismaClient()
  const safeLimit = normalizeInteger(limit, { min: 1, max: 12, fallback: 6 })
  const history = await prisma.searchHistory.findMany({
    where: { userId },
    orderBy: [
      { lastSearchedAt: 'desc' },
      { updatedAt: 'desc' },
    ],
    take: safeLimit,
    select: {
      id: true,
      query: true,
      searchCount: true,
      lastSearchedAt: true,
    },
  })

  return history.map((entry) => ({
    id: entry.id,
    query: entry.query,
    searchCount: entry.searchCount,
    lastSearchedAt: entry.lastSearchedAt,
  }))
}

export async function clearUserSearches({ userId }) {
  if (!userId) {
    return 0
  }

  const prisma = getPrismaClient()
  const result = await prisma.searchHistory.deleteMany({
    where: { userId },
  })

  return result.count || 0
}

export async function getTrendingSearches({ limit = 6 }) {
  const prisma = getPrismaClient()
  const safeLimit = normalizeInteger(limit, { min: 1, max: 12, fallback: 6 })
  const history = await prisma.searchHistory.findMany({
    orderBy: [{ searchCount: 'desc' }, { lastSearchedAt: 'desc' }],
    take: safeLimit,
    select: {
      id: true,
      query: true,
      searchCount: true,
    },
  })

  return history.map((entry) => ({
    id: entry.id,
    query: entry.query,
    searchCount: entry.searchCount,
  }))
}
