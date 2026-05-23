'use client'

import { useFormStatus } from 'react-dom'
import { revokeApiKeyAction } from '@/app/actions/api-key'

export function ApiKeyRevokeForm({
  keyId,
  workspaceId
}: {
  keyId: string
  workspaceId: string
}) {
  return (
    <form
      action={revokeApiKeyAction}
      onSubmit={(e) => {
        if (!confirm('Revogar chave? Esta ação não pode ser desfeita.')) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="keyId" value={keyId} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <RevokeButton />
    </form>
  )
}

function RevokeButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mono text-[10px] text-zinc-400 hover:text-red-600 disabled:opacity-50 transition-colors"
    >
      {pending ? '...' : 'revogar'}
    </button>
  )
}
