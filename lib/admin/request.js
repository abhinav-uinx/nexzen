import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { getAdminCookieName, getAdminSession, getAdminSessionMaxAge } from '@/lib/admin/auth'
import { getAllowedAdminIps } from '@/lib/admin/config'
import { isIpAllowed } from '@/lib/admin/security'
import { getAllowedOriginsFromEnv, getClientIpFromHeaders, isTrustedOrigin, jsonError } from '@/lib/security/request'

const ADMIN_CSRF_COOKIE = 'nexzen_admin_csrf'
const ADMIN_CSRF_HEADER = 'x-csrf-token'

export function getAdminCsrfCookieName() {
  return ADMIN_CSRF_COOKIE
}

export function getAdminCsrfHeaderName() {
  return ADMIN_CSRF_HEADER
}

export function createCsrfToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function setAdminSecurityCookies(cookieStore, sessionToken, csrfToken) {
  cookieStore.set(getAdminCookieName(), sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: getAdminSessionMaxAge(),
  })

  cookieStore.set(ADMIN_CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: getAdminSessionMaxAge(),
  })
}

export function clearAdminSecurityCookies(cookieStore) {
  cookieStore.delete(getAdminCookieName())
  cookieStore.delete(ADMIN_CSRF_COOKIE)
}

function hasValidCsrf(request, cookieStore) {
  const cookieToken = cookieStore.get(ADMIN_CSRF_COOKIE)?.value
  const headerToken = request.headers.get(ADMIN_CSRF_HEADER)

  return Boolean(cookieToken && headerToken && cookieToken === headerToken)
}

export async function requireAdminRequest(request, { csrf = false } = {}) {
  const ip = getClientIpFromHeaders(request.headers)
  const allowedIps = getAllowedAdminIps()

  if (!isIpAllowed(ip, allowedIps)) {
    return { error: jsonError('Not found.', 404) }
  }

  if (!isTrustedOrigin(request, getAllowedOriginsFromEnv())) {
    return { error: jsonError('Forbidden.', 403) }
  }

  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(getAdminCookieName())?.value
  const session = await getAdminSession(sessionToken)

  if (!session) {
    return { error: jsonError('Unauthorized.', 401) }
  }

  if (csrf && !hasValidCsrf(request, cookieStore)) {
    return { error: jsonError('Invalid CSRF token.', 403) }
  }

  return {
    cookieStore,
    ip,
    session,
  }
}
