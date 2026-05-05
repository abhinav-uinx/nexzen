'use client'

const ADMIN_CSRF_COOKIE = 'nexzen_admin_csrf'

function readCookie(name) {
  if (typeof document === 'undefined') {
    return ''
  }

  const prefix = `${name}=`
  const cookie = document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix))

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : ''
}

export function getAdminCsrfToken() {
  return readCookie(ADMIN_CSRF_COOKIE)
}

export function withAdminHeaders(headers = {}) {
  const nextHeaders = new Headers(headers)
  const csrfToken = getAdminCsrfToken()

  if (csrfToken) {
    nextHeaders.set('x-csrf-token', csrfToken)
  }

  nextHeaders.set('x-requested-with', 'XMLHttpRequest')
  return nextHeaders
}
