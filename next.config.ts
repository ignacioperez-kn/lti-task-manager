import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        "katjanoponen.moodlecloud.com",
        "lti-task-manager-67832099934.europe-north1.run.app",
      ],
    },
  },

};

export default nextConfig;
