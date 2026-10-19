import type { NextConfig } from "next"
import os from "os"
import path from "path"

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  serverExternalPackages: [
    "pg", "pg-native", "pgpass", "pg-connection-string",
    "@prisma/client", "@prisma/adapter-pg",
    "bcryptjs", "jsonwebtoken", "firebase-admin"
  ],
  experimental: {
    turbo: {
      resolveAlias: {},
    },
  },
export default nextConfig
