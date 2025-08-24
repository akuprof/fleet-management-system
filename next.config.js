/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for server-side functionality
  images: {
    unoptimized: true
  },
  // Configure path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
};

module.exports = nextConfig;
