import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Load .env manually for this node script
const env = fs.readFileSync('.env', 'utf8')
env.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim()
    }
})

const prisma = new PrismaClient()

async function diagnostic() {
  console.log('--- DATABASE DIAGNOSTIC ---')
  try {
    const userCount = await prisma.user.count()
    console.log('Users in DB:', userCount)

    const productCount = await prisma.product.count()
    console.log('Products in DB:', productCount)

    const wishlistCount = await prisma.wishlistItem.count()
    console.log('Wishlist items in DB:', wishlistCount)

    if (wishlistCount > 0) {
        const items = await prisma.wishlistItem.findMany({
            include: {
                user: { select: { email: true } },
                product: { select: { name: true } }
            }
        })
        console.log('Items found:', JSON.stringify(items, null, 2))
    } else {
        console.log('No wishlist items found. This confirms the issue is writing to the DB.')
    }

    // Check if any users have a null authUserId
    const messyUsers = await prisma.user.count({ where: { authUserId: null } })
    console.log('Users missing authUserId:', messyUsers)

  } catch (err) {
    console.error('Diagnostic error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

diagnostic()
