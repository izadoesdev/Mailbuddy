/** @type {import('next').NextConfig} */
const nextConfig = {
    sassOptions: {
        compiler: "modern",
        silenceDeprecations: ["legacy-js-api"],
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
};

export default nextConfig;
