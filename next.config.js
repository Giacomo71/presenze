/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow remote device (e.g., 192.168.1.160) to access dev server resources
  allowedDevOrigins: ['192.168.1.160'],
  // Optionally expose env vars to client if needed
  // env: {
  //   ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  // },
};

module.exports = nextConfig;
