import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/console", destination: "/sample", permanent: false },
      { source: "/console/:id", destination: "/sample/:id", permanent: false },
    ];
  },
};

export default nextConfig;
