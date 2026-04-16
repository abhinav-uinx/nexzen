'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function ProductAccordions({ details = [] }) {
  const [openIndex, setOpenIndex] = useState(0)

  if (details.length === 0) return null

  return (
    <div className="mt-12 border-t border-slate-100 divide-y divide-slate-100 bg-white">
      {details.map((section, index) => (
        <div key={index} className="py-1">
          <button
            onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
            className="flex w-full items-center justify-between py-6 px-4 text-left transition-colors hover:bg-slate-50/50"
          >
            <span className="text-sm font-bold uppercase tracking-wider text-slate-950">
              {section.title}
            </span>
            {openIndex === index ? (
              <ChevronUp size={20} className="text-slate-400" />
            ) : (
              <ChevronDown size={20} className="text-slate-400" />
            )}
          </button>
          
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openIndex === index ? 'max-h-[1000px] opacity-100 pb-8 px-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="text-sm leading-relaxed text-slate-600 prose prose-slate max-w-none">
               {section.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
