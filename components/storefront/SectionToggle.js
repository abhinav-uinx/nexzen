'use client'

export default function SectionToggle({ view, setView }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
      <button
        onClick={() => setView('grid')}
        suppressHydrationWarning={true}
        className={`flex h-8 items-center gap-2 rounded-full px-4 text-xs font-bold uppercase tracking-widest transition-all ${
          view === 'grid'
            ? 'bg-white text-slate-950 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grid-2x2">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M3 12h18"/>
          <path d="M12 3v18"/>
        </svg>
        Grid
      </button>
      <button
        onClick={() => setView('list')}
        suppressHydrationWarning={true}
        className={`flex h-8 items-center gap-2 rounded-full px-4 text-xs font-bold uppercase tracking-widest transition-all ${
          view === 'list'
            ? 'bg-white text-slate-950 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        List
      </button>
    </div>
  )
}
