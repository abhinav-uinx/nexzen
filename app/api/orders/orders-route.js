import { getDisplayOrderId } from '@/lib/commerce/orders'
import { getPrismaClient } from '@/lib/database/nexus-db'
import { getAppUserForRequest } from '@/lib/auth/user-session'
import {
  buildEstimatedDelivery,
  buildOrderSupportTicket,
  buildTrackingNumber,
  calculateOrderPricing,
  normalizePaymentMethod,
} from '@/lib/commerce/checkout'
import { normalizeSavedAddresses } from '@/lib/profile/addresses'
import {
  isValidIndianPincode,
  isValidPhoneNumber,
  normalizeText,
} from '@/lib/security/validation'
import { getUserProfileSnapshot, updateUserProfileSnapshot } from '@/lib/profile/persistence'

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
                price: true,
                inStock: true,
                description: true,
                category: {
                  select: {
                    name: true,
                    slug: true,
                  },
                },
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
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        phone: order.phone,
        addressLine1: order.addressLine1,
        addressLine2: order.addressLine2,
        city: order.city,
        state: order.state,
        pincode: order.pincode,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: Number(item.price),
          product: item.product
            ? {
                ...item.product,
                price: Number(item.product.price || 0),
                categoryName: item.product.category?.name || 'Product',
                category: item.product.category?.slug || '',
                blurb: item.product.description || 'Built for hardware teams shipping real projects.',
              }
            : null,
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
      couponCode,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      paymentMethod = 'cod'
    } = body
    const prisma = getPrismaClient()
    const normalizedAddressLine1 = normalizeText(addressLine1, 200)
    const normalizedAddressLine2 = normalizeText(addressLine2, 200)
    const normalizedCity = normalizeText(city, 120)
    const normalizedState = normalizeText(state, 120)
    const normalizedPincode = normalizeText(pincode, 6)
    const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod)

    if (!normalizedAddressLine1 || !normalizedCity || !normalizedState || !normalizedPincode) {
      return Response.json({ error: 'Complete shipping details are required.' }, { status: 400 })
    }

    if (!isValidIndianPincode(normalizedPincode)) {
      return Response.json({ error: 'Invalid pincode.' }, { status: 400 })
    }

    if (body.phone && !isValidPhoneNumber(body.phone)) {
      return Response.json({ error: 'Invalid phone number.' }, { status: 400 })
    }
    const existingUser = await getUserProfileSnapshot(appUser.id)

    const savedAddresses = normalizeSavedAddresses([
      {
        id: `checkout-${Date.now()}`,
        label: normalizedAddressLine2 ? 'Recent checkout address' : 'Primary shipping address',
        addressLine1: normalizedAddressLine1,
        addressLine2: normalizedAddressLine2,
        city: normalizedCity,
        state: normalizedState,
        pincode: normalizedPincode,
        phone: normalizeText(body.phone, 20),
        isDefault: true,
      },
      ...(Array.isArray(existingUser?.savedAddresses) ? existingUser.savedAddresses : []),
    ])

    const pricing = await calculateOrderPricing({
      items,
      couponCode,
      userEmail: appUser.email,
    })

    const order = await prisma.order.create({
      data: {
        userId: appUser.id,
        customerName: appUser.name || '',
        customerEmail: appUser.email,
        status: 'pending',
        total: pricing.total,
        discountAmount: pricing.discountAmount,
        discountPercentage: pricing.discountPercentage,
        appliedCouponCode: pricing.appliedCouponCode,
        
        // Shipping Details
        addressLine1: normalizedAddressLine1,
        addressLine2: normalizedAddressLine2 || null,
        city: normalizedCity,
        state: normalizedState,
        pincode: normalizedPincode,
        phone: normalizeText(body.phone, 20) || null,
        
        // Payment Info
        paymentMethod: normalizedPaymentMethod,
        paymentStatus: normalizedPaymentMethod === 'cod' ? 'PENDING' : 'AWAITING_PAYMENT',
        
        trackingNumber: buildTrackingNumber(),
        courierName: 'Nexzen Express',
        supportTicketId: buildOrderSupportTicket(),
        estimatedDelivery: buildEstimatedDelivery(normalizedPincode),
        lastTrackingUpdate: 'Order confirmed and queued for dispatch.',
        items: {
          create: pricing.items.map((item) => ({
            productId: item.productId,
            customerName: appUser.name || '',
            customerEmail: appUser.email,
            quantity: item.quantity,
            price: item.unitPrice,
            originalPrice: item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    // Sync shipping details back to User profile if they are more complete than what we have.
    // This fulfills the "Save to database if forget to add on profile" requirement.
    await updateUserProfileSnapshot(appUser.id, {
      phone: normalizeText(body.phone, 20) || existingUser?.phone || null,
      addressLine1: normalizedAddressLine1 || existingUser?.addressLine1 || null,
      addressLine2: normalizedAddressLine2 || existingUser?.addressLine2 || null,
      city: normalizedCity || existingUser?.city || null,
      state: normalizedState || existingUser?.state || null,
      pincode: normalizedPincode || existingUser?.pincode || null,
      savedAddresses,
      savedUpiId: normalizeText(body.upiId, 120) || existingUser?.savedUpiId || null,
    }).catch(err => console.error('Failed to sync profile during checkout:', err))

    if (pricing.appliedCouponCode) {
      await prisma.coupon.updateMany({
        where: {
          name: {
            equals: pricing.appliedCouponCode,
            mode: 'insensitive',
          },
        },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      }).catch((err) => console.error('Failed to increment coupon usage:', err))
    }

    // Dispatch emails immediately ONLY for COD. 
    // Online payments (Razorpay/UPI) will send emails AFTER verification in verify/route.js.
    if (normalizedPaymentMethod === 'cod') {
      sendOrderPendingEmail(appUser.email, order.id, pricing.total).catch(console.error)
      sendAdminNewOrderEmail(order.id, appUser.email, pricing.total).catch(console.error)
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
    const { appUser } = await getAppUserForRequest(request)
    if (!appUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const prisma = getPrismaClient()

    const order = await prisma.order.findFirst({
      where: { id, userId: appUser.id },
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

export async function handleUpdateOrder(request, { params }) {
  try {
    const { appUser } = await getAppUserForRequest(request)
    if (!appUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const action = normalizeText(body?.action, 32).toLowerCase()
    const prisma = getPrismaClient()

    const order = await prisma.order.findFirst({
      where: { id, userId: appUser.id },
      include: { items: true },
    })

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    if (action === 'cancel') {
      const currentStatus = `${order.status || ''}`.toLowerCase()
      if (!['pending', 'processing', 'accepted'].includes(currentStatus)) {
        return Response.json({ error: 'This order can no longer be cancelled online.' }, { status: 400 })
      }

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'cancelled',
          lastTrackingUpdate: 'Customer requested cancellation. Our team will confirm the reversal shortly.',
        },
      })

      return Response.json({ ok: true, order: updated })
    }

    if (action === 'return') {
      const currentStatus = `${order.status || ''}`.toLowerCase()
      if (!['delivered', 'completed'].includes(currentStatus)) {
        return Response.json({ error: 'Returns are available only after delivery.' }, { status: 400 })
      }

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'return_requested',
          lastTrackingUpdate: 'Return requested by customer. Support will contact you with pickup details.',
        },
      })

      return Response.json({ ok: true, order: updated })
    }

    return Response.json({ error: 'Unsupported order action.' }, { status: 400 })
  } catch (error) {
    return Response.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
