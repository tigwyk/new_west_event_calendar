import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for Bun runtime
  experimental: {
    // Optimize bundling for Bun
    optimizePackageImports: ["next-auth", "react", "react-dom"],
  },

  // Turbopack configuration (stable in Next.js 15+)
  turbopack: {
    rules: {
      "*.ts": {
        loaders: ["bun"],
      },
      "*.tsx": {
        loaders: ["bun"],
      },
    },
  },

  // Build optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Bundle analyzer for Bun optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimize bundle for production with Bun
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    return config;
  },

  // Output optimization for Vercel + Bun
  output: "standalone",
  
  // Image optimization for Bun
  images: {
    formats: ["image/webp", "image/avif"],
  },

  // Headers for better caching with Bun
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
