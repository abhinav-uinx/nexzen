import { NextResponse } from 'next/server'
import { requireAdminRequest } from '@/lib/admin/request'
import { getRecentAdminAuditLogs } from '@/lib/admin/audit'

export async function GET(request) {
  try {
    const auth = await requireAdminRequest(request)
    if (auth.error) {
      return auth.error
    }

    const logs = await getRecentAdminAuditLogs(25)
    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        description: log.description,
        metadata: log.metadata,
        createdAt: log.createdAt,
        adminUsername: log.admin?.username || 'admin',
      })),
    })
  } catch (error) {
    console.error('Could not load admin audit logs:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
