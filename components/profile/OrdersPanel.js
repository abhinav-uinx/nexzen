'use client'

import Link from 'next/link'
import { useState } from 'react'
import { formatOrderDate, getDisplayOrderId, isDeliveredOrder } from '@/lib/commerce/orders'
import { useAuth } from '@/providers/AuthProvider'
import LoadingPanel from '@/components/ui/LoadingPanel'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const TIMELINE = ['pending', 'processing', 'shipped', 'delivered']

function getTimelineState(order) {
  const normalized = `${order?.status || ''}`.toLowerCase()
  if (normalized === 'cancelled') {
    return ['pending']
  }

  if (normalized === 'return_requested') {
    return ['pending', 'processing', 'shipped', 'delivered']
  }

  const currentIndex = TIMELINE.indexOf(normalized)
  if (currentIndex === -1) {
    return ['pending', 'processing']
  }

  return TIMELINE.slice(0, currentIndex + 1)
}

function EmptyOrders({ mode }) {
  const isActive = mode === 'active'

  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
      <h2 className="font-heading text-2xl font-semibold text-slate-950">
        {isActive ? 'No active orders right now' : 'No delivered items yet'}
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        {isActive
          ? 'Once an order is placed and still in progress, it will appear here with delivery and support details.'
          : 'Delivered items will move here automatically after the order status becomes delivered.'}
      </p>
      <Link
        href="/products"
        className="interactive-button mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 hover:shadow-[0_16px_36px_rgba(37,99,235,0.24)]"
      >
        Continue shopping
      </Link>
    </div>
  )
}

export default function OrdersPanel({
  eyebrow,
  title,
  subtitle,
  orders = [],
  ordersLoading,
  ordersError,
  mode = 'active',
}) {
  const { session } = useAuth()
  const [actionLoading, setActionLoading] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const filteredOrders = orders.filter((order) =>
    mode === 'delivered' ? isDeliveredOrder(order) : !isDeliveredOrder(order)
  )

  async function runOrderAction(orderId, action) {
    setActionLoading(`${orderId}:${action}`)
    setActionError('')
    setActionMessage('')
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ action }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || 'Could not update this order.')
      }

      setActionMessage(action === 'cancel' ? 'Cancellation request submitted.' : 'Return request submitted.')
      window.location.reload()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update this order.')
    } finally {
      setActionLoading('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-10">
        <p className="text-sm uppercase tracking-[0.24em] text-blue-700">{eyebrow}</p>
        <h2 className="mt-3 font-heading text-4xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{subtitle}</p>
      </div>

      {ordersLoading ? (
        <LoadingPanel
          eyebrow="Orders"
          title="Fetching your saved orders"
          description="We are assembling your latest order states, delivery milestones, and item details."
          compact
        />
      ) : ordersError ? (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-rose-700 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
          <p className="text-sm uppercase tracking-[0.24em] text-rose-600">Orders</p>
          <h3 className="mt-3 font-heading text-2xl font-semibold text-rose-950">Could not load this order view</h3>
          <p className="mt-3 text-sm leading-7">{ordersError}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyOrders mode={mode} />
      ) : (
        filteredOrders.map((order) => (
          <article
            key={order.id}
            className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)]"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-heading text-xl font-bold text-slate-950">
                    {order.displayId || getDisplayOrderId(order)}
                  </h3>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      {order.status || (mode === 'delivered' ? 'delivered' : 'processing')}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 border border-blue-100/50">
                      {mode === 'delivered' ? 'Completed' : 'In progress'}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-slate-400 font-medium">Order Identification Signature</p>
              </div>
            </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Placed on</p>
                  <p className="mt-1 text-xs font-semibold text-slate-950">{formatOrderDate(order.createdAt)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Total Amount</p>
                  <p className="mt-1 text-xs font-bold text-slate-950">
                    Rs. {Number(order.total || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                {mode === 'delivered' ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3 sm:col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">Delivered At</p>
                    <p className="mt-1 text-xs font-bold text-emerald-950">
                      {formatOrderDate(order.deliveredAt || order.createdAt)}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Tracking</p>
                      <p className="mt-1 text-xs font-semibold text-slate-950 truncate" title={order.trackingNumber}>{order.trackingNumber || 'Pending'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Delivery Partner</p>
                      <p className="mt-1 text-xs font-semibold text-slate-950 truncate">{order.courierName || 'Pending'}</p>
                    </div>
                  </>
                )}
              </div>

            {mode !== 'delivered' && order.lastTrackingUpdate && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/30 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-blue-700 font-bold">Latest Status Update</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 font-medium">{order.lastTrackingUpdate}</p>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Order timeline</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {TIMELINE.map((step, index) => {
                  const completed = getTimelineState(order).includes(step)
                  const isCurrent =
                    `${order.status || ''}`.toLowerCase() === step ||
                    (step === 'delivered' && mode === 'delivered')

                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${completed ? 'bg-slate-950 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-widest ${isCurrent ? 'text-blue-700' : 'text-slate-500'}`}>{step}</p>
                        <p className="text-[11px] text-slate-400">
                          {completed ? 'Recorded' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Ordered Items ({(order.items || []).length})</p>
                <Link href="/products" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Add more items</Link>
              </div>
              <div className="mt-3 grid gap-2">
                {(order.items || []).map((item) => (
                  <Link
                    key={item.id}
                    href={`/products/${item.product?.slug || item.product?.id || ''}`}
                    className="interactive-button group flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-50 border border-slate-100">
                        {item.product?.imageUrl ? (
                          <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] font-bold text-slate-300">NZ</div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-950 group-hover:text-blue-700 transition-colors">{item.product?.name || 'Product removed'}</p>
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          QTY: {item.quantity} • Rs. {Number(item.price || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline text-[10px] font-bold text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">View Details</span>
                      <svg className="h-4 w-4 text-slate-300 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3">
                <a
                  href={`/api/orders/${order.id}/invoice`}
                  className="interactive-button inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  Download invoice PDF
                </a>
                {mode !== 'delivered' ? (
                  <button
                    type="button"
                  onClick={() => runOrderAction(order.id, 'cancel')}
                  disabled={actionLoading === `${order.id}:cancel`}
                  className="interactive-button inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                >
                    {actionLoading === `${order.id}:cancel` ? <LoadingSpinner size="sm" tone="dark" label="Cancelling..." /> : 'Cancel order'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => runOrderAction(order.id, 'return')}
                    disabled={actionLoading === `${order.id}:return`}
                    className="interactive-button inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
                  >
                    {actionLoading === `${order.id}:return` ? <LoadingSpinner size="sm" tone="dark" label="Submitting..." /> : 'Request return'}
                  </button>
                )}
                {order.supportTicketId ? (
                  <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
                    Support ID: {order.supportTicketId}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500">
                Payment: <span className="font-semibold text-slate-900">{order.paymentStatus || 'Pending'}</span>
              </p>
            </div>
          </article>
        ))
      )}

      {actionMessage ? <p className="text-sm text-emerald-600">{actionMessage}</p> : null}
      {actionError ? <p className="text-sm text-rose-600">{actionError}</p> : null}
    </div>
  )
}
