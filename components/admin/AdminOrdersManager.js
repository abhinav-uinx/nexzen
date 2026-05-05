'use client'

import { useState, useEffect, useMemo } from 'react'
import { withAdminHeaders } from '@/lib/admin/client'
import AdminAuditLogPanel from '@/components/admin/AdminAuditLogPanel'

export default function AdminOrdersManager() {
  const [searchTerm, setSearchTerm] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedEmail, setExpandedEmail] = useState(null)
  const [actionLoading, setActionLoading] = useState(null) // ID of item being updated

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async (query = '') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (res.ok) {
        setOrders(data.orders || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchOrders(searchTerm)
  }

  // Grouping logic: Unique Users with their combined orders
  const groupedUsers = useMemo(() => {
    const map = {}
    orders.forEach(order => {
      const email = order.user?.email || 'guest'
      if (!map[email]) {
        map[email] = {
          user: order.user,
          orders: [],
          totalPending: 0
        }
      }
      map[email].orders.push(order)
      const pendingInOrder = order.items.filter(i => i.status === 'pending').length
      map[email].totalPending += pendingInOrder
    })
    return Object.values(map).sort((a, b) => b.totalPending - a.totalPending)
  }, [orders])

  const updateItemStatus = async (itemId, orderId, newStatus) => {
    setActionLoading(itemId)
    try {
      const res = await fetch(`/api/admin/order-items/${itemId}`, {
        method: 'PATCH',
        headers: withAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        // Refresh local state
        const { item: updatedItem } = await res.json()
        setOrders(orders.map(o => {
          if (o.id === orderId) {
            return {
              ...o,
              items: o.items.map(i => i.id === itemId ? updatedItem : i),
              status: updatedItem.order.status // Sync aggregated order status
            }
          }
          return o
        }))
      }
    } catch (e) {
      console.error('Failed to update item status', e)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkAccept = async (orderId) => {
    setActionLoading(`blk-${orderId}`)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/bulk-action`, {
        method: 'POST',
        headers: withAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'accept_all' }),
      })
      if (res.ok) {
        const { order: updatedOrder } = await res.json()
        setOrders(orders.map(o => o.id === orderId ? updatedOrder : o))
      }
    } catch (e) {
      console.error('Bulk action failed', e)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUserBulkAccept = async (email) => {
    const confirmAll = window.confirm(`This will accept EVERY pending product for ${email} across all their orders. Continue?`)
    if (!confirmAll) return

    setActionLoading(`user-${email}`)
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}/bulk-accept`, {
        method: 'POST',
        headers: withAdminHeaders(),
      })
      if (res.ok) {
        // Simple strategy: Just refetch all orders to get the new statuses
        fetchOrders(searchTerm)
      }
    } catch (e) {
      console.error('User bulk accept failed', e)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-slate-950">Active Orders Pipeline</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">User-Centric Resolution Stream</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            suppressHydrationWarning
            type="text"
            placeholder="Search email, user, product..."
            className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            suppressHydrationWarning
            type="submit"
            className="rounded-full bg-blue-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            Search
          </button>
        </form>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <p className="text-sm text-slate-500 animate-pulse">Scanning users with pending orders...</p>
        ) : groupedUsers.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="font-heading text-xl text-slate-400">All clear! No pending orders.</p>
          </div>
        ) : (
          groupedUsers.map(group => {
            const isExpanded = expandedEmail === (group.user?.email || 'guest')
            return (
              <div 
                key={group.user?.email || 'guest'} 
                className={`rounded-[2rem] border transition-all duration-300 ${isExpanded ? 'border-blue-200 bg-blue-50/20 ring-1 ring-blue-100' : 'border-slate-100 bg-white hover:border-slate-300'}`}
              >
                {/* User Header Section */}
                <div 
                  onClick={() => setExpandedEmail(isExpanded ? null : (group.user?.email || 'guest'))}
                  className="flex flex-wrap items-center justify-between cursor-pointer p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-heading font-bold">
                      {(group.user?.name || 'G')[0]}
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-slate-950">{group.user?.name || 'Guest User'}</h3>
                      <p className="text-sm text-slate-500">{group.user?.email || 'No email associated'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-widest font-bold text-slate-400">Action Items</p>
                      <p className={`text-xl font-heading font-bold ${group.totalPending > 0 ? 'text-blue-700' : 'text-slate-300'}`}>
                        {group.totalPending} Pending
                      </p>
                    </div>

                    {group.totalPending > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserBulkAccept(group.user?.email);
                        }}
                        disabled={actionLoading === `user-${group.user?.email}`}
                        className="hidden sm:block rounded-full bg-slate-900 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-slate-800 hover:scale-105 active:scale-95 disabled:opacity-30 shadow-lg"
                      >
                        {actionLoading === `user-${group.user?.email}` ? 'Processing...' : `Accept All Products`}
                      </button>
                    )}

                    <div className={`h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180 bg-white' : ''}`}>
                      <span className="text-xs">▼</span>
                    </div>
                  </div>
                </div>                {/* Consolidated Table of Orders */}
                {isExpanded && (
                  <div className="overflow-x-auto px-6 pb-6">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          <th className="py-3 px-2">Order Tracking</th>
                          <th className="py-3 px-2">Payment Context</th>
                          <th className="py-3 px-2">Items Detail</th>
                          <th className="py-3 px-2 text-right">Revenue</th>
                          <th className="py-3 px-2 text-right">Resolutions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {group.orders.map(order => (
                          <tr key={order.id} className="group/row transition-colors hover:bg-slate-50/50">
                            <td className="py-4 px-2 align-top">
                              <p className="font-mono text-[11px] font-bold text-slate-900">#{order.id.slice(-8)}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                              <div className="mt-2 text-[10px] text-slate-500 italic leading-relaxed max-w-[150px]">
                                {order.addressLine1}, {order.city}
                              </div>
                            </td>

                            <td className="py-4 px-2 align-top">
                              <div className="flex flex-col gap-1.5 items-start">
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {order.paymentStatus}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                  {order.paymentMethod === 'cod' ? 'Cash / COD' : order.paymentMethod?.toUpperCase()}
                                </span>
                                {order.razorpayPaymentId && (
                                  <span className="font-mono text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                    {order.razorpayPaymentId}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-2 align-top">
                              <div className="space-y-2">
                                {order.items.map(item => (
                                  <div key={item.id} className="flex items-center gap-3">
                                    <div className={`h-2 w-2 rounded-full ${item.status === 'accepted' ? 'bg-emerald-500' : item.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                    <p className="text-xs font-medium text-slate-800 line-clamp-1">
                                      <span className="font-bold text-blue-700">{item.quantity}×</span> {item.product?.name}
                                    </p>
                                    <div className="ml-auto flex gap-1">
                                      <button
                                        onClick={() => updateItemStatus(item.id, order.id, 'accepted')}
                                        disabled={item.status === 'accepted'}
                                        className="h-5 w-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-0"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={() => updateItemStatus(item.id, order.id, 'rejected')}
                                        disabled={item.status === 'rejected'}
                                        className="h-5 w-5 rounded bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all disabled:opacity-0"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>

                            <td className="py-4 px-2 text-right align-top">
                              <p className="font-heading text-sm font-bold text-slate-900">₹{Number(order.total).toFixed(2)}</p>
                              {order.discountAmount > 0 && <p className="text-[9px] text-emerald-600 font-bold">-₹{Number(order.discountAmount).toFixed(2)}</p>}
                            </td>

                            <td className="py-4 px-2 text-right align-top">
                              <button
                                onClick={() => handleBulkAccept(order.id)}
                                disabled={actionLoading === `blk-${order.id}`}
                                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-30"
                              >
                                {actionLoading === `blk-${order.id}` ? '...' : 'Quick Accept'}
                              </button>
                              <p className="mt-2 text-[9px] uppercase tracking-widest font-bold text-slate-300">
                                {order.status}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="mt-8">
        <AdminAuditLogPanel />
      </div>
    </div>
  )
}
