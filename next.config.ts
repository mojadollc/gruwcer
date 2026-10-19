import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  serverExternalPackages: [
    "pg", "pg-native", "pgpass", "pg-connection-string",
    "@prisma/client", "@prisma/adapter-pg",
    "bcryptjs", "jsonwebtoken", "firebase-admin"
  ],
}

export default nextConfig
