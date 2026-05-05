import { getPrismaClient } from '@/lib/database/nexus-db'
import { normalizeSavedAddresses } from '@/lib/profile/addresses'
import { normalizeText } from '@/lib/security/validation'

function mapUserProfileRow(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    savedAddresses: Array.isArray(row.savedAddresses) ? row.savedAddresses : [],
    savedUpiId: row.savedUpiId,
  }
}

export async function getUserProfileSnapshot(userId) {
  const prisma = getPrismaClient()
  const rows = await prisma.$queryRawUnsafe(
    `
      SELECT
        "id",
        "email",
        "name",
        "phone",
        "addressLine1",
        "addressLine2",
        "city",
        "state",
        "pincode",
        "savedAddresses",
        "savedUpiId"
      FROM "User"
      WHERE "id" = $1
      LIMIT 1
    `,
    userId
  )

  return mapUserProfileRow(Array.isArray(rows) ? rows[0] : null)
}

export async function updateUserProfileSnapshot(userId, input) {
  const prisma = getPrismaClient()
  const savedAddresses = normalizeSavedAddresses(input.savedAddresses)

  await prisma.$executeRawUnsafe(
    `
      UPDATE "User"
      SET
        "phone" = $2,
        "addressLine1" = $3,
        "addressLine2" = $4,
        "city" = $5,
        "state" = $6,
        "pincode" = $7,
        "savedAddresses" = CAST($8 AS jsonb),
        "savedUpiId" = $9,
        "updatedAt" = NOW()
      WHERE "id" = $1
    `,
    userId,
    normalizeText(input.phone, 20) || null,
    normalizeText(input.addressLine1, 200) || null,
    normalizeText(input.addressLine2, 200) || null,
    normalizeText(input.city, 120) || null,
    normalizeText(input.state, 120) || null,
    normalizeText(input.pincode, 6) || null,
    JSON.stringify(savedAddresses),
    normalizeText(input.savedUpiId, 120) || null
  )

  return getUserProfileSnapshot(userId)
}
