import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/supabase-proxy/:path*",
        destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/:path*`, // Proxy to Supabase
      },
    ];
  },
  experimental: {
    middlewareClientMaxBodySize: "100mb"
  }
};

export default nextConfig;
