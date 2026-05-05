import { BadgeCheck, Headset, ShieldCheck, Truck } from 'lucide-react'

const signals = [
  {
    icon: ShieldCheck,
    title: 'Secure checkout',
    detail: 'Protected payments, verified pricing, and authenticated account actions.',
  },
  {
    icon: Truck,
    title: 'Fast dispatch',
    detail: 'Live order updates with delivery estimates and support tracking built in.',
  },
  {
    icon: BadgeCheck,
    title: 'Builder-grade inventory',
    detail: 'Curated boards, sensors, and accessories with stock-aware ordering.',
  },
  {
    icon: Headset,
    title: 'Human support',
    detail: 'Support tickets connect directly to each order for quicker resolution.',
  },
]

export default function TrustSignals() {
  return (
    <section className="px-6 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1200px] rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-700">Why teams trust Nexzen</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-950">Quiet confidence built into every order.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-600">
            The storefront now surfaces the things repeat buyers actually care about: secure payment, stock visibility, delivery clarity, and responsive support.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {signals.map((signal) => (
            <div key={signal.title} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm">
                <signal.icon size={20} />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-950">{signal.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{signal.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
