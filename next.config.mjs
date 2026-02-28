/** @type {import('next').NextConfig} */
const nextConfig = {
    // Allow native modules like better-sqlite3 in API routes
    experimental: {
        serverComponentsExternalPackages: ["better-sqlite3"],
    },
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Don't bundle native modules
            config.externals.push("better-sqlite3");
        }
        return config;
    },
};

export default nextConfig;
