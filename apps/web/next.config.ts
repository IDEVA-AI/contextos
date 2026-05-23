import { resolve } from 'node:path'
import type { NextConfig } from 'next'

const monorepoRoot = resolve(import.meta.dirname, '../../')

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ['@contextos/core', '@contextos/db', '@contextos/mcp'],
  turbopack: {
    root: monorepoRoot
  }
}

export default nextConfig
