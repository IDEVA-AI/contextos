import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db, schema } from '@contextos/db'
import { getCurrentSession } from '@/lib/session'

export async function GET() {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const [user] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      createdAt: schema.users.createdAt
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
  }

  return NextResponse.json(user)
}
