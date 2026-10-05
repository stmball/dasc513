import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages serves the generated files as a static site.
  output: "export",
  // Emit nested routes as directories with index.html so direct visits work
  // on static hosts without rewrite rules.
  trailingSlash: true,
};

export default nextConfig;
