'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  type CreateWorkspaceState,
  createWorkspaceAction
} from '@/app/actions/workspace'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function WorkspaceCreateForm() {
  const [state, formAction] = useActionState<CreateWorkspaceState, FormData>(
    createWorkspaceAction,
    null
  )

  return (
    <form action={formAction} className="floating-panel p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Novo workspace</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Um espaço de trabalho contém projetos e cérebros.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ws-name">Nome</Label>
        <Input
          id="ws-name"
          name="name"
          required
          maxLength={80}
          placeholder="Ex: Acme · operação comercial"
        />
      </div>

      {state?.error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="brand" disabled={pending} className="w-full">
      {pending ? 'Criando...' : 'Criar workspace'}
    </Button>
  )
}
