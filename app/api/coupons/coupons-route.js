import { getPrismaClient } from '@/lib/database/nexus-db'
import { createSupabaseServerClient } from '@/lib/auth/supabase-server'

function getBearerToken(request) {
  const authorization = request.headers.get('authorization') || ''
  if (!authorization.toLowerCase().startsWith('bearer ')) return null
  return authorization.slice(7).trim()
}

export async function handleCouponLookup(request) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const code = `${body?.code || ''}`.trim()

    if (!code) {
      return Response.json({ error: 'Coupon code is required.' }, { status: 400 })
    }

    const rows = await prisma.$queryRaw`
      SELECT "id", "name", "discountPercent"
      FROM "coupons"
      WHERE LOWER("name") = LOWER(${code})
        AND "isActive" = true
      LIMIT 1
    `
    const coupon = Array.isArray(rows) ? rows[0] : null

    if (!coupon) {
      return Response.json({ error: 'Invalid coupon code.' }, { status: 404 })
    }

    // Check for early usage detection if user is logged in
    const accessToken = getBearerToken(request)
    if (accessToken) {
      const supabase = createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser(accessToken)
      
      if (user?.email) {
        const existingOrder = await prisma.order.findFirst({
          where: {
            customerEmail: user.email,
            appliedCouponCode: {
              equals: coupon.name,
              mode: 'insensitive'
            }
          }
        })

        if (existingOrder) {
          return Response.json({ 
            error: `You have already used the coupon code "${coupon.name}". This offer is limited to one use per account.` 
          }, { status: 400 })
        }
      }
    }

    return Response.json({
      ok: true,
      coupon,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Something went wrong while checking the coupon.'

    return Response.json({ error: message }, { status: 500 })
  }
}

