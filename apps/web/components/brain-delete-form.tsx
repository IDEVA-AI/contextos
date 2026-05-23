'use client'

import { useFormStatus } from 'react-dom'
import { deleteBrainAction } from '@/app/actions/brain'

export function BrainDeleteForm({ brainId }: { brainId: string }) {
  return (
    <form action={deleteBrainAction}>
      <input type="hidden" name="brainId" value={brainId} />
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
