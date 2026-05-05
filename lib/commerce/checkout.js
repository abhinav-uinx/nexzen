import { getPrismaClient } from '@/lib/database/nexus-db'
import { normalizeDecimal, normalizeInteger, normalizeText } from '@/lib/security/validation'

const ALLOWED_PAYMENT_METHODS = new Set(['cod', 'razorpay', 'upi'])

export function buildOrderSupportTicket() {
  return `TKT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export function buildTrackingNumber() {
  return `NXZ-${Date.now().toString().slice(-8)}`
}

export function buildEstimatedDelivery(pincode) {
  const estimate = new Date()
  const normalizedPincode = normalizeText(pincode, 6)
  const leadDays =
    normalizedPincode.startsWith('56') || normalizedPincode.startsWith('11')
      ? 2
      : normalizedPincode.startsWith('40') || normalizedPincode.startsWith('60')
        ? 3
        : 5

  estimate.setDate(estimate.getDate() + leadDays)
  return estimate
}

export async function calculateOrderPricing({ items, couponCode, userEmail }) {
  const prisma = getPrismaClient()
  const normalizedItems = Array.isArray(items)
    ? items
        .map((item) => ({
          id: normalizeText(item?.id, 64),
          quantity: normalizeInteger(item?.quantity, { min: 1, max: 25, fallback: 1 }),
        }))
        .filter((item) => item.id)
    : []

  if (normalizedItems.length === 0) {
    throw new Error('Add at least one item before placing an order.')
  }

  const uniqueIds = [...new Set(normalizedItems.map((item) => item.id))]
  const products = await prisma.product.findMany({
    where: {
      id: { in: uniqueIds },
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      price: true,
      stockQuantity: true,
      trackInventory: true,
      inStock: true,
    },
  })

  if (products.length !== uniqueIds.length) {
    throw new Error('One or more items in your cart are no longer available.')
  }

  const productMap = new Map(products.map((product) => [product.id, product]))
  const orderItems = normalizedItems.map((item) => {
    const product = productMap.get(item.id)

    if (!product || !product.inStock) {
      throw new Error('One or more items are out of stock.')
    }

    if (product.trackInventory && item.quantity > product.stockQuantity) {
      throw new Error(`Only ${product.stockQuantity} units are available for ${product.name}.`)
    }

    const unitPrice = normalizeDecimal(product.price, { min: 0, fallback: 0 })

    return {
      productId: product.id,
      quantity: item.quantity,
      unitPrice,
      totalPrice: normalizeDecimal(unitPrice * item.quantity, { min: 0, fallback: 0 }),
    }
  })

  const subtotal = normalizeDecimal(
    orderItems.reduce((sum, item) => sum + item.totalPrice, 0),
    { min: 0, fallback: 0 }
  )

  let coupon = null
  let discountPercentage = 0
  let discountAmount = 0

  if (couponCode) {
    coupon = await prisma.coupon.findFirst({
      where: {
        name: {
          equals: normalizeText(couponCode, 64).toUpperCase(),
          mode: 'insensitive',
        },
        isActive: true,
      },
      select: {
        name: true,
        discountPercent: true,
        minOrderValue: true,
        maxUses: true,
        usageCount: true,
        expiresAt: true,
        categorySlug: true,
      },
    })

    if (!coupon) {
      throw new Error('Invalid coupon code.')
    }

    if (userEmail) {
      const existingOrder = await prisma.order.findFirst({
        where: {
          customerEmail: userEmail,
          appliedCouponCode: {
            equals: coupon.name,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })

      if (existingOrder) {
        throw new Error(`You have already used the coupon code "${coupon.name}".`)
      }
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new Error(`The coupon code "${coupon.name}" has expired.`)
    }

    const minimumOrderValue = coupon.minOrderValue ? normalizeDecimal(coupon.minOrderValue, { min: 0, fallback: 0 }) : 0
    if (minimumOrderValue > 0 && subtotal < minimumOrderValue) {
      throw new Error(`Add items worth Rs. ${minimumOrderValue.toLocaleString('en-IN')} to use this coupon.`)
    }

    if (coupon.maxUses && coupon.usageCount >= coupon.maxUses) {
      throw new Error(`The coupon code "${coupon.name}" has reached its usage limit.`)
    }

    if (coupon.categorySlug) {
      const eligibleProductIds = await prisma.product.findMany({
        where: {
          id: { in: uniqueIds },
          category: { slug: coupon.categorySlug },
        },
        select: { id: true },
      })

      const eligibleIds = new Set(eligibleProductIds.map((product) => product.id))
      const eligibleSubtotal = orderItems.reduce((sum, item) => {
        if (!eligibleIds.has(item.productId)) {
          return sum
        }

        return sum + item.totalPrice
      }, 0)

      if (eligibleSubtotal <= 0) {
        throw new Error(`This coupon applies only to ${coupon.categorySlug.replace(/-/g, ' ')} products.`)
      }

      discountPercentage = normalizeInteger(coupon.discountPercent, { min: 0, max: 90, fallback: 0 })
      discountAmount = normalizeDecimal(eligibleSubtotal * (discountPercentage / 100), { min: 0, fallback: 0 })
    } else {
      discountPercentage = normalizeInteger(coupon.discountPercent, { min: 0, max: 90, fallback: 0 })
      discountAmount = normalizeDecimal(subtotal * (discountPercentage / 100), { min: 0, fallback: 0 })
    }
  }

  return {
    appliedCouponCode: coupon?.name || null,
    discountAmount,
    discountPercentage,
    items: orderItems,
    subtotal,
    total: normalizeDecimal(subtotal - discountAmount, { min: 0, fallback: 0 }),
  }
}

export function normalizePaymentMethod(value) {
  const paymentMethod = `${value || ''}`.trim().toLowerCase()
  return ALLOWED_PAYMENT_METHODS.has(paymentMethod) ? paymentMethod : 'cod'
}
