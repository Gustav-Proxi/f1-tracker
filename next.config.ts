import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.formula1.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      // Add any other domains if your images or driver headshots come from elsewhere
    ],
  },
};

export default nextConfig;
