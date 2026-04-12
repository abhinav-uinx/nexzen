import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { getDisplayOrderId } from '@/lib/commerce/orders'
import { getPrismaClient } from '@/lib/database/prisma'
import { syncAuthenticatedUser } from '@/lib/auth/user-auth'

function getBearerToken(request) {
  const authorization = request.headers.get('authorization') || ''

  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return null
  }

  return authorization.slice(7).trim()
}

async function getAppUserForRequest(request) {
  const accessToken = getBearerToken(request)

  if (!accessToken) {
    return { accessToken: null, appUser: null }
  }

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken)

  if (error || !user) {
    return { accessToken, appUser: null }
  }

  const appUser = await syncAuthenticatedUser({
    user,
    accessToken,
    provider: user.app_metadata?.provider,
    expiresAt: null,
  })

  return { accessToken, appUser }
}

function buildOrderSupportTicket() {
  return `TKT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function buildTrackingNumber() {
  return `NXZ-${Date.now().toString().slice(-8)}`
}

function buildEstimatedDelivery() {
  const estimate = new Date()
  estimate.setDate(estimate.getDate() + 5)
  return estimate
}

export async function handleGetOrders(request) {
  try {
    const { appUser } = await getAppUserForRequest(request)

    if (!appUser) {
      return Response.json({ error: 'Sign in to view your orders.' }, { status: 401 })
    }

    const prisma = getPrismaClient()
    const orders = await prisma.order.findMany({
      where: {
        userId: appUser.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return Response.json({
      ok: true,
      orders: orders.map((order) => ({
        id: order.id,
        displayId: getDisplayOrderId(order),
        status: order.status,
        total: Number(order.total),
        trackingNumber: order.trackingNumber,
        courierName: order.courierName,
        supportTicketId: order.supportTicketId,
        estimatedDelivery: order.estimatedDelivery,
        deliveredAt: order.deliveredAt,
        lastTrackingUpdate: order.lastTrackingUpdate,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: Number(item.price),
          product: item.product,
        })),
      })),
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Could not load orders.',
      },
      { status: 500 }
    )
  }
}

export async function handleCreateOrder(request) {
  try {
    const { appUser } = await getAppUserForRequest(request)

    if (!appUser) {
      return Response.json({ error: 'Sign in to place an order.' }, { status: 401 })
    }

    const body = await request.json()
    const items = Array.isArray(body?.items) ? body.items : []
    const total = Number(body?.total || 0)

    if (!items.length) {
      return Response.json({ error: 'Add at least one item before placing an order.' }, { status: 400 })
    }

    const prisma = getPrismaClient()
    const productIds = items.map((item) => item.id).filter(Boolean)
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        price: true,
      },
    })

    const priceMap = new Map(products.map((product) => [product.id, Number(product.price)]))

    const order = await prisma.order.create({
      data: {
        userId: appUser.id,
        customerName: appUser.name || '',
        customerEmail: appUser.email,
        status: 'processing',
        total,
        trackingNumber: buildTrackingNumber(),
        courierName: 'Nexzen Express',
        supportTicketId: buildOrderSupportTicket(),
        estimatedDelivery: buildEstimatedDelivery(),
        lastTrackingUpdate: 'Order confirmed and queued for dispatch.',
        items: {
          create: items.map((item) => ({
            productId: item.id,
            customerName: appUser.name || '',
            customerEmail: appUser.email,
            quantity: Number(item.quantity || 1),
            price: priceMap.get(item.id) ?? Number(item.price || 0),
          })),
        },
      },
      include: {
        items: true,
      },
    })

    return Response.json({
      ok: true,
      order: {
        id: order.id,
        displayId: getDisplayOrderId(order),
        status: order.status,
        total: Number(order.total),
        trackingNumber: order.trackingNumber,
        courierName: order.courierName,
        supportTicketId: order.supportTicketId,
        itemCount: order.items.length,
      },
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Could not place order.',
      },
      { status: 500 }
    )
  }
}
