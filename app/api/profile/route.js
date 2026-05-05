import { NextResponse } from 'next/server'
import { getAppUserForRequest } from '@/lib/auth/user-session'
import { isValidIndianPincode, isValidPhoneNumber, normalizeText } from '@/lib/security/validation'
import { normalizeSavedAddresses } from '@/lib/profile/addresses'
import { getUserProfileSnapshot, updateUserProfileSnapshot } from '@/lib/profile/persistence'

export async function GET(request) {
  try {
    const { appUser } = await getAppUserForRequest(request)
    if (!appUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfileSnapshot(appUser.id)

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

    const { phone, addressLine1, addressLine2, city, state, pincode, savedUpiId, savedAddresses } = await request.json()
    const normalizedPhone = normalizeText(phone, 20)
    const normalizedPincode = normalizeText(pincode, 6)
    const normalizedAddresses = normalizeSavedAddresses(savedAddresses)

    if (normalizedPhone && !isValidPhoneNumber(normalizedPhone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    if (normalizedPincode && !isValidIndianPincode(normalizedPincode)) {
      return NextResponse.json({ error: 'Invalid pincode' }, { status: 400 })
    }

    const updatedUser = await updateUserProfileSnapshot(appUser.id, {
      phone: normalizedPhone || null,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode: normalizedPincode || null,
      savedAddresses: normalizedAddresses,
      savedUpiId,
    })

    return NextResponse.json({ ok: true, profile: updatedUser })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
