import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production'
const contentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://checkout.razorpay.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://wqnjxafgzldzqpazzxaw.supabase.co https://lh3.googleusercontent.com https://images.unsplash.com https://plus.unsplash.com;
  font-src 'self' data:;
  connect-src 'self' https://wqnjxafgzldzqpazzxaw.supabase.co https://*.supabase.co https://api.razorpay.com;
  frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim()

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wqnjxafgzldzqpazzxaw.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/products', destination: '/p', permanent: true },
      { source: '/products/:path*', destination: '/p/:path*', permanent: true },
      { source: '/active-orders', destination: '/o', permanent: true },
      { source: '/profile', destination: '/u', permanent: true },
      { source: '/portal', destination: '/h', permanent: true },
      { source: '/dashboard', destination: '/d', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  }
};

export default nextConfig;
