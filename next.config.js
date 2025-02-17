/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          fs: false,
          dns: false,
          net: false,
          tls: false,
        };
      }
      return config;
    },
  };
  
  module.exports = nextConfig;
  