import { getPrismaClient } from '@/lib/database/nexus-db'

export async function logAdminAudit({
  adminId,
  action,
  entityType,
  entityId = null,
  description,
  metadata = null,
  ipAddress = null,
  userAgent = null,
}) {
  if (!adminId || !action || !entityType || !description) {
    return null
  }

  const prisma = getPrismaClient()
  return prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      entityType,
      entityId,
      description,
      metadata,
      ipAddress,
      userAgent,
    },
  })
}

export async function getRecentAdminAuditLogs(limit = 20) {
  const prisma = getPrismaClient()
  return prisma.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      admin: {
        select: {
          username: true,
        },
      },
    },
  })
}
