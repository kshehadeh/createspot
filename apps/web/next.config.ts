import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import { withWorkflow } from "workflow/next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  cacheComponents: true,
  transpilePackages: ["@createspot/ui-primitives"],
  async redirects() {
    return [
      {
        source: "/inspire/prompt",
        destination: "/inspire/exhibition",
        permanent: true,
      },
      {
        source: "/inspire/prompt/:path*",
        destination: "/inspire/exhibition",
        permanent: true,
      },
      {
        source: "/inspire/museums",
        destination: "/inspire/exhibition",
        permanent: true,
      },
      {
        source: "/inspire/museums/:path*",
        destination: "/inspire/exhibition",
        permanent: true,
      },
      {
        source: "/admin/prompts",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/admin/prompts/:path*",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/about/prompt-submissions",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/about/prompt-submissions/:path*",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/about/purpose",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/about/purpose/:path*",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/about/features",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/about/features/:path*",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/about/museums",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/about/museums/:path*",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/about/portfolio",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/about/portfolio/:path*",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/about/critiques",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/about/critiques/:path*",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/about/protecting-your-work",
        destination: "/about#protecting-your-work",
        permanent: true,
      },
      {
        source: "/about/protecting-your-work/:path*",
        destination: "/about#protecting-your-work",
        permanent: true,
      },
    ];
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@icons-pack/react-simple-icons",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "prompts.karim.cloud",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },
  // Prevent Next.js from bundling pdfkit to allow it to access font files
  serverExternalPackages: ["pdfkit"],
};

export default withSentryConfig(withWorkflow(withNextIntl(nextConfig)), {
  org: process.env.SENTRY_ORG ?? "___ORG_SLUG___",
  project: process.env.SENTRY_PROJECT ?? "___PROJECT_SLUG___",

  authToken: process.env.SENTRY_AUTH_TOKEN,

  widenClientFileUpload: true,

  tunnelRoute: "/monitoring",

  silent: !process.env.CI,
});
