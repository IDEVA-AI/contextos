import { cookies } from 'next/headers'
import {
  createSessionToken,
  verifySessionToken,
  type SessionPayload
} from './auth'

export const SESSION_COOKIE = 'contextos_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 dias

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload)
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE
  })
}

export async function destroySession(): Promise<void> {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}
