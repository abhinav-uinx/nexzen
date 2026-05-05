import { getPrismaClient } from '@/lib/database/nexus-db'
import { getStockAlertAnalytics } from '@/lib/commerce/stock-alerts'

function startOfToday() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

function sumMoney(rows, key) {
  return rows.reduce((total, row) => total + Number(row?.[key] || 0), 0)
}

export async function getAdminDashboardAnalytics() {
  const prisma = getPrismaClient()
  const today = startOfToday()

  const [
    paidOrders,
    ordersToday,
    pendingOrders,
    topSearchRows,
    recentSearchRows,
    lowStockRows,
    stockAlerts,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
      },
      select: {
        total: true,
      },
    }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    }),
    prisma.order.count({
      where: {
        status: {
          in: ['pending', 'accepted', 'processing'],
        },
      },
    }),
    prisma.searchHistory.findMany({
      orderBy: [
        { searchCount: 'desc' },
        { lastSearchedAt: 'desc' },
      ],
      take: 6,
      select: {
        id: true,
        query: true,
        searchCount: true,
        lastSearchedAt: true,
      },
    }),
    prisma.searchHistory.findMany({
      orderBy: {
        lastSearchedAt: 'desc',
      },
      take: 6,
      select: {
        id: true,
        query: true,
        searchCount: true,
        lastSearchedAt: true,
      },
    }),
    prisma.product.findMany({
      where: {
        trackInventory: true,
        stockQuantity: {
          lte: prisma.product.fields.lowStockThreshold,
        },
      },
      orderBy: {
        stockQuantity: 'asc',
      },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        stockQuantity: true,
        lowStockThreshold: true,
      },
    }),
    getStockAlertAnalytics(6),
  ])

  return {
    revenue: {
      paidTotal: sumMoney(paidOrders, 'total'),
      orderCount: paidOrders.length,
    },
    operations: {
      ordersToday,
      pendingOrders,
      lowStockCount: lowStockRows.length,
    },
    searches: {
      top: topSearchRows,
      recent: recentSearchRows,
    },
    stockAlerts: {
      ...stockAlerts,
      lowStockProducts: lowStockRows,
    },
  }
}
