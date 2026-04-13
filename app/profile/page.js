import { cookies } from 'next/headers'
import ProfileShell from '@/components/profile/ProfileShell'
import { getAdminCookieName, getAdminSession } from '@/lib/admin/auth'
import { getAdminBasePath } from '@/lib/admin/config'

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(getAdminCookieName())?.value
  const isAdmin = !!(await getAdminSession(sessionToken))
  const adminBasePath = getAdminBasePath()

  const tools = [
    { href: '/products', label: 'Continue shopping' },
    { href: '/cart', label: 'Open cart' },
    { href: '/active-orders', label: 'Active orders' },
    { href: '/ordered-items', label: 'Ordered items' },
  ]

  if (isAdmin) {
    tools.push({ href: `${adminBasePath}/products/upload`, label: 'Upload Products' })
  }

  return <ProfileShell tools={tools} showProfileForm />
}
