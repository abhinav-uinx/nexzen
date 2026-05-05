import { redirect } from 'next/navigation'

export default async function LegacySearchSlugPage() {
  redirect('/search')
}
