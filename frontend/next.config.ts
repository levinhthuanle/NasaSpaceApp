import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    // Basic configuration for better WebWorker support
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false
            }
        }
        return config
    }
}
