'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function UserMenu({ email }: { email: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const initial = email.charAt(0).toUpperCase()

  return (
    <div className="border-t border-zinc-100 p-3 flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
        style={{ background: '#C5F432', color: '#0a0a0a' }}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{email}</div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="mono text-[10px] text-zinc-500 hover:text-zinc-900 disabled:opacity-50"
        >
          {loading ? 'saindo...' : 'sair'}
        </button>
      </div>
    </div>
  )
}
