import { isValidIndianPincode, isValidPhoneNumber, normalizeText } from '@/lib/security/validation'

function normalizeAddressEntry(entry, index) {
  if (!entry || typeof entry !== 'object') {
    return null
  }

  const addressLine1 = normalizeText(entry.addressLine1, 200)
  const city = normalizeText(entry.city, 120)
  const state = normalizeText(entry.state, 120)
  const pincode = normalizeText(entry.pincode, 6)
  const phone = normalizeText(entry.phone, 20)

  if (!addressLine1 || !city || !state || !pincode) {
    return null
  }

  if (!isValidIndianPincode(pincode)) {
    return null
  }

  if (phone && !isValidPhoneNumber(phone)) {
    return null
  }

  return {
    id: normalizeText(entry.id, 64) || `addr-${Date.now()}-${index}`,
    label: normalizeText(entry.label, 80) || `Address ${index + 1}`,
    addressLine1,
    addressLine2: normalizeText(entry.addressLine2, 200) || '',
    city,
    state,
    pincode,
    phone,
    isDefault: Boolean(entry.isDefault),
  }
}

export function normalizeSavedAddresses(value) {
  const rawEntries = Array.isArray(value) ? value : []
  const normalized = rawEntries
    .map((entry, index) => normalizeAddressEntry(entry, index))
    .filter(Boolean)
    .slice(0, 5)

  if (normalized.length === 0) {
    return []
  }

  const hasDefault = normalized.some((entry) => entry.isDefault)

  return normalized.map((entry, index) => ({
    ...entry,
    isDefault: hasDefault ? entry.isDefault : index === 0,
  }))
}
