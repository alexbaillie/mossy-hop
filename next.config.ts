import type { NextConfig } from "next";

// GitHub Pages serves the repo from /mossy-hop/, so that build is a static export
// served from a sub-path. Set GITHUB_PAGES=true to build it; other hosts need neither.
// (The sub-path is applied through Vite's `base` in vite.config.ts, because vinext's
// prerender step 404s when Next's own `basePath` is set.)
const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGitHubPages && { output: "export", images: { unoptimized: true } }),
  env: { NEXT_PUBLIC_BASE_PATH: isGitHubPages ? "/mossy-hop" : "" },
};

export default nextConfig;
