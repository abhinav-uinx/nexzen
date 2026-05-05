'use client'

import { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/providers/CartProvider'
import { useAuth } from '@/providers/AuthProvider'

export default function RazorpayPaymentPage({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const searchParams = useSearchParams()
  const vpa = searchParams.get('vpa') || null
  const orderId = params.id
  const { clearCart } = useCart()
  const { session, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('initializing') // initializing, paying, success, failed
  const router = useRouter()

  useEffect(() => {
    const loadRazorpay = async () => {
      try {
        // 1. Load the Razorpay Script
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        document.body.appendChild(script)

        script.onload = async () => {
          try {
            // 2. Fetch the Razorpay Order from our API
            const authHeaders = session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {}

            const res = await fetch('/api/orders/' + orderId, {
              headers: authHeaders,
            })
            if (!res.ok) throw new Error('Order not found')
            const { order } = await res.json()

            const rzpRes = await fetch('/api/checkout/razorpay', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
              },
              body: JSON.stringify({
                orderId: order.id,
              })
            })
            
            const rzpOrder = await rzpRes.json()
            if (!rzpRes.ok) {
              const detail = rzpOrder.error || 'Server Error'
              const code = rzpOrder.code ? `[${rzpOrder.code}]` : ''
              const key = rzpOrder.key_id ? `(Key: ${rzpOrder.key_id})` : ''
              throw new Error(`${detail} ${code} ${key}`)
            }

            // 3. Open Razorpay Modal
            const options = {
              key: rzpOrder.key_id, // Use the real key from environment
              amount: rzpOrder.amount,
              currency: rzpOrder.currency,
              name: 'Nexzen',
              description: 'Order Payment',
              order_id: rzpOrder.id,
              handler: async function (response) {
                setStatus('verifying')
                try {
                  const verifyRes = await fetch('/api/checkout/verify', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...authHeaders,
                    },
                    body: JSON.stringify({
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      orderId: orderId
                    })
                  })

                    if (verifyRes.ok) {
                      clearCart()
                      setStatus('success')
                    } else {
                      router.push(`/cart?error=failed&orderId=${orderId}`)
                    }
                  } catch (e) {
                    router.push(`/cart?error=failed&orderId=${orderId}`)
                  }
                },
              prefill: {
                name: order.customerName,
                email: order.customerEmail,
                contact: order.phone,
                vpa: vpa // Pre-fill the UPI ID if provided
              },
              theme: { color: '#0f172a' },
              modal: {
                ondismiss: function() {
                  if (status !== 'success') {
                    router.push(`/cart?error=cancelled&orderId=${orderId}`)
                  }
                }
              }
            }

            const paymentObject = new window.Razorpay(options)
            paymentObject.open()
            setStatus('paying')
            setLoading(false)
          } catch (e) {
            setError(e.message)
            setLoading(false)
          }
        }
      } catch (e) {
        setError('Failed to load payment gateway.')
        setLoading(false)
      }
    }

    if (authLoading) {
      return
    }

    if (!session?.access_token) {
      setError('Sign in required to continue with payment.')
      setLoading(false)
      return
    }

    if (orderId) {
      loadRazorpay()
    }
  }, [authLoading, orderId, session?.access_token])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Initializing Payment...</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-heading text-4xl font-bold">Payment Successful</h1>
        <p className="mt-4 text-slate-400">Your order has been confirmed. You can view your active shipments now.</p>
        <Link href="/active-orders" className="mt-8 rounded-full bg-white px-8 py-3 text-sm font-bold text-slate-950 transition-all hover:bg-emerald-400">
          View Active Orders
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="font-heading text-4xl font-bold">Payment Failed</h1>
        <p className="mt-4 text-slate-400">{error}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button onClick={() => window.location.reload()} className="rounded-full bg-white px-8 py-3 text-sm font-bold text-slate-950 transition-all hover:bg-slate-200">
            Try Again
          </button>
          <Link href="/cart" className="rounded-full bg-white/10 px-8 py-3 text-sm font-bold border border-white/20 transition-all hover:bg-white/20">
            Back to Cart
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <p className="text-lg font-bold">Secure Payment Terminal</p>
        <p className="mt-2 text-sm text-slate-400">Communicating with Razorpay...</p>
      </div>
    </div>
  )
}
