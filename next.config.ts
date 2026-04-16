import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  }
};

export default nextConfig;
