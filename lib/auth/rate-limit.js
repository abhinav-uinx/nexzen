import { normalizeEmail } from '@/lib/security/validation'

const RATE_WINDOW_MS = 10 * 60 * 1000
const SIGNIN_MAX_ATTEMPTS = 10
const RESET_MAX_ATTEMPTS = 5
const OTP_MAX_ATTEMPTS = 5

const globalState = globalThis

if (!globalState.__nexzenUserAuthRateLimit) {
  globalState.__nexzenUserAuthRateLimit = {
    attempts: new Map(),
  }
}

const store = globalState.__nexzenUserAuthRateLimit

function now() {
  return Date.now()
}

function cleanup(bucket) {
  const cutoff = now() - RATE_WINDOW_MS

  for (const [key, values] of bucket.entries()) {
    const filtered = values.filter((value) => value > cutoff)

    if (filtered.length === 0) {
      bucket.delete(key)
    } else {
      bucket.set(key, filtered)
    }
  }
}

function getLimitForAction(action) {
  switch (action) {
    case 'reset':
    case 'reset-resend':
      return RESET_MAX_ATTEMPTS
    case 'signup':
    case 'signup-resend':
      return OTP_MAX_ATTEMPTS
    default:
      return SIGNIN_MAX_ATTEMPTS
  }
}

function makeKey(action, ipAddress, email) {
  return `${action}:${ipAddress || 'unknown'}:${normalizeEmail(email) || 'unknown'}`
}

export function getUserAuthRateLimitState(action, ipAddress, email) {
  cleanup(store.attempts)
  const key = makeKey(action, ipAddress, email)
  const limit = getLimitForAction(action)
  const timestamps = store.attempts.get(key) || []
  const retryAfterMs =
    timestamps.length >= limit
      ? Math.max(0, timestamps[0] + RATE_WINDOW_MS - now())
      : 0

  return {
    allowed: retryAfterMs === 0,
    key,
    limit,
    remaining: Math.max(0, limit - timestamps.length),
    retryAfterMs,
  }
}

export function recordUserAuthAttempt(action, ipAddress, email) {
  cleanup(store.attempts)
  const key = makeKey(action, ipAddress, email)
  const timestamps = store.attempts.get(key) || []
  timestamps.push(now())
  store.attempts.set(key, timestamps)
}

export function clearUserAuthAttempts(action, ipAddress, email) {
  store.attempts.delete(makeKey(action, ipAddress, email))
}
