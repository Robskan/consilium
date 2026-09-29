import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: false,
    experimental: {
        serverActions: {
            bodySizeLimit: '500mb',
        },
    },
};

export default nextConfig;
