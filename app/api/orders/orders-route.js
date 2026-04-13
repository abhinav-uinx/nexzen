import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { getDisplayOrderId } from '@/lib/commerce/orders'
import { getPrismaClient } from '@/lib/database/nexus-db'
import { getAppUserForRequest } from '@/lib/auth/user-session'
import { syncAuthenticatedUser } from '@/lib/auth/user-auth'

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

import { sendOrderPendingEmail, sendAdminNewOrderEmail } from '@/lib/mail/mailer'

export async function handleCreateOrder(request) {
  try {
    const { appUser } = await getAppUserForRequest(request)

    if (!appUser) {
      return Response.json({ error: 'Sign in to place an order.' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      items, 
      total, 
      discountAmount, 
      discountPercentage, 
      couponCode,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      paymentMethod = 'cod'
    } = body

    const appliedCouponCode = couponCode || null

    if (!items?.length) {
      return Response.json({ error: 'Add at least one item before placing an order.' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    // Enforcement: Check if coupon has been used by this email already
    if (appliedCouponCode) {
      const existingOrderWithCoupon = await prisma.order.findFirst({
        where: {
          customerEmail: appUser.email,
          appliedCouponCode: {
            equals: appliedCouponCode,
            mode: 'insensitive'
          }
        }
      })

      if (existingOrderWithCoupon) {
        return Response.json({ 
          error: `You have already used the coupon code "${appliedCouponCode}" on a previous order. Coupons are limited to one use per email.` 
        }, { status: 400 })
      }
    }

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
        status: 'pending',
        total,
        discountAmount,
        discountPercentage,
        appliedCouponCode,
        
        // Shipping Details
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        
        // Payment Info
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'PENDING' : 'AWAITING_PAYMENT',
        
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
            price: Number(item.price || 0),
            originalPrice: Number(item.price || 0),
          })),
        },
      },
      include: {
        items: true,
      },
    })

    // Sync shipping details back to User profile if they are more complete than what we have.
    // This fulfills the "Save to database if forget to add on profile" requirement.
    await prisma.user.update({
      where: { id: appUser.id },
      data: {
        addressLine1: addressLine1 || undefined,
        addressLine2: addressLine2 || undefined,
        city: city || undefined,
        state: state || undefined,
        pincode: pincode || undefined,
      }
    }).catch(err => console.error('Failed to sync profile during checkout:', err))

    // Dispatch emails immediately ONLY for COD. 
    // Online payments (Razorpay/UPI) will send emails AFTER verification in verify/route.js.
    if (paymentMethod === 'cod') {
      sendOrderPendingEmail(appUser.email, order.id, total).catch(console.error)
      sendAdminNewOrderEmail(order.id, appUser.email, total).catch(console.error)
    }

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

export async function handleGetOrderById(request, { params }) {
  try {
    const { id } = await params
    const prisma = getPrismaClient()

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    return Response.json({
      ok: true,
      order: {
        id: order.id,
        total: Number(order.total),
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        phone: order.phone,
        status: order.status,
      },
    })
  } catch (error) {
    return Response.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}
