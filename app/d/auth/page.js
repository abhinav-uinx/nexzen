import DecoyLoginForm from '@/components/admin/DecoyLoginForm'

export const metadata = {
  title: 'Dashboard Auth | Nexzen',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardAuthPage() {
  return (
    <DecoyLoginForm
      title="Dashboard Authentication"
      description="Administrative verification is required to continue to this environment."
    />
  )
}
