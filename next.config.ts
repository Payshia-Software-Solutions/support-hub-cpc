
import type {NextConfig} from 'next';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://chat-server.pharmacollege.lk/api';
const apiHostname = new URL(apiBaseUrl).hostname;

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: apiHostname,
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'qa-api.pharmacollege.lk',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
