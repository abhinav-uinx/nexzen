export function getClientIpFromHeaders(headersLike) {
  const forwardedFor = headersLike.get('x-forwarded-for')
  const realIp = headersLike.get('x-real-ip')

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  if (realIp) {
    return realIp.trim()
  }

  return ''
}

export function isTrustedOrigin(request, allowedOrigins = []) {
  const origin = request.headers.get('origin')

  if (!origin) {
    return true
  }

  try {
    const requestUrl = new URL(request.url)
    const normalizedAllowedOrigins = [
      requestUrl.origin,
      ...allowedOrigins.filter(Boolean),
    ]

    return normalizedAllowedOrigins.includes(origin)
  } catch {
    return false
  }
}

export function getAllowedOriginsFromEnv() {
  return `${process.env.ALLOWED_ORIGINS || ''}`
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

export function jsonError(message, status = 400, extra = {}) {
  return Response.json({ error: message, ...extra }, { status })
}
