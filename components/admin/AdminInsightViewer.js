'use client'

import { useAdminInsight } from '@/providers/AdminInsightProvider'
import { INSIGHT_CONTENT } from '@/lib/admin/insights'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Phone, SignalHigh } from 'lucide-react'
import Image from 'next/image'

export default function AdminInsightViewer() {
  const { activeInsight, hideInsight } = useAdminInsight()
  const content = activeInsight ? INSIGHT_CONTENT[activeInsight] : null

  return (
    <>
      <AnimatePresence mode="wait">
        {content && (
          <motion.div
            key="admin-insight-viewer"
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[9999] w-80 overflow-hidden rounded-[2.5rem] border-4 border-white bg-slate-900 shadow-[0_32px_120px_rgba(0,0,0,0.5)]"
          >
            {/* Header / "Calling" Bar */}
            <div className="flex items-center justify-between bg-slate-800/50 px-5 py-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg">
                    <User size={16} />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-500 animate-pulse"></div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Insight Live</p>
                  <p className="text-[11px] font-bold text-white/90">Nexzen Specialist</p>
                </div>
              </div>
              <button 
                suppressHydrationWarning
                onClick={hideInsight}
                className="group flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-rose-500"
              >
                <X size={14} className="transition group-hover:scale-110" />
              </button>
            </div>

            {/* Video / Preview Area */}
            <div className="relative aspect-video w-full bg-black">
               {content.assetUrl ? (
                 <div className="relative h-full w-full">
                   <Image 
                     src={content.assetUrl} 
                     alt="Preview" 
                     fill 
                     className="object-cover opacity-90 transition-opacity hover:opacity-100" 
                   />
                   {/* Scanning Overlay Effect */}
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent h-full w-full animate-scan pointer-events-none"></div>
                 </div>
               ) : (
                 <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-950 p-6 text-center">
                   <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Connecting to substances...</p>
                 </div>
               )}
               
               {/* PIP UI Elements */}
               <div className="absolute bottom-3 left-3 flex gap-2">
                  <div className="flex items-center gap-1.5 rounded-lg bg-black/40 px-2 py-1 backdrop-blur-md">
                     <SignalHigh size={10} className="text-emerald-400" />
                     <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest">4K Live</span>
                  </div>
               </div>
            </div>

            {/* Description Area */}
            <div className="p-6">
              <h4 className="font-heading text-lg font-bold text-white tracking-tight">{content.title}</h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-400 font-medium">
                {content.description}
              </p>
              
              <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                 <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-6 w-6 rounded-full border-2 border-slate-900 bg-slate-700 overflow-hidden">
                         <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-slate-500">
                            UI
                         </div>
                      </div>
                    ))}
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nexzen Autopilot</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* CSS for custom scan animation if not in tailwind */}
      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </>
  )
}
