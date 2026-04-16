'use client'

import { useState, useEffect } from 'react'

export default function CouponManager() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [updateLoading, setUpdateLoading] = useState(null)
  const [newName, setNewName] = useState('')
  const [newPercent, setNewPercent] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/coupons')
      const data = await res.json()
      if (res.ok) {
        setCoupons(data.coupons || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const createNewCoupon = async (e) => {
    e.preventDefault()
    if (!newName || !newPercent) return
    
    setCreateLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, discountPercent: newPercent })
      })
      const data = await res.json()
      if (res.ok) {
        setCoupons([data.coupon, ...coupons])
        setNewName('')
        setNewPercent('')
      } else {
        setError(data.error || 'Failed to create coupon')
      }
    } catch (e) {
      console.error(e)
      setError('An error occurred during creation')
    } finally {
      setCreateLoading(false)
    }
  }

  const updateCoupon = async (id, updates) => {
    setUpdateLoading(id)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })
      if (res.ok) {
        const { coupon } = await res.json()
        setCoupons(coupons.map(c => c.id === id ? coupon : c))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdateLoading(null)
    }
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Nexzen Rewards</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-950">Discount Control Center</h2>
          <p className="mt-2 text-sm text-slate-600">Instantly adjust coupon percentages or toggle promotions on/off.</p>
        </div>

        {/* Create Coupon Form */}
        <form onSubmit={createNewCoupon} className="flex flex-col gap-3 rounded-[1.5rem] bg-slate-50 p-4 border border-slate-100 sm:w-80">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Create New Coupon</p>
          <input 
            suppressHydrationWarning
            type="text"
            placeholder="COUPON_CODE"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
            value={newName}
            onChange={(e) => setNewName(e.target.value.toUpperCase())}
            required
          />
          <div className="flex gap-2">
            <input 
              suppressHydrationWarning
              type="number"
              placeholder="Disc %"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={newPercent}
              onChange={(e) => setNewPercent(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={createLoading}
              className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800 disabled:opacity-50"
            >
              {createLoading ? '...' : 'Create'}
            </button>
          </div>
          {error && <p className="text-[10px] font-bold text-rose-600">{error}</p>}
        </form>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p className="text-sm text-slate-500 animate-pulse">Accessing promotion database...</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-slate-500">No active coupons found in catalog.</p>
        ) : (
          coupons.map(coupon => (
            <div key={coupon.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:bg-white hover:shadow-md border-l-4 border-l-blue-600">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">{coupon.name}</span>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${coupon.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                      {coupon.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Created {new Date(coupon.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                    <span className="text-sm font-bold text-slate-900">Discount:</span>
                    <input 
                      suppressHydrationWarning
                      type="number"
                      className="w-16 bg-transparent text-center font-bold text-blue-700 focus:outline-none"
                      value={coupon.discountPercent}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, discountPercent: isNaN(val) ? 0 : val } : c))
                      }}
                      onBlur={(e) => updateCoupon(coupon.id, { discountPercent: parseInt(e.target.value) })}
                    />
                    <span className="text-sm font-bold text-blue-700">%</span>
                  </div>

                  <div className="flex gap-2">
                     <button
                      onClick={() => updateCoupon(coupon.id, { isActive: !coupon.isActive })}
                      disabled={updateLoading === coupon.id}
                      className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${coupon.isActive ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                    >
                      {updateLoading === coupon.id ? '...' : coupon.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
