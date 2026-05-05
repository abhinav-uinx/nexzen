import { getPrismaClient } from '@/lib/database/nexus-db'
import { sendBackInStockEmail } from '@/lib/mail/mailer'
import { normalizeEmail, normalizeText } from '@/lib/security/validation'

function normalizeProductId(value) {
  return normalizeText(value, 64)
}

export async function getStockAlertStatus({ userId, productId }) {
  if (!userId || !productId) {
    return { subscribed: false }
  }

  const prisma = getPrismaClient()
  const existing = await prisma.stockAlert.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    select: {
      id: true,
      isActive: true,
      notifiedAt: true,
    },
  })

  return {
    subscribed: Boolean(existing?.isActive),
    notifiedAt: existing?.notifiedAt || null,
  }
}

export async function subscribeToStockAlert({ userId, productId, email }) {
  const safeProductId = normalizeProductId(productId)
  const safeEmail = normalizeEmail(email)

  if (!userId || !safeProductId || !safeEmail) {
    throw new Error('A valid user and product are required.')
  }

  const prisma = getPrismaClient()
  const product = await prisma.product.findUnique({
    where: { id: safeProductId },
    select: {
      id: true,
      inStock: true,
      stockQuantity: true,
      name: true,
    },
  })

  if (!product) {
    throw new Error('Product not found.')
  }

  if (product.inStock || product.stockQuantity > 0) {
    throw new Error('This product is already in stock.')
  }

  const alert = await prisma.stockAlert.upsert({
    where: {
      userId_productId: {
        userId,
        productId: safeProductId,
      },
    },
    update: {
      email: safeEmail,
      isActive: true,
      notifiedAt: null,
    },
    create: {
      userId,
      productId: safeProductId,
      email: safeEmail,
      isActive: true,
    },
  })

  return alert
}

export async function unsubscribeFromStockAlert({ userId, productId }) {
  const safeProductId = normalizeProductId(productId)
  if (!userId || !safeProductId) {
    return false
  }

  const prisma = getPrismaClient()
  await prisma.stockAlert.updateMany({
    where: {
      userId,
      productId: safeProductId,
    },
    data: {
      isActive: false,
    },
  })

  return true
}

export async function notifyProductBackInStock(productId) {
  const safeProductId = normalizeProductId(productId)
  if (!safeProductId) {
    return { notified: 0 }
  }

  const prisma = getPrismaClient()
  const product = await prisma.product.findUnique({
    where: { id: safeProductId },
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      inStock: true,
      stockQuantity: true,
    },
  })

  if (!product || (!product.inStock && product.stockQuantity <= 0)) {
    return { notified: 0 }
  }

  const alerts = await prisma.stockAlert.findMany({
    where: {
      productId: safeProductId,
      isActive: true,
      notifiedAt: null,
    },
    select: {
      id: true,
      email: true,
    },
  })

  let notified = 0
  for (const alert of alerts) {
    try {
      await sendBackInStockEmail(alert.email, product)
      await prisma.stockAlert.update({
        where: { id: alert.id },
        data: {
          isActive: false,
          notifiedAt: new Date(),
        },
      })
      notified += 1
    } catch (error) {
      console.error('Back in stock email failed', error)
    }
  }

  return { notified }
}

export async function getStockAlertAnalytics(limit = 5) {
  const prisma = getPrismaClient()
  const [activeAlerts, notifiedAlerts, topProducts] = await Promise.all([
    prisma.stockAlert.count({
      where: {
        isActive: true,
      },
    }),
    prisma.stockAlert.count({
      where: {
        notifiedAt: {
          not: null,
        },
      },
    }),
    prisma.stockAlert.groupBy({
      by: ['productId'],
      where: {
        isActive: true,
      },
      _count: {
        productId: true,
      },
      orderBy: {
        _count: {
          productId: 'desc',
        },
      },
      take: limit,
    }),
  ])

  const productIds = topProducts.map((row) => row.productId)
  const products = productIds.length
    ? await prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          stockQuantity: true,
          inStock: true,
        },
      })
    : []

  const productMap = new Map(products.map((product) => [product.id, product]))
  return {
    activeAlerts,
    notifiedAlerts,
    topProducts: topProducts.map((row) => ({
      productId: row.productId,
      watchCount: row._count.productId,
      product: productMap.get(row.productId) || null,
    })),
  }
}
