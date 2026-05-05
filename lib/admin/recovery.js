import crypto from 'node:crypto'
import { getPrismaClient } from '@/lib/database/nexus-db'
import { createAdminSession, getAdminByUsername, hashAdminSecretToken, updateAdminPassword } from '@/lib/admin/auth'

const OTP_TTL_MS = 10 * 60 * 1000
const RESET_TTL_MS = 30 * 60 * 1000

function generateNumericOtp() {
  return `${crypto.randomInt(0, 1000000)}`.padStart(6, '0')
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex')
}

function getExpiryDate(ttlMs) {
  return new Date(Date.now() + ttlMs)
}

export async function createAdminOtpChallenge(username, context = {}) {
  const prisma = getPrismaClient()
  const admin = await getAdminByUsername(username)

  if (!admin) {
    return null
  }

  const code = generateNumericOtp()
  const codeHash = hashAdminSecretToken(code)

  await prisma.adminOtpChallenge.deleteMany({
    where: {
      adminId: admin.id,
      OR: [
        { consumedAt: { not: null } },
        { expiresAt: { lt: new Date() } },
      ],
    },
  })

  await prisma.adminOtpChallenge.create({
    data: {
      adminId: admin.id,
      codeHash,
      expiresAt: getExpiryDate(OTP_TTL_MS),
      ipAddress: context.ipAddress || null,
      userAgent: context.userAgent || null,
    },
  })

  return {
    admin,
    code,
    expiresAt: getExpiryDate(OTP_TTL_MS),
  }
}

export async function consumeAdminOtpChallenge(username, code, context = {}) {
  const prisma = getPrismaClient()
  const admin = await getAdminByUsername(username)

  if (!admin) {
    return null
  }

  const codeHash = hashAdminSecretToken(code)
  const challenge = await prisma.adminOtpChallenge.findFirst({
    where: {
      adminId: admin.id,
      codeHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!challenge) {
    return null
  }

  await prisma.adminOtpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  })

  return createAdminSession(admin.id, context)
}

export async function createAdminPasswordReset(username, context = {}) {
  const prisma = getPrismaClient()
  const admin = await getAdminByUsername(username)

  if (!admin) {
    return null
  }

  const token = generateResetToken()
  const tokenHash = hashAdminSecretToken(token)

  await prisma.adminPasswordResetToken.deleteMany({
    where: {
      adminId: admin.id,
      OR: [
        { consumedAt: { not: null } },
        { expiresAt: { lt: new Date() } },
      ],
    },
  })

  await prisma.adminPasswordResetToken.create({
    data: {
      adminId: admin.id,
      tokenHash,
      expiresAt: getExpiryDate(RESET_TTL_MS),
      ipAddress: context.ipAddress || null,
      userAgent: context.userAgent || null,
    },
  })

  return {
    admin,
    token,
    expiresAt: getExpiryDate(RESET_TTL_MS),
  }
}

export async function consumeAdminPasswordResetToken(token, nextPassword) {
  const prisma = getPrismaClient()
  const tokenHash = hashAdminSecretToken(token)

  const resetToken = await prisma.adminPasswordResetToken.findFirst({
    where: {
      tokenHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      admin: true,
    },
  })

  if (!resetToken) {
    return null
  }

  await updateAdminPassword(resetToken.adminId, nextPassword)

  await prisma.adminPasswordResetToken.update({
    where: { id: resetToken.id },
    data: { consumedAt: new Date() },
  })

  await prisma.adminSession.deleteMany({
    where: { adminId: resetToken.adminId },
  })

  await prisma.adminOtpChallenge.deleteMany({
    where: { adminId: resetToken.adminId },
  })

  return resetToken.admin
}
