import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: "http://campusgigs.infy.click/api/:path*",
      },
    ];
  },
};

export default nextConfig;
