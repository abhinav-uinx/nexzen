'use client'

import ProfileShell from '@/components/profile/ProfileShell'
import OrdersPanel from '@/components/profile/OrdersPanel'

export default function OrderedItemsView() {
  return (
    <ProfileShell
      tools={[
        { href: '/profile', label: 'Profile' },
        { href: '/active-orders', label: 'Active orders' },
        { href: '/products', label: 'Continue shopping' },
      ]}
      showAccountSummary={false}
    >
      {({ orders, ordersLoading, ordersError }) => (
        <OrdersPanel
          eyebrow="Delivered Orders"
          title="Everything you have already received"
          subtitle="Review completed purchases, reorder components, and start return requests on delivered items when needed."
          orders={orders}
          ordersLoading={ordersLoading}
          ordersError={ordersError}
          mode="delivered"
        />
      )}
    </ProfileShell>
  )
}
