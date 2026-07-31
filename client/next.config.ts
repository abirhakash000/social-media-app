import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost', 'vercel.app', 'supabase.co'],
  },
  output: 'standalone',
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;