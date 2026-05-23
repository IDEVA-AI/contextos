import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@contextos/core', '@contextos/db', '@contextos/mcp']
}

export default nextConfig
