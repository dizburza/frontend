import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    RPC_URL: process.env.RPC_URL,
    THIRDWEB_CLIENT_ID: process.env.THIRDWEB_CLIENT_ID,
    THIRDWEB_SECRET_KEY: process.env.THIRDWEB_SECRET_KEY,
  },
};

export default nextConfig;
