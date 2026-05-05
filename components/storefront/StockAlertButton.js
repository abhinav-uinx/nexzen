'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'

export default function StockAlertButton({ product }) {
  const router = useRouter()
  const { session, user } = useAuth()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const authToken = session?.access_token || ''

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      if (!authToken || !product?.id || product?.inStock) {
        setSubscribed(false)
        return
      }

      try {
        const response = await fetch(`/api/stock-alerts?productId=${encodeURIComponent(product.id)}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
        const result = await response.json().catch(() => ({}))
        if (!cancelled && response.ok) {
          setSubscribed(Boolean(result.subscribed))
        }
      } catch {
        if (!cancelled) {
          setSubscribed(false)
        }
      }
    }

    loadStatus()
    return () => {
      cancelled = true
    }
  }, [authToken, product?.id, product?.inStock])

  if (!product || product.inStock) {
    return null
  }

  async function handleToggle() {
    setMessage('')

    if (!user || !authToken) {
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/stock-alerts', {
        method: subscribed ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          productId: product.id,
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || 'Could not update the stock alert.')
      }

      const next = Boolean(result.subscribed)
      setSubscribed(next)
      setMessage(next ? 'We will email you as soon as it is back.' : 'Stock alert removed.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update the stock alert.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-700">Out of stock</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Save a back-in-stock alert for this item and we will notify your account email.
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
            subscribed
              ? 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              : 'bg-slate-950 text-white hover:bg-slate-800'
          } disabled:opacity-60`}
        >
          {subscribed ? <BellOff size={16} /> : <Bell size={16} />}
          {loading ? 'Updating...' : subscribed ? 'Remove alert' : 'Notify me'}
        </button>
      </div>
      {message ? <p className="mt-3 text-xs text-slate-600">{message}</p> : null}
    </div>
  )
}
