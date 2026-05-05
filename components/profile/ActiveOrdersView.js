'use client'

import ProfileShell from '@/components/profile/ProfileShell'
import OrdersPanel from '@/components/profile/OrdersPanel'

export default function ActiveOrdersView() {
  return (
    <ProfileShell
      tools={[
        { href: '/profile', label: 'Profile' },
        { href: '/ordered-items', label: 'Delivered items' },
        { href: '/products', label: 'Continue shopping' },
      ]}
      showAccountSummary={false}
    >
      {({ orders, ordersLoading, ordersError }) => (
        <OrdersPanel
          eyebrow="Active Orders"
          title="Track every build in motion"
          subtitle="Follow delivery progress, payment state, and support references for every order that is still moving through fulfilment."
          orders={orders}
          ordersLoading={ordersLoading}
          ordersError={ordersError}
          mode="active"
        />
      )}
    </ProfileShell>
  )
}
