import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for Bun runtime
  experimental: {
    // Optimize bundling for Bun
    optimizePackageImports: ["next-auth", "react", "react-dom"],
  },


  // Build optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Output optimization for Vercel (removed standalone for compatibility)
  // output: "standalone", // Disabled due to deployment issues
  
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
