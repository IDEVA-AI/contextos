import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { db, schema } from '@contextos/db'
import { verifyPassword } from '@/lib/auth'
import { createSession } from '@/lib/session'

const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1)
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  const { email, password } = parsed.data
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
  }

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })
  }

  await createSession({ userId: user.id, email: user.email })
  return NextResponse.json({ id: user.id, email: user.email })
}
