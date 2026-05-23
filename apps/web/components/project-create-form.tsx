'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import {
  type CreateProjectState,
  createProjectAction
} from '@/app/actions/project'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ProjectCreateForm({ workspaceId }: { workspaceId: string }) {
  const [state, formAction] = useActionState<CreateProjectState, FormData>(
    createProjectAction,
    null
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    // Limpa form depois de criar com sucesso (sem erro retornado)
    if (state === null) {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="floating-panel p-4 space-y-3">
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="proj-name">Novo projeto</Label>
          <Input
            id="proj-name"
            name="name"
            required
            maxLength={80}
            placeholder="Nome do projeto"
          />
        </div>
        <SubmitButton />
      </div>

      {state?.error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {state.error}
        </div>
      )}
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="brand" disabled={pending}>
      {pending ? 'Criando...' : 'Criar'}
    </Button>
  )
}
