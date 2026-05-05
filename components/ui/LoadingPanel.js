import LoadingSpinner from '@/components/ui/LoadingSpinner'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'

export default function LoadingPanel({
  eyebrow = 'Loading',
  title = 'Loading content...',
  description = 'Please wait while we prepare this section.',
  compact = false,
}) {
  return (
    <div className={`rounded-[2rem] border border-slate-200 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.05)] ${compact ? 'p-6' : 'p-8 sm:p-10'}`}>
      <div className="flex flex-col gap-5">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700">{eyebrow}</p>
          <h2 className="font-heading text-2xl font-semibold text-slate-950 sm:text-3xl">{title}</h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
        </div>

        <div className="text-sm font-medium text-slate-500">
          <LoadingSpinner tone="blue" label="Working smoothly..." />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <LoadingSkeleton className="h-24" />
          <LoadingSkeleton className="h-24" />
          <LoadingSkeleton className="h-24" />
        </div>
      </div>
    </div>
  )
}
