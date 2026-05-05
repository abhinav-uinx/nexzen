import { cookies } from 'next/headers'
import {
  authenticateAdmin,
  createAdminSession,
} from '@/lib/admin/auth'
import {
  clearFailedLogins,
  getClientIpFromHeaders,
  getLoginRateLimitState,
  isIpAllowed,
  recordFailedLogin,
  recordLoginAttempt,
  STEP_UP_AFTER_ATTEMPTS,
  wait,
} from '@/lib/admin/security'
import { createCsrfToken, setAdminSecurityCookies } from '@/lib/admin/request'
import { getAllowedAdminIps } from '@/lib/admin/config'
import { normalizeText } from '@/lib/security/validation'

export async function handleAdminLogin(request) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const allowedIps = getAllowedAdminIps()

    if (!isIpAllowed(ip, allowedIps)) {
      return Response.json({ error: 'Not found.' }, { status: 404 })
    }

    const body = await request.json()
    const username = normalizeText(body?.username, 120)
    const password = `${body?.password || ''}`
    const rateKey = `${ip || 'unknown'}:${username.toLowerCase() || 'unknown'}`
    const rateState = getLoginRateLimitState(rateKey)

    if (!rateState.allowed) {
      return Response.json(
        {
          error: 'Too many login attempts. Please try OTP or reset your password.',
          failedAttempts: rateState.failedAttempts,
          remaining: rateState.remaining,
          stepUpRequired: true,
          stepUpThreshold: STEP_UP_AFTER_ATTEMPTS,
        },
        { status: 429 }
      )
    }

    recordLoginAttempt(rateKey)

    if (!username || !password) {
      return Response.json({ error: 'Username and password are required.' }, { status: 400 })
    }

    const admin = await authenticateAdmin(username, password)

    if (!admin) {
      const delay = recordFailedLogin(rateKey)
      const failedState = getLoginRateLimitState(rateKey)
      await wait(delay)
      return Response.json(
        {
          error: 'Invalid admin credentials.',
          failedAttempts: failedState.failedAttempts,
          remaining: failedState.remaining,
          stepUpRequired: failedState.stepUpRequired,
          stepUpThreshold: STEP_UP_AFTER_ATTEMPTS,
        },
        { status: 401 }
      )
    }

    clearFailedLogins(rateKey)
    const session = await createAdminSession(admin.id, {
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
    })

    const cookieStore = await cookies()
    setAdminSecurityCookies(cookieStore, session.token, createCsrfToken())

    return Response.json({ ok: true, stepUpThreshold: STEP_UP_AFTER_ATTEMPTS })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Something went wrong during admin login.'

    return Response.json({ error: message }, { status: 500 })
  }
}
