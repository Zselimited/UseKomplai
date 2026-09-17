import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Pin the workspace root to this project so Next.js doesn't get
    // confused by an unrelated package-lock.json in the parent (home) folder.
    root: path.join(__dirname),
  },
};

export default nextConfig;
