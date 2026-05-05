'use client'

import { useState, useTransition, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { useCart } from '@/providers/CartProvider'

export default function CartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="h-10 w-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" /></div>}>
      <CartPageContent />
    </Suspense>
  )
}

function CartPageContent() {
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
  const [savedAddresses, setSavedAddresses] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('razorpay') // razorpay, cod

  const [couponCode, setCouponCode] = useState(appliedCoupon?.name || '')
  const [couponMessage, setCouponMessage] = useState('')
  const [couponError, setCouponError] = useState('')
  const [isApplyingCoupon, startCouponTransition] = useTransition()
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [isCheckingOut, startCheckoutTransition] = useTransition()

  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  // Handle incoming payment errors from terminal redirects
  useEffect(() => {
    if (errorParam) {
      if (errorParam === 'cancelled') {
        setCheckoutError('Payment was cancelled. You can try again whenever you are ready.')
      } else if (errorParam === 'failed') {
        setCheckoutError('Payment failed. Please check your payment details or try another method.')
      }
    }
  }, [errorParam])

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
            const addresses = Array.isArray(profile.savedAddresses) ? profile.savedAddresses : []
            setSavedAddresses(addresses)
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
    if (!couponCode.trim()) {
      setCouponError('Enter a coupon code first.')
      setCouponMessage('')
      return
    }

    startCouponTransition(async () => {
      try {
        setCouponError('')
        setCouponMessage('')
        const response = await fetch('/api/coupons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ code: couponCode.trim() }),
        })

        const result = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(result.error || 'Could not apply this coupon.')
        }

        applyCoupon(result.coupon)
        setCouponMessage(`Coupon ${result.coupon.name} applied successfully.`)
      } catch (error) {
        removeCoupon()
        setCouponError(error instanceof Error ? error.message : 'Could not apply this coupon.')
        setCouponMessage('')
      }
    })
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
        router.push(paymentUrl)
      } else {
        clearCart()
        setCheckoutMessage(`Order ${result.order.id} placed successfully with Cash on Delivery.`)
        router.push('/active-orders')
      }
    })
  }

  function applySavedAddress(address) {
    setShippingData((prev) => ({
      ...prev,
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      phone: address.phone || prev.phone || '',
    }))
  }

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {cartItems.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center animate-apple-fade">
             <div className="relative mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-slate-50 border border-slate-100 shadow-inner">
                <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
             </div>
             <h2 className="font-heading text-3xl font-bold text-slate-950">Your cart is empty</h2>
             <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">
                It looks like you haven't added any building blocks to your collection yet.
             </p>
             <Link
                href="/"
                className="interactive-button mt-10 rounded-full bg-slate-950 px-8 py-4 text-sm font-bold text-white shadow-xl transition-all hover:bg-blue-700 hover:shadow-[0_20px_40px_rgba(37,99,235,0.2)] active:scale-[0.98]"
             >
                Explore Products
             </Link>
          </div>
        ) : (
          <>
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
                    <div key={item.id} className="group rounded-2xl border border-slate-200 bg-white p-3 transition-all hover:border-blue-200 hover:shadow-[0_8px_30px_rgba(37,99,235,0.04)]">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 items-center gap-3">
                            {item.imageUrl && (
                                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
                                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-[9px] uppercase tracking-widest text-slate-400 font-bold">{item.family}</p>
                                <h3 className="truncate font-heading text-base font-bold text-slate-950 group-hover:text-blue-700 transition-colors uppercase">{item.name}</h3>
                                <p className="mt-0.5 text-xs font-bold text-slate-600">Rs. {item.price.toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <div className="flex items-center rounded-xl bg-slate-50 p-0.5 border border-slate-100">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="interactive-button flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all"
                            >
                              -
                            </button>
                            <span className="min-w-8 text-center text-xs font-bold text-slate-950">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="interactive-button flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all"
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
                    {savedAddresses.length > 0 && (
                      <div className="mb-6">
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Saved addresses</p>
                        <div className="grid gap-3">
                          {savedAddresses.map((address) => (
                            <button
                              key={address.id}
                              type="button"
                              onClick={() => applySavedAddress(address)}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-950">{address.label}</p>
                                  <p className="mt-1 text-sm leading-6 text-slate-600">
                                    {[address.addressLine1, address.addressLine2, address.city, address.state, address.pincode]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </p>
                                </div>
                                {address.isDefault && (
                                  <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                                    Default
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
                  {appliedCoupon ? (
                    <div className="mt-3 flex items-center justify-between rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      <div>
                        <p className="font-semibold">{appliedCoupon.name} is active</p>
                        <p className="text-xs text-emerald-100/80">
                          {appliedCoupon.minOrderValue ? `Min. order Rs. ${Number(appliedCoupon.minOrderValue).toLocaleString('en-IN')}` : 'Applied to this order total'}
                        </p>
                      </div>
                      <button type="button" onClick={removeCoupon} className="text-xs font-bold uppercase tracking-widest text-white/80">
                        Remove
                      </button>
                    </div>
                  ) : null}
                  {couponMessage ? <p className="mt-3 text-xs text-emerald-300">{couponMessage}</p> : null}
                  {couponError ? <p className="mt-3 text-xs text-rose-300">{couponError}</p> : null}
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

              {checkoutMessage && <p className="mt-6 text-center text-sm font-bold text-emerald-400">{checkoutMessage}</p>}
            </div>
          </div>
          </>
        )}
      </div>

      {/* Payment Error Modal */}
      {checkoutError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md scale-in-center rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-300">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500 border border-rose-100">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="font-heading text-2xl font-bold text-slate-950">Payment Issue</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 font-medium">
              {checkoutError}
            </p>
            <button
              onClick={() => {
                setCheckoutError('')
                // Remove the error parameter from URL without page reload
                router.replace('/cart')
              }}
              className="mt-8 w-full rounded-full bg-slate-950 py-4 text-sm font-bold text-white shadow-xl transition-all hover:bg-blue-700 active:scale-[0.98]"
            >
              Continue to Cart
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
