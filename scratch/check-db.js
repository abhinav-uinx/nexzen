import { getPrismaClient } from '../lib/database/nexus-db.js'

async function checkWishlist() {
  const prisma = getPrismaClient()
  try {
    const counts = await prisma.wishlistItem.count()
    console.log('Total Wishlist Items:', counts)
    
    const users = await prisma.user.count()
    console.log('Total Users:', users)

    if (counts > 0) {
        const items = await prisma.wishlistItem.findMany({
            take: 5,
            include: { user: { select: { email: true } } }
        })
        console.log('Recent items:', JSON.stringify(items, null, 2))
    }
  } catch (e) {
    console.error('Check failed:', e)
  }
}

checkWishlist()
