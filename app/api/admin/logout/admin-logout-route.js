import { cookies } from 'next/headers'
import { deleteAdminSession, getAdminCookieName } from '@/lib/admin/auth'
import { clearAdminSecurityCookies } from '@/lib/admin/request'

export async function handleAdminLogout() {
  const cookieStore = await cookies()
  const session = cookieStore.get(getAdminCookieName())?.value

  await deleteAdminSession(session)
  clearAdminSecurityCookies(cookieStore)

  return Response.json({ ok: true })
}
