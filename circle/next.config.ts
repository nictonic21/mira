import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo root also has a lockfile (the Mira app) — pin this app's root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
