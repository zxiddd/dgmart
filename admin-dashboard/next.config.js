/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'prvhnlamrknodwxuswyv.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com', // Keep for legacy if needed, or remove
                port: '',
                pathname: '/**',
            },
        ],
    },
}

module.exports = nextConfig
