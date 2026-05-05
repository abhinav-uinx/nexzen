import { getPrismaClient } from '@/lib/database/nexus-db'
import { hashUserSessionToken } from '@/lib/auth/user-auth'

function formatProvider(provider) {
  return `${provider || 'email'}`.toLowerCase()
}

function summarizeDevice(userAgent = '') {
  const agent = `${userAgent || ''}`.toLowerCase()

  if (!agent) {
    return 'Unknown device'
  }

  if (agent.includes('android')) return 'Android device'
  if (agent.includes('iphone')) return 'iPhone'
  if (agent.includes('ipad')) return 'iPad'
  if (agent.includes('windows')) return 'Windows device'
  if (agent.includes('mac os') || agent.includes('macintosh')) return 'Mac device'
  if (agent.includes('linux')) return 'Linux device'

  return 'Signed-in device'
}

export async function getUserSecuritySnapshot({ userId, accessToken }) {
  if (!userId) {
    return null
  }

  const prisma = getPrismaClient()
  const currentSessionHash = accessToken ? hashUserSessionToken(accessToken) : null

  const [user, sessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastLoginAt: true,
        preferredProvider: true,
      },
    }),
    prisma.userSession.findMany({
      where: { userId },
      orderBy: [{ lastSeenAt: 'desc' }, { createdAt: 'desc' }],
      take: 12,
      select: {
        id: true,
        provider: true,
        lastSeenAt: true,
        createdAt: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true,
        sessionTokenHash: true,
      },
    }),
  ])

  return {
    lastLoginAt: user?.lastLoginAt || null,
    preferredProvider: formatProvider(user?.preferredProvider),
    sessions: sessions.map((session) => ({
      id: session.id,
      provider: formatProvider(session.provider),
      lastSeenAt: session.lastSeenAt,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress || '',
      userAgent: session.userAgent || '',
      deviceLabel: summarizeDevice(session.userAgent),
      isCurrent: currentSessionHash ? session.sessionTokenHash === currentSessionHash : false,
    })),
  }
}

export async function revokeOtherUserSessions({ userId, accessToken }) {
  if (!userId || !accessToken) {
    return { revokedCount: 0 }
  }

  const prisma = getPrismaClient()
  const currentSessionHash = hashUserSessionToken(accessToken)

  const result = await prisma.userSession.deleteMany({
    where: {
      userId,
      NOT: {
        sessionTokenHash: currentSessionHash,
      },
    },
  })

  return { revokedCount: result.count || 0 }
}

export async function revokeUserSessionById({ userId, sessionId }) {
  if (!userId || !sessionId) {
    return { revokedCount: 0 }
  }

  const prisma = getPrismaClient()
  const result = await prisma.userSession.deleteMany({
    where: {
      id: sessionId,
      userId,
    },
  })

  return { revokedCount: result.count || 0 }
}
