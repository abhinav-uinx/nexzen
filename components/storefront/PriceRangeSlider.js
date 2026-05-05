'use client'

export default function PriceRangeSlider({
  min = 0,
  max = 10000,
  step = 100,
  compact = false,
  value,
  onChange,
}) {
  const minVal = value?.min ?? min
  const maxVal = value?.max ?? max

  const handleMinChange = (e) => {
    const nextValue = Math.min(Number(e.target.value), maxVal - step)
    onChange?.({ min: nextValue, max: maxVal })
  }

  const handleMaxChange = (e) => {
    const nextValue = Math.max(Number(e.target.value), minVal + step)
    onChange?.({ min: minVal, max: nextValue })
  }

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Min</span>
          <span className="ml-2 text-sm font-bold text-slate-900">Rs. {minVal.toLocaleString('en-IN')}</span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-right shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Max</span>
          <span className="ml-2 text-sm font-bold text-slate-900">Rs. {maxVal.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="relative h-1.5 w-full rounded-full bg-slate-100">
        <div
          className="absolute h-full rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
          style={{
            left: `${((minVal - min) / (max - min)) * 100}%`,
            right: `${100 - ((maxVal - min) / (max - min)) * 100}%`,
          }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          className="pointer-events-none absolute -top-1.5 z-20 h-4 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-125"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          className="pointer-events-none absolute -top-1.5 z-20 h-4 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-125"
        />
      </div>
    </div>
  )
}
