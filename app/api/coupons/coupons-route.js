import { getPrismaClient } from '@/lib/database/nexus-db'
import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { normalizeDecimal, normalizeText } from '@/lib/security/validation'

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

    const coupon = await prisma.coupon.findFirst({
      where: {
        name: {
          equals: normalizeText(code, 64).toUpperCase(),
          mode: 'insensitive',
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        discountPercent: true,
        minOrderValue: true,
        maxUses: true,
        usageCount: true,
        expiresAt: true,
        categorySlug: true,
      },
    })

    if (!coupon) {
      return Response.json({ error: 'Invalid coupon code.' }, { status: 404 })
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return Response.json({ error: 'This coupon has expired.' }, { status: 400 })
    }

    if (coupon.maxUses && coupon.usageCount >= coupon.maxUses) {
      return Response.json({ error: 'This coupon is no longer available.' }, { status: 400 })
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
      coupon: {
        ...coupon,
        minOrderValue: coupon.minOrderValue ? normalizeDecimal(coupon.minOrderValue, { min: 0, fallback: 0 }) : null,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Something went wrong while checking the coupon.'

    return Response.json({ error: message }, { status: 500 })
  }
}

