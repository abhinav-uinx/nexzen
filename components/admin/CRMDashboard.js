'use client'

import { useState, useMemo } from 'react'

export default function CRMDashboard({ users }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users

    const lowerSearch = searchTerm.toLowerCase()

    return users.filter(user => {
      // 1. Check top-level scalar details
      if (user.name.toLowerCase().includes(lowerSearch)) return true
      if (user.email.toLowerCase().includes(lowerSearch)) return true
      if (user.phone && user.phone.includes(lowerSearch)) return true
      if (user.id.toLowerCase().includes(lowerSearch)) return true

      // 2. Check deeply nested order histories
      const orderMatch = user.orderItems.some(item => 
        item.productId.toLowerCase().includes(lowerSearch) ||
        item.productName.toLowerCase().includes(lowerSearch) ||
        item.orderId.toLowerCase().includes(lowerSearch)
      )
      if (orderMatch) return true

      // 3. Check active cart metrics
      const cartMatch = user.cartItems.some(item => 
        item.productId.toLowerCase().includes(lowerSearch) ||
        item.productName.toLowerCase().includes(lowerSearch)
      )
      if (cartMatch) return true

      return false
    })
  }, [users, searchTerm])

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Block */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="flex flex-col flex-wrap gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-blue-700">CRM Engine</p>
              <h1 className="mt-3 font-heading text-4xl font-semibold text-slate-950">Customer Directory</h1>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Rapidly scan and filter through customer profiles. Search instantly by names, emails, native internal user IDs, or seamlessly locate any specific product IDs / names present in their active Carts and Order footprints.
          </p>

          {/* Master Search Input */}
          <div className="mt-6">
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Search by name, email, product ID, product name, or Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-900 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-2xl"
            />
          </div>
        </div>

        {/* Dynamic Customers List Array */}
        <div className="grid gap-6">
          {filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="font-heading text-xl text-slate-950">No matches found.</p>
              <p className="mt-2 text-slate-500">Try broadening your search term or using a sub-string.</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div key={user.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-5">
                  <div>
                    <h2 className="font-heading text-2xl font-semibold text-slate-950">{user.name}</h2>
                    <p className="mt-1 text-sm font-medium text-blue-700">{user.email}</p>
                    {user.phone && <p className="mt-1 text-sm text-slate-500 font-mono">Phone: {user.phone}</p>}
                    <p className="mt-2 text-xs text-slate-400 font-mono">ID: {user.id}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 sm:flex-col sm:items-end">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Orders: {user.totalOrders}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
                      Active Cart Focus: {user.activeCartCount} items
                    </span>
                  </div>
                </div>

                {/* Sub-context blocks for CRM deep data visualization */}
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  
                  {/* Order History Payload Snapshot */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-semibold">Verified Orders Traces</h3>
                    {user.orderItems.length === 0 ? (
                      <p className="text-sm text-slate-400">No resolved purchases tracked.</p>
                    ) : (
                      <ul className="space-y-3">
                        {user.orders.slice(0, 8).map((order) => (
                          <li key={order.id} className="flex flex-col gap-2 rounded-xl bg-white px-4 py-3 text-sm shadow-sm border border-slate-100">
                             <div className="flex items-center gap-2">
                               <span className="font-bold text-slate-800 font-mono text-[10px]">ID: {order.id.slice(-8)}</span>
                               <span className={`uppercase text-[0.65rem] font-bold tracking-widest px-2 py-0.5 rounded ${order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                 {order.paymentStatus || 'PENDING'}
                               </span>
                               <span className="uppercase text-[0.65rem] font-bold tracking-widest bg-slate-100 px-2 py-0.5 rounded text-slate-600">{order.status}</span>
                             </div>
                            
                            <div className="flex items-end justify-between">
                              <div>
                                {order.discountPercentage > 0 && (
                                  <p className="text-[10px] font-bold text-emerald-600 mb-1">
                                    Saved {order.discountPercentage}% {order.couponCode ? `with ${order.couponCode}` : ''}
                                  </p>
                                )}
                                <p className="text-slate-900 font-bold text-lg">₹{order.total.toFixed(2)}</p>
                                {order.discountAmount > 0 && (
                                  <p className="text-[10px] text-slate-400 line-through">₹{(order.total + order.discountAmount).toFixed(2)}</p>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                          </li>
                        ))}
                        {user.orders.length > 8 && (
                          <p className="text-xs text-slate-400 text-center pt-1">+ {user.orders.length - 8} more orders</p>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* Active Cart Snapshot Focus */}
                  <div className="rounded-xl border border-slate-100 bg-blue-50/30 p-4">
                    <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-semibold">Active Cart Retention</h3>
                    {user.cartItems.length === 0 ? (
                      <p className="text-sm text-slate-400">Cart is empty.</p>
                    ) : (
                      <ul className="space-y-2">
                        {user.cartItems.slice(0, 5).map((item, idx) => (
                          <li key={idx} className="flex flex-col gap-1 rounded bg-white px-3 py-2 text-sm shadow-sm border border-slate-100">
                            <span className="font-medium text-slate-800 line-clamp-1">{item.productName}</span>
                            <span className="text-xs text-slate-500 font-mono">Qty: {item.quantity}</span>
                            <span className="text-[0.65rem] text-slate-400 truncate">PRD: {item.productId}</span>
                          </li>
                        ))}
                        {user.cartItems.length > 5 && (
                          <p className="text-xs text-slate-400 text-center pt-1">+ {user.cartItems.length - 5} more items</p>
                        )}
                      </ul>
                    )}
                  </div>

                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
