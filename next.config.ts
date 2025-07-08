import withPWA from "next-pwa";

const withPWAWrapped = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  swSrc: "public/sw.js",
});

const nextConfig: import("next").NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default withPWAWrapped(nextConfig);
