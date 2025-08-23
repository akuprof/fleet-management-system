/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for server-side functionality
  images: {
    unoptimized: true
  },
  // Disable static optimization to prevent build-time Supabase client creation
  experimental: {
    isrMemoryCacheSize: 0,
  }
};

module.exports = nextConfig;
