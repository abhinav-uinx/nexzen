'use client'

import OrdersPanel from '@/components/profile/OrdersPanel'
import ProfileShell from '@/components/profile/ProfileShell'

const tools = [
  { href: '/products', label: 'Continue shopping' },
  { href: '/cart', label: 'Open cart' },
  { href: '/active-orders', label: 'Active orders' },
  { href: '/ordered-items', label: 'Ordered items' },
]

export default function OrderedItemsPage() {
  return (
    <ProfileShell tools={tools} showAccountSummary={false}>
      {({ orders, ordersLoading, ordersError }) => (
        <OrdersPanel
          mode="delivered"
          eyebrow="Ordered Items"
          title="Delivered orders and purchase history"
          subtitle="Use this page to review completed purchases, reopen product pages, and keep a clean history of delivered items."
          orders={orders}
          ordersLoading={ordersLoading}
          ordersError={ordersError}
        />
      )}
    </ProfileShell>
  )
}
