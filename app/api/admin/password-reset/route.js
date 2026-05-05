import { createAdminPasswordReset, consumeAdminPasswordResetToken } from '@/lib/admin/recovery'
import {
  clearFailedLogins,
  getClientIpFromHeaders,
  getLoginRateLimitState,
  isIpAllowed,
  STEP_UP_AFTER_ATTEMPTS,
} from '@/lib/admin/security'
import { getAllowedAdminIps, getAdminBasePath } from '@/lib/admin/config'
import { getAllowedOriginsFromEnv, isTrustedOrigin } from '@/lib/security/request'
import { normalizeText } from '@/lib/security/validation'
import { sendAdminPasswordResetEmail } from '@/lib/mail/mailer'

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

    if (mode === 'request') {
      const username = normalizeText(body?.username, 120)
      const rateState = getLoginRateLimitState(getRateKey(ip, username))

      if (!username) {
        return Response.json({ error: 'Username is required.' }, { status: 400 })
      }

      if (!rateState.stepUpRequired) {
        return Response.json(
          {
            error: `Password reset becomes available after ${STEP_UP_AFTER_ATTEMPTS} failed password attempts.`,
            failedAttempts: rateState.failedAttempts,
            stepUpRequired: false,
          },
          { status: 403 }
        )
      }

      const resetRequest = await createAdminPasswordReset(username, {
        ipAddress: ip,
        userAgent: request.headers.get('user-agent'),
      })

      if (!resetRequest?.admin?.email) {
        return Response.json({ error: 'Admin recovery email is not configured.' }, { status: 500 })
      }

      await sendAdminPasswordResetEmail(
        resetRequest.admin.email,
        resetRequest.admin.username,
        resetRequest.token
      )

      return Response.json({
        ok: true,
        message: `Password reset link sent to ${resetRequest.admin.email}.`,
      })
    }

    if (mode === 'confirm') {
      const token = normalizeText(body?.token, 128)
      const password = `${body?.password || ''}`
      const confirmPassword = `${body?.confirmPassword || ''}`

      if (!token || !password || !confirmPassword) {
        return Response.json({ error: 'Complete the password reset form.' }, { status: 400 })
      }

      if (password !== confirmPassword) {
        return Response.json({ error: 'Passwords do not match.' }, { status: 400 })
      }

      if (password.length < 10) {
        return Response.json({ error: 'Use a password with at least 10 characters.' }, { status: 400 })
      }

      const admin = await consumeAdminPasswordResetToken(token, password)

      if (!admin) {
        return Response.json({ error: 'Invalid or expired reset token.' }, { status: 400 })
      }

      clearFailedLogins(getRateKey(ip, admin.username))

      return Response.json({
        ok: true,
        redirectTo: `${getAdminBasePath()}/login`,
      })
    }

    return Response.json({ error: 'Unsupported password reset action.' }, { status: 400 })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Password reset failed.' },
      { status: 500 }
    )
  }
}
