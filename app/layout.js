import './globals.css'
import Footer from '@/components/storefront/Footer'
import Navbar from '@/components/storefront/Navbar'
import { AuthProvider } from '@/providers/AuthProvider'
import { CartProvider } from '@/providers/CartProvider'

export const metadata = {
  title: 'Nexzen | Modern Electronics Storefront',
  description:
    'Nexzen is a modern electronics shopping experience for maker kits, development boards, sensors, and rapid prototyping gear.',
  icons: {
    icon: 'https://wqnjxafgzldzqpazzxaw.supabase.co/storage/v1/object/public/brand-assets/smiplelogo.png',
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_25%,#f8fafc_100%)]">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
