'use client'

import { useFormStatus } from 'react-dom'
import { deleteMemoryAction } from '@/app/actions/memory'

export function MemoryDeleteForm({
  memoryId,
  workspaceId
}: {
  memoryId: string
  workspaceId: string
}) {
  return (
    <form action={deleteMemoryAction}>
      <input type="hidden" name="memoryId" value={memoryId} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <DeleteButton />
    </form>
  )
}

function DeleteButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mono text-[10px] text-zinc-400 hover:text-red-600 disabled:opacity-50 transition-colors"
    >
      {pending ? '...' : 'apagar'}
    </button>
  )
}
