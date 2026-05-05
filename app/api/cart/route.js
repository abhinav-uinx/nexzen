import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/nexus-db'
import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { syncAuthenticatedUser } from '@/lib/auth/user-auth'
import { normalizeInteger, normalizeText } from '@/lib/security/validation'

function getBearerToken(request) {
  const authorization = request.headers.get('authorization') || ''
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return null
  }
  return authorization.slice(7).trim()
}

async function getAppUserForRequest(request) {
  const accessToken = getBearerToken(request)
  if (!accessToken) return null

  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  
  if (error || !user) return null

  // Ensure security: verify IP / UserAgent hasn't drifted via sync
  const rawIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const ipAddress = rawIp.split(',')[0].trim()
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    const appUser = await syncAuthenticatedUser({
      user,
      accessToken,
      provider: user.app_metadata?.provider,
      expiresAt: null,
      ipAddress,
      userAgent
    })
    return appUser
  } catch(e) {
    console.error('Session security validation failed in cart:', e.message)
    return null
  }
}

export async function GET(request) {
  try {
    const dbUser = await getAppUserForRequest(request)
    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let cart = await prisma.cart.findUnique({
      where: { userId: dbUser.id },
      include: {
        items: {
          include: { product: true }
        }
      }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: dbUser.id,
          userName: dbUser.name || '',
          userEmail: dbUser.email,
        },
        include: {
          items: {
            include: { product: true }
          }
        }
      })
    }

    const formattedItems = cart.items.map(item => ({
      ...item.product,
      quantity: item.quantity
    }))

    return NextResponse.json({ cartItems: formattedItems })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const dbUser = await getAppUserForRequest(request)
    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cartItems } = await request.json()

    if (!Array.isArray(cartItems)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const normalizedItems = cartItems
      .map((item) => ({
        productId: normalizeText(item?.id, 64),
        quantity: normalizeInteger(item?.quantity, { min: 1, max: 25, fallback: 1 }),
      }))
      .filter((item) => item.productId)

    const productIds = [...new Set(normalizedItems.map((item) => item.productId))]
    const validProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: { id: true },
    })
    const validIds = new Set(validProducts.map((product) => product.id))

    let cart = await prisma.cart.findUnique({
      where: { userId: dbUser.id }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: dbUser.id,
          userName: dbUser.name || '',
          userEmail: dbUser.email,
        },
      })
    }

    // Wipe and replace strategy for simple synchronization
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    })

    if (cartItems.length > 0) {
      await prisma.cartItem.createMany({
        data: normalizedItems
          .filter((item) => validIds.has(item.productId))
          .map(item => ({
          cartId: cart.id,
          productId: item.productId,
          quantity: item.quantity,
          userName: dbUser.name || '',
          userEmail: dbUser.email,
        }))
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error syncing cart:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
