import { cookies } from 'next/headers'
import { createCsrfToken, setAdminSecurityCookies } from '@/lib/admin/request'
import { createAdminOtpChallenge, consumeAdminOtpChallenge } from '@/lib/admin/recovery'
import {
  clearFailedLogins,
  getClientIpFromHeaders,
  getLoginRateLimitState,
  isIpAllowed,
  STEP_UP_AFTER_ATTEMPTS,
} from '@/lib/admin/security'
import { getAllowedAdminIps } from '@/lib/admin/config'
import { getAllowedOriginsFromEnv, isTrustedOrigin } from '@/lib/security/request'
import { normalizeText } from '@/lib/security/validation'
import { sendAdminOtpEmail } from '@/lib/mail/mailer'

function getRateKey(ip, username) {
  return `${ip || 'unknown'}:${username.toLowerCase() || 'unknown'}`
}

export async function POST(request) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    if (!isIpAllowed(ip, getAllowedAdminIps())) {
      return Response.json({ error: 'Not found.' }, { status: 404 })
    }

    if (!isTrustedOrigin(request, getAllowedOriginsFromEnv())) {
      return Response.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const body = await request.json()
    const mode = normalizeText(body?.mode, 24).toLowerCase()
    const username = normalizeText(body?.username, 120)
    const rateState = getLoginRateLimitState(getRateKey(ip, username))

    if (!username) {
      return Response.json({ error: 'Username is required.' }, { status: 400 })
    }

    if (!rateState.stepUpRequired) {
      return Response.json(
        {
          error: `OTP becomes available after ${STEP_UP_AFTER_ATTEMPTS} failed password attempts.`,
          failedAttempts: rateState.failedAttempts,
          stepUpRequired: false,
        },
        { status: 403 }
      )
    }

    if (mode === 'request') {
      const challenge = await createAdminOtpChallenge(username, {
        ipAddress: ip,
        userAgent: request.headers.get('user-agent'),
      })

      if (!challenge?.admin?.email) {
        return Response.json({ error: 'Admin recovery email is not configured.' }, { status: 500 })
      }

      await sendAdminOtpEmail(challenge.admin.email, challenge.admin.username, challenge.code)

      return Response.json({
        ok: true,
        message: `OTP sent to ${challenge.admin.email}.`,
      })
    }

    if (mode === 'verify') {
      const code = normalizeText(body?.code, 12)
      if (!code) {
        return Response.json({ error: 'OTP code is required.' }, { status: 400 })
      }

      const session = await consumeAdminOtpChallenge(username, code, {
        ipAddress: ip,
        userAgent: request.headers.get('user-agent'),
      })

      if (!session) {
        return Response.json({ error: 'Invalid or expired OTP code.' }, { status: 401 })
      }

      clearFailedLogins(getRateKey(ip, username))
      const cookieStore = await cookies()
      setAdminSecurityCookies(cookieStore, session.token, createCsrfToken())

      return Response.json({ ok: true })
    }

    return Response.json({ error: 'Unsupported OTP action.' }, { status: 400 })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'OTP request failed.' },
      { status: 500 }
    )
  }
}
