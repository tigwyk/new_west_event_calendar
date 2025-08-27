import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration (now stable)
  turbopack: {
    rules: {
      // Optimize CSS handling
      "*.css": ["css-loader", "postcss-loader"],
      // Optimize TypeScript compilation
      "*.ts": {
        loaders: ["swc-loader"],
        as: "*.js",
      },
      "*.tsx": {
        loaders: ["swc-loader"],
        as: "*.js",
      },
    },
    resolveAlias: {
      // Optimize common imports for Turbopack
      "@": "./src",
      "@components": "./src/components",
      "@utils": "./src/utils",
      "@types": "./src/types",
    },
  },

  // Experimental features
  experimental: {
    // Optimize package imports for both Turbopack and Bun
    optimizePackageImports: ["next-auth", "react", "react-dom"],
  },

  // Server external packages (removed due to Turbopack conflict)

  // Build optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Image optimization 
  images: {
    formats: ["image/webp", "image/avif"],
  },

  // Security headers
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
