import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/mcd",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
