'use client'

import { useFormStatus } from 'react-dom'
import { deleteProjectAction } from '@/app/actions/project'

export function ProjectDeleteForm({ projectId }: { projectId: string }) {
  return (
    <form action={deleteProjectAction}>
      <input type="hidden" name="projectId" value={projectId} />
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
      {pending ? 'apagando...' : 'apagar'}
    </button>
  )
}
