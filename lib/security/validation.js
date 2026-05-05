const HTTPS_URL = /^https:\/\/[^\s]+$/i
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{7,14}$/
const PINCODE_PATTERN = /^[0-9]{6}$/

export function normalizeText(value, maxLength = 255) {
  return `${value || ''}`.trim().slice(0, maxLength)
}

export function normalizeMultilineText(value, maxLength = 5000) {
  return `${value || ''}`.trim().replace(/\r\n/g, '\n').slice(0, maxLength)
}

export function normalizeEmail(value) {
  return normalizeText(value, 320).toLowerCase()
}

export function normalizeInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = 0 } = {}) {
  const parsed = Number.parseInt(`${value}`, 10)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(max, Math.max(min, parsed))
}

export function normalizeDecimal(value, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = 0 } = {}) {
  const parsed = Number.parseFloat(`${value}`)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(max, Math.max(min, Number(parsed.toFixed(2))))
}

export function isValidHttpsUrl(value) {
  return HTTPS_URL.test(`${value || ''}`.trim())
}

export function isSafeRelativeAssetPath(value) {
  return `${value || ''}`.startsWith('/')
}

export function parseCsvValues(value, maxItems = 25) {
  return `${value || ''}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems)
}

export function isValidPhoneNumber(value) {
  return PHONE_PATTERN.test(normalizeText(value, 20))
}

export function isValidIndianPincode(value) {
  return PINCODE_PATTERN.test(normalizeText(value, 6))
}
