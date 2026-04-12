import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database/prisma'
import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { syncAuthenticatedUser } from '@/lib/auth/user-auth'

function getBearerToken(request) {
  const authorization = request.headers.get('authorization') || ''
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return null
  }
  return authorization.slice(7).trim()
}

async function getAppUserForRequest(request) {
  const accessToken = getBearerToken(request)
  if (!accessToken) return null

  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  
  if (error || !user) return null

  const appUser = await syncAuthenticatedUser({
    user,
    accessToken,
    provider: user.app_metadata?.provider,
    expiresAt: null,
  })

  return appUser
}

export async function POST(request) {
  try {
    const dbUser = await getAppUserForRequest(request)
    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, rating, comment, images } = body

    if (!productId || rating === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Upsert or Create a review for uniqueness constraint if desired, but we'll just create.
    const review = await prisma.review.create({
      data: {
        productId,
        userId: dbUser.id,
        rating: Math.min(5, Math.max(1, parseInt(rating))), // clamp between 1 and 5
        comment,
        images: images || [],
      },
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
          }
        }
      }
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId parameter' }, { status: 400 })
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
          }
        }
      }
    })

    return NextResponse.json({ reviews }, { status: 200 })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
