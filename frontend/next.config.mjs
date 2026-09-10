/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    allowedDevOrigins: ["10.181.68.50:3000", "localhost:3000"]
  }
};

export default nextConfig;