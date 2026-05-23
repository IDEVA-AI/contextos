'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { type CreateBrainState, createBrainAction } from '@/app/actions/brain'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function BrainCreateForm({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState<CreateBrainState, FormData>(
    createBrainAction,
    null
  )

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <Input
        name="name"
        required
        maxLength={80}
        placeholder="Novo cérebro..."
        className="h-8 text-xs"
      />
      <SubmitButton />
      {state?.error && (
        <span className="text-[10px] text-red-600">{state.error}</span>
      )}
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="brand" size="sm" disabled={pending}>
      {pending ? '...' : '+ criar'}
    </Button>
  )
}
