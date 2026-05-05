'use client'

import { useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'

function getEstimate(pincode) {
  if (!/^\d{6}$/.test(pincode)) {
    return null
  }

  const leadDays =
    pincode.startsWith('56') || pincode.startsWith('11')
      ? 2
      : pincode.startsWith('40') || pincode.startsWith('60')
        ? 3
        : 5

  const deliveryDate = new Date()
  deliveryDate.setDate(deliveryDate.getDate() + leadDays)

  return {
    leadDays,
    deliveryDate: deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }),
  }
}

export default function PincodeChecker() {
  const [value, setValue] = useState('')
  const estimate = useMemo(() => getEstimate(value), [value])

  return (
    <div className="mt-12 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 p-1">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-950">
          <MapPin size={14} className="text-slate-400" />
          Serviceability Check
        </h3>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="ENTER PINCODE"
            value={value}
            onChange={(event) => setValue(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className="flex-1 rounded-lg border-2 border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-widest outline-none transition-all focus:border-slate-950 focus:bg-white"
            maxLength={6}
          />
          <div className="rounded-lg bg-slate-950 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-950/10">
            {estimate ? `Delivers by ${estimate.deliveryDate}` : 'Enter 6 digits'}
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {estimate
            ? `Estimated dispatch window: ${estimate.leadDays} business day${estimate.leadDays > 1 ? 's' : ''}.`
            : 'We show a quick estimate here and confirm the final delivery window at checkout.'}
        </p>
      </div>
    </div>
  )
}
