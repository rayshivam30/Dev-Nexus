import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// ── Content Security Policy ──────────────────────────────────────────────────
// Production: strict, enumerate only the domains we actually use.
// Development: permissive so HMR, eval-based source maps, and dev tools work.
const cspHeader = isProd
  ? `
    default-src 'self';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://i.natgeofe.com https://images.unsplash.com https://res.cloudinary.com https://github.com https://avatars.githubusercontent.com;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src 'self';
    upgrade-insecure-requests;
`
  : `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http:;
    style-src 'self' 'unsafe-inline' https: http:;
    img-src 'self' blob: data: https://i.natgeofe.com https://images.unsplash.com https://res.cloudinary.com https://github.com https://avatars.githubusercontent.com;
    font-src 'self' data: https: http:;
    connect-src 'self' https: http: ws: wss:;
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://github.com;
    frame-ancestors 'none';
    frame-src 'self' https://github.com;
`;

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.natgeofe.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
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
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

