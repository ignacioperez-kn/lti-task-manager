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
  async redirects() {
    return [
      {
        source: '/task/:path*',
        has: [
          {
            type: 'header',
            key: 'Referer',
            value: `^(?!${process.env.NEXT_PUBLIC_TOOL_HOST}|${process.env.PLATFORM_ISS}).*`,
          },
        ],
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
