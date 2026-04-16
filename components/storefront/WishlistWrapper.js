import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { getPrismaClient } from '@/lib/database/nexus-db'

export default async function WishlistWrapper({ children }) {
  const prisma = getPrismaClient()
  let wishlistedIds = []

  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { authUserId: user.id },
        select: { id: true }
      })
      
      if (dbUser) {
        const items = await prisma.wishlistItem.findMany({
          where: { userId: dbUser.id },
          select: { productId: true }
        })
        wishlistedIds = items.map(i => i.productId)
      }
    }
  } catch (e) {
    console.warn('Wishlist fetch deferred or failed')
  }

  // Pass the wishlistedIds to children via a clone element or just use a context if complex
  // But since we are in a simple server component tree, we can just return the children
  // Actually, simpler: just return the ids as a prop if we were using it in a client component.
  // BUT this is for SSR.
  
  // Revised approach: I'll make the components that need wishlistedIds accept them.
  return children(wishlistedIds)
}
