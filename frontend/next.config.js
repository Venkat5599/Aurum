/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
    };
    
    // Ignore pino-pretty optional dependency
    config.externals.push('pino-pretty');
    
    return config;
  },
};

module.exports = nextConfig;
