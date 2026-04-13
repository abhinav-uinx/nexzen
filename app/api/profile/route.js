import { NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/database/nexus-db'
import { getAppUserForRequest } from '@/lib/auth/user-session'

export async function GET(request) {
  try {
    const { appUser } = await getAppUserForRequest(request)
    if (!appUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = getPrismaClient()
    const profile = await prisma.user.findUnique({
      where: { id: appUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        pincode: true,
        savedUpiId: true,
      }
    })

    return NextResponse.json({ profile })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { appUser } = await getAppUserForRequest(request)
    if (!appUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phone, addressLine1, addressLine2, city, state, pincode, savedUpiId } = await request.json()
    const prisma = getPrismaClient()

    const updatedUser = await prisma.user.update({
      where: { id: appUser.id },
      data: {
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        savedUpiId,
      }
    })

    return NextResponse.json({ ok: true, profile: updatedUser })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
