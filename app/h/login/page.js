import DecoyLoginForm from '@/components/admin/DecoyLoginForm'

export const metadata = {
  title: 'Portal Login | Nexzen',
  robots: {
    index: false,
    follow: false,
  },
}

export default function PortalLoginPage() {
  return (
    <DecoyLoginForm
      title="Operations Portal"
      description="Authorized operations staff only. Session verification is required before access is granted."
    />
  )
}
