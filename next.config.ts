import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: false,
    images: {
        remotePatterns: [new URL('https://botghost.com/img/logo-red.png')],
    },
};

export default nextConfig;
