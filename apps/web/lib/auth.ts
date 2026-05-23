import bcrypt from 'bcrypt'
import { SignJWT, jwtVerify } from 'jose'

const BCRYPT_COST = 12
const TOKEN_TTL = '7d'

export type SessionPayload = {
  userId: string
  email: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is required')
  if (secret.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters')
  }
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (typeof payload.userId !== 'string' || typeof payload.email !== 'string') {
      return null
    }
    return { userId: payload.userId, email: payload.email }
  } catch {
    return null
  }
}
