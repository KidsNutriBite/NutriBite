import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
  turbopack: {
    root: __dirname,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ignored: [
          /node_modules/,
          /backend/,
          /ai-service/,
          /ai-service-v2/,
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
