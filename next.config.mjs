/** @type {import('next').NextConfig} */
// Fixed Vercel deployment - routes-manifest.json generation
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: process.env.VERCEL ? true : false,
  },
  experimental: {
    // Force generation of routes manifest
    appDocumentPreloading: true,
  },
  // Explicitly enable standalone output for Vercel
  output: process.env.VERCEL ? undefined : 'standalone',
  images: {
    // unoptimized: true, // Commented out to test deployment fix
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

export default nextConfig
