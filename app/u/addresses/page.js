import ProfileShell from '@/components/profile/ProfileShell'

export default function AddressBookPage() {
  return (
    <ProfileShell
      tools={[]}
      showProfileForm
      showAccountSummary={false}
      initialAddressBookOpen
      autoStartNewAddress
      addressOnlyMode
    />
  )
}
