import { NextResponse } from 'next/server'
import { getAdminBasePath, getAllowedAdminIps } from '@/lib/admin/config'
import { getClientIpFromHeaders, isIpAllowed } from '@/lib/admin/security'

export function proxy(request) {
  const { pathname } = request.nextUrl
  const adminBasePath = getAdminBasePath()
  const allowedIps = getAllowedAdminIps()
  const ip = getClientIpFromHeaders(request.headers)

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  }

  const isHiddenAdminPage =
    pathname === adminBasePath || pathname.startsWith(`${adminBasePath}/`)
  const isAdminApi = pathname.startsWith('/api/admin/')

  if ((isHiddenAdminPage || isAdminApi) && !isIpAllowed(ip, allowedIps)) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  }

  if (isHiddenAdminPage) {
    const targetPath = pathname.replace(adminBasePath, '/admin') || '/admin'
    const url = request.nextUrl.clone()
    url.pathname = targetPath

    const response = NextResponse.rewrite(url)
    response.headers.set('Cache-Control', 'no-store')
    return response
  }

  const response = NextResponse.next()

  if (isAdminApi) {
    response.headers.set('Cache-Control', 'no-store')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
