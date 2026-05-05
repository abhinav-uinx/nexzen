import { NextResponse } from 'next/server'
import { getPaginatedProducts, getProductCount } from '@/lib/catalog/products'
import { getAppUserForRequest } from '@/lib/auth/user-session'
import { getPrismaClient } from '@/lib/database/nexus-db'
import { normalizeInteger, normalizeText } from '@/lib/security/validation'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const query = normalizeText(body?.query, 120) || null
    const availability = normalizeText(body?.availability, 32) || null
    const minPrice = normalizeText(body?.minPrice, 16) || null
    const maxPrice = normalizeText(body?.maxPrice, 16) || null
    const page = normalizeInteger(body?.page, { min: 1, max: 50, fallback: 1 })
    const limit = normalizeInteger(body?.limit, { min: 1, max: 40, fallback: 20 })

    const [products, totalItems] = await Promise.all([
      getPaginatedProducts({
        page,
        limit,
        query,
        minPrice,
        maxPrice,
        availability,
      }),
      getProductCount({
        query,
        minPrice,
        maxPrice,
        availability,
      }),
    ])

    let wishlistedIds = []
    try {
      const { appUser } = await getAppUserForRequest(request)
      if (appUser?.id) {
        const prisma = getPrismaClient()
        const items = await prisma.wishlistItem.findMany({
          where: { userId: appUser.id },
          select: { productId: true },
        })
        wishlistedIds = items.map((item) => item.productId)
      }
    } catch (error) {
      console.warn('Could not fetch wishlist for catalog query')
    }

    return NextResponse.json({
      ok: true,
      products,
      totalItems,
      wishlistedIds,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        products: [],
        totalItems: 0,
        wishlistedIds: [],
        error: error instanceof Error ? error.message : 'Could not load catalog results.',
      },
      { status: 500 }
    )
  }
}
