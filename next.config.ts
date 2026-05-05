import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/openclaw-dashboard',
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
