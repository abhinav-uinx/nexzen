import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#2155ff_0%,#0f172a_58%,#020617_100%)] text-white p-4">
      <div className="max-w-2xl text-center">
        <div className="relative mx-auto mb-8 h-32 w-32">
          {/* Subtle glow effect behind the 404 */}
          <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/20 blur-2xl"></div>
          <svg
            className="relative h-full w-full text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h1 className="font-heading text-7xl font-bold tracking-tight sm:text-9xl mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
          404
        </h1>
        
        <p className="mt-4 text-xl font-medium tracking-widest uppercase text-cyan-400">
          Page Not Found
        </p>

        <p className="mt-4 text-lg leading-7 text-slate-300 max-w-lg mx-auto">
          We scanned the entire grid, but the page you are looking for has been moved, renamed, or no longer exists.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="interactive-button group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-blue-600 px-8 py-4 text-sm font-semibold text-white shadow-[0_0_40px_-10px_rgba(37,99,235,0.6)] transition-all duration-300 hover:scale-105 hover:bg-blue-500 hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.8)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Return Home
            </span>
          </Link>
          
          <Link
            href="/products"
            className="interactive-button inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/30"
          >
            Browse Products
          </Link>
        </div>
      </div>
      
      {/* Decorative tech-like grid line in background */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>
  )
}
