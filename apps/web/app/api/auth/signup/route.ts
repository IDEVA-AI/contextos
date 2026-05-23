import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { db, schema } from '@contextos/db'
import { hashPassword } from '@/lib/auth'
import { createSession } from '@/lib/session'

const SignupSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8, 'Senha precisa ter pelo menos 8 caracteres'),
  name: z.string().min(1).optional()
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = SignupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', details: z.flattenError(parsed.error) },
      { status: 400 }
    )
  }

  const { email, password, name } = parsed.data

  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json({ error: 'email_taken' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  const [user] = await db
    .insert(schema.users)
    .values({ email, passwordHash, name: name ?? null })
    .returning({ id: schema.users.id, email: schema.users.email })

  if (!user) {
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }

  await createSession({ userId: user.id, email: user.email })

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}
