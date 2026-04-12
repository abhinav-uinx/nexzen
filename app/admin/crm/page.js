import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAdminCookieName, getAdminSession } from '@/lib/admin/auth'
import { getAdminBasePath } from '@/lib/admin/config'
import { prisma } from '@/lib/database/prisma'
import CRMDashboard from '@/components/admin/CRMDashboard'

export const metadata = {
  title: 'CRM Engine | Nexzen Admin',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminCRMPage() {
  const adminBasePath = getAdminBasePath()
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(getAdminCookieName())?.value
  const session = await getAdminSession(sessionToken)

  if (!session) {
    redirect(`${adminBasePath}/login`)
  }

  // Fetch all users with their orders and active cart details
  const rawUsers = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      orders: {
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      cart: {
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  // Simplify the deep payload tree to string/searchable structures
  const users = rawUsers.map(user => {
    // Map order nested items
    const orderItems = user.orders.flatMap(order => 
      order.items.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
        orderStatus: order.status,
        orderId: order.id,
      }))
    )

    // Map cart nested items
    const cartItems = user.cart?.items.map(item => ({
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
    })) || []

    return {
      id: user.id,
      email: user.email,
      name: user.name || 'Anonymous',
      phone: user.phone,
      joinedAt: user.createdAt,
      totalOrders: user.orders.length,
      orderItems,
      cartItems,
      activeCartCount: cartItems.length,
    }
  })

  return <CRMDashboard users={users} />
}
