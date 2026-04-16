'use client'

import { useAdminInsight } from '@/providers/AdminInsightProvider'
import { Info } from 'lucide-react'

export default function InsightBadge({ insightKey, className = "" }) {
  const { showInsight, hideInsight, toggleInsight, activeInsight } = useAdminInsight()
  const isActive = activeInsight === insightKey

  return (
    <button
      suppressHydrationWarning
      type="button"
      onMouseEnter={() => showInsight(insightKey)}
      onMouseLeave={hideInsight}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleInsight(insightKey)
      }}
      className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
        isActive 
          ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30' 
          : 'bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600'
      } ${className}`}
      title="View Insight Preview"
    >
      <span suppressHydrationWarning className="text-[11px] font-black tracking-tighter">!</span>
      
      {/* Ripple effect when active */}
      {isActive && (
        <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/30"></span>
      )}
    </button>
  )
}
