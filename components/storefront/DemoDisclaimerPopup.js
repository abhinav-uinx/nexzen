'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

const DEMO_DISCLAIMER_KEY = 'nexzen-demo-disclaimer-seen'

export default function DemoDisclaimerPopup() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    let openTimer

    try {
      if (sessionStorage.getItem(DEMO_DISCLAIMER_KEY) === 'true') {
        return
      }

      openTimer = window.setTimeout(() => setIsOpen(true), 0)
    } catch {
      openTimer = window.setTimeout(() => setIsOpen(true), 0)
    }

    return () => window.clearTimeout(openTimer)
  }, [])

  function closePopup() {
    try {
      sessionStorage.setItem(DEMO_DISCLAIMER_KEY, 'true')
    } catch {
      // Ignore storage failures and still let the visitor close the popup.
    }
    setIsOpen(false)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-disclaimer-title"
        className="relative w-full max-w-lg rounded-[1.75rem] border border-amber-200 bg-white p-6 text-slate-950 shadow-[0_28px_90px_rgba(15,23,42,0.28)] sm:p-8"
      >
        <button
          type="button"
          onClick={closePopup}
          aria-label="Close demo disclaimer"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-amber-700">Demo website notice</p>
        <h2 id="demo-disclaimer-title" className="mt-3 font-heading text-3xl font-bold text-slate-950">
          Please do not make any payment
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          This website is for demonstration purposes only. Do not make any real payment or enter payment details. Nexzen is not responsible for any financial loss, failed transaction, or payment made on this demo website.
        </p>

        <button
          type="button"
          onClick={closePopup}
          className="mt-7 w-full rounded-full bg-slate-950 px-6 py-4 text-sm font-bold text-white shadow-xl transition hover:bg-amber-700 active:scale-[0.98]"
        >
          I understand
        </button>
      </div>
    </div>
  )
}
