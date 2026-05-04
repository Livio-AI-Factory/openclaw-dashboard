/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/openclaw-dashboard',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
