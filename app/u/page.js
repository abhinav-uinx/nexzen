import ProfileShell from '@/components/profile/ProfileShell'

export default async function ProfilePage() {
  const tools = [
    { href: '/products', label: 'Continue shopping' },
  ]

  return <ProfileShell tools={tools} showProfileForm />
}
