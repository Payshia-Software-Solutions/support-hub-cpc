
import type {NextConfig} from 'next';

const chatServerUrl = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'https://chat-server.pharmacollege.lk';
const lmsServerUrl = process.env.NEXT_PUBLIC_LMS_SERVER_URL || 'https://qa-api.pharmacollege.lk';
const contentProviderHostname = "content-provider.pharmacollege.lk";

const chatServerHostname = new URL(chatServerUrl).hostname;
const lmsServerHostname = new URL(lmsServerUrl).hostname;


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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: chatServerHostname,
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
        hostname: lmsServerHostname,
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: contentProviderHostname,
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'chart.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
