/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  basePath: '/ec_ccs',
  trailingSlash: false,  // 强制所有URL不添加末尾斜杠
  async redirects() {
    return [
      {
        source: '/ec_ccs',       // 匹配无斜杠的请求
        destination: '/ec_ccs/',  // 重定向到有斜杠的路径
        permanent: true,          // 使用301状态码
      }
    ]
  },
  experimental: {
    serverActions: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig; 