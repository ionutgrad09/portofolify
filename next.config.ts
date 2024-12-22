import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    transpilePackages: ['@mui/x-charts']
};

export default nextConfig;

module.exports = {
    reactStrictMode: true,
    transpilePackages: ['@mui/x-charts'],
};