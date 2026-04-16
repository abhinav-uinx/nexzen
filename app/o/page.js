'use client'

import OrdersPanel from '@/components/profile/OrdersPanel'
import ProfileShell from '@/components/profile/ProfileShell'

const tools = [
  { href: '/products', label: 'Continue shopping' },
  { href: '/cart', label: 'Open cart' },
  { href: '/active-orders', label: 'Active orders' },
  { href: '/ordered-items', label: 'Ordered items' },
]

export default function ActiveOrdersPage() {
  return (
    <ProfileShell tools={tools} showAccountSummary={false}>
      {({ orders, ordersLoading, ordersError }) => (
        <OrdersPanel
          mode="active"
          eyebrow="Active Orders"
          title="In progress and not delivered yet"
          subtitle="Track current shipments, keep an eye on estimated delivery, and use the support ticket whenever you need help."
          orders={orders}
          ordersLoading={ordersLoading}
          ordersError={ordersError}
        />
      )}
    </ProfileShell>
  )
}
