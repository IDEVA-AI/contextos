import { config } from 'dotenv'
import { resolve } from 'node:path'
import { defineConfig } from 'drizzle-kit'

// Carrega .env.local da raiz do mono-repo (cwd = packages/db quando rodado via pnpm filter)
config({ path: resolve(process.cwd(), '../../.env.local') })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required (configure .env.local na raiz do repo)')
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL
  },
  verbose: true,
  strict: true
})
