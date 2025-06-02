import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'avatar.vercel.sh', 
      'i.imgur.com',
      'res.cloudinary.com',
      'imagedelivery.net',
      'gateway.pinata.cloud',
      'i.seadn.io',
      'openseauserdata.com',
      'arweave.net',
      'ipfs.io',
      'media.firefly.land',
      'ipfs.decentralized-content.com',
      'nft.orivium.io'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.imagedelivery.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.seadn.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'openseauserdata.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'arweave.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.firefly.land',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.decentralized-content.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'nft.orivium.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
