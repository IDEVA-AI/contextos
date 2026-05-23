'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import {
  type CreateMemoryState,
  createMemoryAction
} from '@/app/actions/memory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Scope = {
  type: 'workspace' | 'projeto'
  id: string
  label: string
}

export function MemoryCreateForm({
  workspaceId,
  scopes,
  defaultScopeId
}: {
  workspaceId: string
  scopes: Scope[]
  defaultScopeId?: string
}) {
  const [state, formAction] = useActionState<CreateMemoryState, FormData>(
    createMemoryAction,
    null
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state === null) {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="floating-panel p-5 space-y-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <div>
        <h2 className="text-base font-semibold">Nova memória</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Lembranças, decisões, aprendizados — recuperáveis por busca semântica.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="mem-scope">Escopo</Label>
          <select
            id="mem-scope"
            name="scopeId"
            defaultValue={defaultScopeId}
            required
            className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            onChange={(e) => {
              const selected = scopes.find((s) => s.id === e.target.value)
              const typeInput = e.currentTarget.form?.elements.namedItem(
                'scopeType'
              ) as HTMLInputElement | null
              if (typeInput && selected) typeInput.value = selected.type
            }}
          >
            {scopes.map((s) => (
              <option key={`${s.type}:${s.id}`} value={s.id} data-type={s.type}>
                {s.type === 'workspace' ? '⚙️ ' : '📁 '}
                {s.label}
              </option>
            ))}
          </select>
          <input
            type="hidden"
            name="scopeType"
            defaultValue={
              defaultScopeId
                ? scopes.find((s) => s.id === defaultScopeId)?.type ??
                  scopes[0]?.type ??
                  'workspace'
                : scopes[0]?.type ?? 'workspace'
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mem-title">Título (opcional)</Label>
          <Input
            id="mem-title"
            name="title"
            maxLength={200}
            placeholder="Ex: Objeção de prazo"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mem-content">Conteúdo</Label>
        <Textarea
          id="mem-content"
          name="content"
          required
          rows={4}
          maxLength={8000}
          placeholder="Ex: Cliente Delta rejeitou proposta anterior por prazo de 6 meses. Aceitou 3 meses na segunda tentativa."
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
      {pending ? 'Salvando...' : 'Criar memória'}
    </Button>
  )
}
