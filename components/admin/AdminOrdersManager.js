'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function AdminOrdersManager() {
  const [searchTerm, setSearchTerm] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700">CRM Engine</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Active Orders</h2>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search email, phone, name..."
            className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-full bg-blue-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            Search
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-slate-500 animate-pulse">Loading orders pipeline...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-slate-500">No orders found matching this query.</p>
        ) : (
          orders.map(order => (
            <div key={order.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4 pb-4 border-b border-slate-200">
                <div>
                  <p className="font-heading font-medium text-slate-900">{order.user?.name || 'Guest User'}</p>
                  <p className="text-sm text-slate-600 mt-1">{order.user?.email}</p>
                  {order.phone && <p className="text-sm text-slate-600">{order.phone}</p>}
                  {!order.phone && order.user?.phone && <p className="text-sm text-slate-600">{order.user.phone}</p>}
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium uppercase tracking-widest text-slate-500">Order #{order.id.slice(-6)}</p>
                  <p className={`inline-block mt-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest ${order.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                    {order.status}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {item.product?.imageUrl ? (
                        <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full bg-slate-100" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{item.product?.name}</p>
                      <p className="text-sm text-slate-500">Qty: {item.quantity} × ₹{Number(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <p className="font-heading text-lg font-bold text-slate-900">Total: ₹{Number(order.total)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
