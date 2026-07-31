import type { NextConfig } from 'next';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const isStatic = process.env.BUILD_STATIC === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: isStatic ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);

