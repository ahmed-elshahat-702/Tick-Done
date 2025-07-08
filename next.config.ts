import withPWA from "next-pwa";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const baseConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

const withPWAWrapped = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: isDev,

  importScripts: ["/custom-sw-events.js"],

  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-webfonts",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default withPWAWrapped(baseConfig as any);
