/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  // Force API endpoints to use Node.js runtime
  serverRuntimeConfig: {
    apiRuntimeOverride: 'nodejs',
  }
};

module.exports = nextConfig; 