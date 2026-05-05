import { NextResponse } from 'next/server'
import { getAppUserForRequest } from '@/lib/auth/user-session'
import {
  getUserSecuritySnapshot,
  revokeOtherUserSessions,
  revokeUserSessionById,
} from '@/lib/auth/user-security'
import { normalizeText } from '@/lib/security/validation'

export async function GET(request) {
  try {
    const { appUser, accessToken } = await getAppUserForRequest(request)
    if (!appUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const security = await getUserSecuritySnapshot({
      userId: appUser.id,
      accessToken,
    })

    return NextResponse.json({ ok: true, security })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load security activity.' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { appUser, accessToken } = await getAppUserForRequest(request)
    if (!appUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const scope = normalizeText(body?.scope, 32).toLowerCase()
    const sessionId = normalizeText(body?.sessionId, 64)

    if (scope === 'others') {
      const result = await revokeOtherUserSessions({
        userId: appUser.id,
        accessToken,
      })

      return NextResponse.json({ ok: true, revokedCount: result.revokedCount })
    }

    if (scope === 'session' && sessionId) {
      const result = await revokeUserSessionById({
        userId: appUser.id,
        sessionId,
      })

      return NextResponse.json({ ok: true, revokedCount: result.revokedCount })
    }

    return NextResponse.json({ error: 'Unsupported revoke request.' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update active sessions.' }, { status: 500 })
  }
}
