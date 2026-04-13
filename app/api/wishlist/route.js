import { NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/database/nexus-db'
import { getAppUserForRequest } from '@/lib/auth/user-session'
import { mapProduct } from '@/lib/catalog/products'

export async function GET(request) {
  try {
    const { appUser } = await getAppUserForRequest(request)
    if (!appUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const prisma = getPrismaClient()
    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: appUser.id },
      include: {
        product: {
          include: {
            category: true,
            reviews: { select: { rating: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const mappedWishlist = wishlist.map(item => ({
      ...item,
      product: mapProduct(item.product)
    }))

    return NextResponse.json({ ok: true, wishlist: mappedWishlist })
  } catch (error) {
    console.error('[WISHLIST_GET_ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { appUser } = await getAppUserForRequest(request)
    if (!appUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { productId } = await request.json()
    const prisma = getPrismaClient()

    const item = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId: appUser.id,
          productId
        }
      },
      create: {
        userId: appUser.id,
        productId,
        userEmail: appUser.email
      },
      update: {
        userEmail: appUser.email // Ensure email is synchronized if it changed
      }
    })

    return NextResponse.json({ ok: true, item })
  } catch (error) {
    console.error('[WISHLIST_POST_ERROR]', error)
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { appUser } = await getAppUserForRequest(request)
    if (!appUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { productId } = await request.json()
    const prisma = getPrismaClient()

    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId: appUser.id,
          productId
        }
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[WISHLIST_DELETE_ERROR]', error)
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
  }
}
