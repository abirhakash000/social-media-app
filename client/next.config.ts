import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Supabase থেকে ছবি অনুমোদিত
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app', // Vercel থেকে ছবি অনুমোদিত
      },
      {
        protocol: 'https',
        hostname: '*.railway.app', // Railway থেকে ছবি অনুমোদিত
      },
    ],
  },
  output: 'standalone',
};

export default nextConfig;