'use client'

export default function LoadingSpinner({
  size = 'md',
  tone = 'dark',
  label = 'Loading',
  className = '',
}) {
  const sizeClass =
    size === 'sm'
      ? 'h-4 w-4 border-2'
      : size === 'lg'
        ? 'h-10 w-10 border-[3px]'
        : 'h-5 w-5 border-2'

  const toneClass =
    tone === 'light'
      ? 'border-white/25 border-t-white'
      : tone === 'blue'
        ? 'border-blue-200 border-t-blue-600'
        : 'border-slate-200 border-t-slate-900'

  return (
    <span className={`inline-flex items-center gap-3 ${className}`} role="status" aria-live="polite">
      <span className={`loading-spinner inline-block rounded-full ${sizeClass} ${toneClass}`} />
      {label ? <span>{label}</span> : null}
    </span>
  )
}
