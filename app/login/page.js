import UserLoginForm from '@/components/auth/UserLoginForm'

export const metadata = {
  title: 'User Login | Nexzen',
}

export default function LoginPage() {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top,#2155ff_0%,#0f172a_58%,#020617_100%)] p-8 text-white shadow-[0_20px_70px_rgba(15,23,42,0.2)] sm:p-10 lg:block">
          <p className="text-sm uppercase tracking-[0.26em] text-cyan-300">Nexzen Access</p>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">
            Sign in to save carts, track orders, and build faster.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-200">
            Use your email or continue with a trusted platform. GitHub login is included for makers and developers who want a faster sign-in flow.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-white/70">Benefits</p>
              <p className="mt-3 text-lg font-semibold">Saved builds and quick reorder access</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-white/70">Preferred for</p>
              <p className="mt-3 text-lg font-semibold">Labs, students, makers, and hardware teams</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-700">User Login</p>
          <h2 className="mt-3 font-heading text-4xl font-semibold text-slate-950">Welcome back</h2>
          <UserLoginForm />
        </div>
      </div>
    </section>
  )
}
