import crypto from 'node:crypto'
import { getPrismaClient } from '@/lib/database/nexus-db'

const ADMIN_COOKIE = 'nexzen_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7

function getSecret() {
  return process.env.ADMIN_AUTH_SECRET || 'nexzen-dev-secret'
}

function getBootstrapCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'changeme123',
  }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hashed = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hashed}`
}

function verifyPassword(password, storedPassword) {
  const [salt, storedHash] = `${storedPassword || ''}`.split(':')

  if (!salt || !storedHash) {
    return false
  }

  const candidateHash = crypto.scryptSync(password, salt, 64)
  const storedBuffer = Buffer.from(storedHash, 'hex')

  if (storedBuffer.length !== candidateHash.length) {
    return false
  }

  return crypto.timingSafeEqual(storedBuffer, candidateHash)
}

function isLegacyPlaintextPassword(storedPassword) {
  return `${storedPassword || ''}`.includes(':') === false
}

function hashSessionToken(token) {
  return crypto.createHash('sha256').update(`${token}:${getSecret()}`).digest('hex')
}

export function getAdminCookieName() {
  return ADMIN_COOKIE
}

export function getAdminSessionMaxAge() {
  return SESSION_MAX_AGE
}

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`
}

export async function ensureBootstrapAdmin() {
  const prisma = getPrismaClient()
  const rows = await prisma.$queryRaw`
    SELECT "id", "username", "password"
    FROM "admins"
    WHERE "username" = ${getBootstrapCredentials().username}
    LIMIT 1
  `

  if (Array.isArray(rows) && rows.length > 0) {
    return
  }

  const creds = getBootstrapCredentials()

  await prisma.$executeRaw`
    INSERT INTO "admins" ("id", "username", "password", "createdAt", "updatedAt")
    VALUES (${createId('admin')}, ${creds.username}, ${hashPassword(creds.password)}, NOW(), NOW())
  `
}

export async function authenticateAdmin(username, password) {
  const prisma = getPrismaClient()
  await ensureBootstrapAdmin()

  const rows = await prisma.$queryRaw`
    SELECT "id", "username", "password"
    FROM "admins"
    WHERE "username" = ${username}
    LIMIT 1
  `
  const admin = Array.isArray(rows) ? rows[0] : null

  if (!admin) {
    return null
  }

  if (isLegacyPlaintextPassword(admin.password)) {
    if (admin.password !== password) {
      return null
    }

    const upgradedPassword = hashPassword(password)

    await prisma.$executeRaw`
      UPDATE "admins"
      SET "password" = ${upgradedPassword}, "updatedAt" = NOW()
      WHERE "id" = ${admin.id}
    `

    return {
      ...admin,
      password: upgradedPassword,
    }
  }

  if (!verifyPassword(password, admin.password)) {
    return null
  }

  return admin
}

export async function createAdminSession(adminId, context = {}) {
  const prisma = getPrismaClient()
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)
  const sessionId = createId('admin_session')

  await prisma.$executeRaw`
    INSERT INTO "admin_sessions" ("id", "adminId", "tokenHash", "ipAddress", "userAgent", "expiresAt", "createdAt", "updatedAt")
    VALUES (
      ${sessionId},
      ${adminId},
      ${hashSessionToken(token)},
      ${context.ipAddress || null},
      ${context.userAgent || null},
      ${expiresAt},
      NOW(),
      NOW()
    )
  `

  return {
    token,
    session: {
      id: sessionId,
      adminId,
      expiresAt,
    },
  }
}

export async function getAdminSession(token) {
  const prisma = getPrismaClient()
  if (!token) {
    return null
  }

  const rows = await prisma.$queryRaw`
    SELECT
      s."id",
      s."adminId",
      s."tokenHash",
      s."ipAddress",
      s."userAgent",
      s."expiresAt",
      s."createdAt",
      s."updatedAt",
      a."username" AS "adminUsername"
    FROM "admin_sessions" s
    INNER JOIN "admins" a ON a."id" = s."adminId"
    WHERE s."tokenHash" = ${hashSessionToken(token)}
    LIMIT 1
  `
  const session = Array.isArray(rows) ? rows[0] : null

  if (!session) {
    return null
  }

  if (session.expiresAt <= new Date()) {
    await prisma.$executeRaw`
      DELETE FROM "admin_sessions"
      WHERE "id" = ${session.id}
    `

    return null
  }

  return {
    ...session,
    admin: {
      id: session.adminId,
      username: session.adminUsername,
    },
  }
}

export async function deleteAdminSession(token) {
  const prisma = getPrismaClient()
  if (!token) {
    return
  }

  await prisma.$executeRaw`
    DELETE FROM "admin_sessions"
    WHERE "tokenHash" = ${hashSessionToken(token)}
  `
}

