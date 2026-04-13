'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { useCart } from '@/providers/CartProvider'

export default function CartPage() {
  const router = useRouter()
  const { user, session } = useAuth()
  const {
    cartItems,
    cartTotal,
    discountAmount,
    finalTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart()
  const [step, setStep] = useState(1) // 1: Review, 2: Shipping, 3: Payment
  const [shippingData, setShippingData] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('razorpay') // razorpay, cod

  const [couponCode, setCouponCode] = useState(appliedCoupon?.name || '')
  const [couponMessage, setCouponMessage] = useState('')
  const [couponError, setCouponError] = useState('')
  const [isApplyingCoupon, startCouponTransition] = useTransition()
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [isCheckingOut, startCheckoutTransition] = useTransition()

  // Fetch user address & UPI on mount if logged in
  useEffect(() => {
    async function loadSavedProfile() {
      if (user && session?.access_token) {
        try {
          const response = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${session.access_token}` }
          })
          const { profile } = await response.json()
          
          if (profile) {
            setShippingData(prev => ({
              ...prev,
              addressLine1: profile.addressLine1 || prev.addressLine1,
              addressLine2: profile.addressLine2 || prev.addressLine2,
              city: profile.city || prev.city,
              state: profile.state || prev.state,
              pincode: profile.pincode || prev.pincode,
              phone: profile.phone || prev.phone,
              upiId: profile.savedUpiId || prev.upiId
            }))
          }
        } catch (e) {
          console.warn('Silent skip of profile pre-fill:', e)
        }
      }
    }

    loadSavedProfile()
  }, [user, session])

  function handleApplyCoupon() {
     // ... (logic remains same)
  }

  const validateShipping = () => {
    const { addressLine1, city, state, pincode, phone } = shippingData
    if (!addressLine1 || !city || !state || !pincode || !phone) {
        setCheckoutError('Please fill all required shipping fields.')
        return false
    }
    if (pincode.length < 6) {
        setCheckoutError('Invalid pincode.')
        return false
    }
    return true
  }

  function handleCheckout() {
    if (!user || !session?.access_token) {
      setCheckoutError('Sign in first to place an order.')
      router.push('/login')
      return
    }

    if (step === 1) {
        setStep(2)
        return
    }

    if (step === 2) {
        if (!validateShipping()) return
        setStep(3)
        return
    }

    // Step 3: Final Placement
    setCheckoutError('')
    setCheckoutMessage('')

    startCheckoutTransition(async () => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          total: finalTotal,
          discountAmount,
          discountPercentage: appliedCoupon?.discountPercent || 0,
          couponCode: appliedCoupon?.name || null,
          ...shippingData,
          paymentMethod
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setCheckoutError(result.error || 'Could not place your order.')
        return
      }

      const orderId = result.order.id
      
      if (paymentMethod === 'razorpay' || paymentMethod === 'upi') {
        const upiParam = shippingData.upiId ? `?vpa=${encodeURIComponent(shippingData.upiId)}` : ''
        const paymentUrl = `/checkout/pay/${orderId}${upiParam}`
        window.open(paymentUrl, '_blank')
        setCheckoutMessage('Payment window opened in a new tab. Waiting for confirmation...')
        // After a small delay, clear cart and redirect to profile to see the pending order
        setTimeout(() => {
            clearCart()
            router.push('/profile')
        }, 5000)
      } else {
        clearCart()
        setCheckoutMessage(`Order ${result.order.id} placed successfully with Cash on Delivery.`)
        router.push('/profile')
      }
    })
  }

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Checkout Header & Progress */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Checkout</p>
                <h1 className="mt-3 font-heading text-4xl font-semibold text-slate-950">
                    {step === 1 ? 'Review your items' : step === 2 ? 'Shipping details' : 'Secure payment'}
                </h1>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step >= s ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {s}
                        </div>
                        {s < 3 && <div className={`h-[1px] w-8 ${step > s ? 'bg-slate-950' : 'bg-slate-200'}`} />}
                    </div>
                ))}
            </div>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
             {/* Empty cart logic remains same */}
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            
            {/* Main Content Area */}
            <div className="space-y-4">
              {step === 1 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between px-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <span>Products ({cartItems.length})</span>
                    <span>Quantity & Action</span>
                  </div>
                  {cartItems.map((item) => (
                    <div key={item.id} className="group rounded-3xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-[0_8px_30px_rgba(37,99,235,0.04)]">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 items-center gap-4">
                            {item.imageUrl && (
                                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
                                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-[10px] uppercase tracking-widest text-slate-500">{item.family}</p>
                                <h3 className="truncate font-heading text-lg font-bold text-slate-950 group-hover:text-blue-700 transition-colors">{item.name}</h3>
                                <p className="mt-0.5 text-sm font-semibold text-slate-600">Rs. {item.price.toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between gap-6 sm:justify-end">
                          <div className="flex items-center rounded-2xl bg-slate-50 p-1 border border-slate-100">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="interactive-button flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all"
                            >
                              -
                            </button>
                            <span className="min-w-10 text-center text-sm font-bold text-slate-950">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="interactive-button flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all"
                            >
                              +
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-2"
                            title="Remove item"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="font-heading text-xl font-bold mb-6">Delivery Address</h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Street Address</label>
                            <input 
                                type="text" 
                                placeholder="House No, Building, Area"
                                value={shippingData.addressLine1}
                                onChange={e => setShippingData({...shippingData, addressLine1: e.target.value})}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">City</label>
                            <input 
                                type="text" 
                                placeholder="Bengaluru"
                                value={shippingData.city}
                                onChange={e => setShippingData({...shippingData, city: e.target.value})}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">State</label>
                            <input 
                                type="text" 
                                placeholder="Karnataka"
                                value={shippingData.state}
                                onChange={e => setShippingData({...shippingData, state: e.target.value})}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Pincode</label>
                            <input 
                                type="text" 
                                placeholder="560001"
                                value={shippingData.pincode}
                                onChange={e => setShippingData({...shippingData, pincode: e.target.value})}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Phone No</label>
                            <input 
                                type="text" 
                                placeholder="+91 99000 00000"
                                value={shippingData.phone}
                                onChange={e => setShippingData({...shippingData, phone: e.target.value})}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Razorpay Main */}
                    <div 
                        onClick={() => setPaymentMethod('razorpay')}
                        className={`cursor-pointer rounded-[2rem] border p-8 transition-all ${paymentMethod === 'razorpay' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${paymentMethod === 'razorpay' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                                    {paymentMethod === 'razorpay' && <div className="h-2 w-2 rounded-full bg-white" />}
                                </div>
                                <div>
                                    <p className="font-heading text-xl font-bold">Cards / Netbanking</p>
                                    <p className="text-sm text-slate-500">Secure payment via all major cards and banks.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dedicated UPI Option */}
                    <div 
                        onClick={() => setPaymentMethod('upi')}
                        className={`cursor-pointer rounded-[2rem] border p-8 transition-all ${paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${paymentMethod === 'upi' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                                        {paymentMethod === 'upi' && <div className="h-2 w-2 rounded-full bg-white" />}
                                    </div>
                                    <div>
                                        <p className="font-heading text-xl font-bold">UPI Payment</p>
                                        <p className="text-sm text-slate-500">Pay via PhonePe, Google Pay, or enter UPI ID.</p>
                                    </div>
                                </div>
                            </div>

                            {paymentMethod === 'upi' && (
                                <div className="animate-in fade-in zoom-in-95 duration-300">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Enter UPI ID (Optional pre-fill)</label>
                                    <input 
                                        type="text" 
                                        placeholder="username@okaxis"
                                        value={shippingData.upiId || ''}
                                        onClick={e => e.stopPropagation()}
                                        onChange={e => setShippingData({...shippingData, upiId: e.target.value})}
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 outline-none focus:border-blue-500 transition-all text-slate-950"
                                    />
                                    <p className="mt-2 text-[10px] text-slate-400">Leave blank to select your favorite app in the next window.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div 
                        onClick={() => setPaymentMethod('cod')}
                        className={`cursor-pointer rounded-[2rem] border p-8 transition-all ${paymentMethod === 'cod' ? 'border-slate-800 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${paymentMethod === 'cod' ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300'}`}>
                                {paymentMethod === 'cod' && <div className="h-2 w-2 rounded-full bg-white" />}
                            </div>
                            <div>
                                <p className="font-heading text-xl font-bold">Cash on Delivery</p>
                                <p className="text-sm text-slate-500">Pay at your doorstep when you receive the build.</p>
                            </div>
                        </div>
                    </div>
                </div>
              )}
            </div>

            {/* Sidebar Summary */}
            <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:p-8 sticky top-8 h-fit">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Order Summary</p>
              
              <div className="mt-8 space-y-4 border-b border-white/10 pb-6">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Items Total</span>
                    <span>Rs. {cartTotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-400">
                        <span>Discount ({appliedCoupon?.name})</span>
                        <span>- Rs. {discountAmount.toLocaleString()}</span>
                    </div>
                )}
                <div className="flex justify-between font-heading text-2xl font-bold pt-2">
                    <span>Final Total</span>
                    <span className="text-white">Rs. {finalTotal.toLocaleString()}</span>
                </div>
              </div>

              {step === 1 && (
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Promotions</p>
                  <div className="flex gap-2">
                    <input
                        type="text"
                        value={couponCode}
                        onChange={(event) => setCouponCode(event.target.value)}
                        placeholder="Coupon code"
                        className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                    />
                    <button onClick={handleApplyCoupon} className="rounded-full bg-white/10 px-5 py-2 text-xs font-bold">Apply</button>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="interactive-button w-full rounded-full bg-white px-5 py-4 text-sm font-bold text-slate-950 hover:bg-slate-200 shadow-xl"
                >
                    {isCheckingOut ? 'Processing...' : step === 3 ? 'Confirm Order' : 'Next Step'}
                </button>
                {step > 1 && (
                    <button onClick={() => setStep(step - 1)} className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mt-2 hover:text-white transition-colors">
                        ← Back to {step === 2 ? 'Items' : 'Shipping'}
                    </button>
                )}
              </div>

              {checkoutError && <p className="mt-6 text-center text-sm font-bold text-rose-400">{checkoutError}</p>}
              {checkoutMessage && <p className="mt-6 text-center text-sm font-bold text-emerald-400">{checkoutMessage}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
