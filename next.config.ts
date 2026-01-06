import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // tolérant, utile en dev
    domains: ["localhost", "127.0.0.1"],

    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/images/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;