import { getClientIpFromHeaders } from '@/lib/security/request'

const RATE_WINDOW_MS = 10 * 60 * 1000
const STEP_UP_AFTER_ATTEMPTS = 10
const MAX_LOGIN_ATTEMPTS = 15

const globalState = globalThis

if (!globalState.__nexzenAdminSecurity) {
  globalState.__nexzenAdminSecurity = {
    attempts: new Map(),
    failures: new Map(),
  }
}

const store = globalState.__nexzenAdminSecurity

function now() {
  return Date.now()
}

function cleanup(map, windowMs) {
  const cutoff = now() - windowMs

  for (const [key, values] of map.entries()) {
    const filtered = values.filter((value) => value > cutoff)

    if (filtered.length === 0) {
      map.delete(key)
    } else {
      map.set(key, filtered)
    }
  }
}

export function isIpAllowed(ip, allowedIps) {
  if (!allowedIps || allowedIps.length === 0) {
    return true
  }

  if (!ip) {
    return false
  }

  return allowedIps.includes(ip)
}

export function getLoginRateLimitState(key) {
  cleanup(store.attempts, RATE_WINDOW_MS)
  cleanup(store.failures, RATE_WINDOW_MS)
  const timestamps = store.attempts.get(key) || []
  const failedTimestamps = store.failures.get(key) || []
  const retryAfterMs =
    timestamps.length >= MAX_LOGIN_ATTEMPTS
      ? Math.max(0, timestamps[0] + RATE_WINDOW_MS - now())
      : 0

  return {
    allowed: retryAfterMs === 0,
    failedAttempts: failedTimestamps.length,
    remaining: Math.max(0, MAX_LOGIN_ATTEMPTS - timestamps.length),
    retryAfterMs,
    stepUpRequired: failedTimestamps.length >= STEP_UP_AFTER_ATTEMPTS,
  }
}

export { getClientIpFromHeaders }

export function recordLoginAttempt(key) {
  cleanup(store.attempts, RATE_WINDOW_MS)
  const timestamps = store.attempts.get(key) || []
  timestamps.push(now())
  store.attempts.set(key, timestamps)
}

export function recordFailedLogin(key) {
  cleanup(store.failures, RATE_WINDOW_MS)
  const timestamps = store.failures.get(key) || []
  timestamps.push(now())
  store.failures.set(key, timestamps)

  return Math.min(5000, timestamps.length * 1000)
}

export function clearFailedLogins(key) {
  store.failures.delete(key)
  store.attempts.delete(key)
}

export async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export { MAX_LOGIN_ATTEMPTS, STEP_UP_AFTER_ATTEMPTS }
