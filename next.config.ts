import type { NextConfig } from 'next';

const isStatic = process.env.BUILD_STATIC === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: isStatic ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
