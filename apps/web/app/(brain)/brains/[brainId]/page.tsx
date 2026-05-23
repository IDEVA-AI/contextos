import Link from 'next/link'
import { redirect } from 'next/navigation'

import { CanvasEditor } from '@/components/canvas/canvas-editor'
import { getBrainByIdForUser } from '@/lib/brain'
import { requireSession } from '@/lib/guards'
import { listEdgesForBrain, listNodesForBrain } from '@/lib/node'

export default async function BrainEditorPage({
  params
}: {
  params: Promise<{ brainId: string }>
}) {
  const { brainId } = await params
  const session = await requireSession()
  const brain = await getBrainByIdForUser(brainId, session.userId)
  if (!brain) redirect('/dashboard')

  const [nodes, edges] = await Promise.all([
    listNodesForBrain(brain.id),
    listEdgesForBrain(brain.id)
  ])

  return (
    <div className="h-screen flex flex-col canvas-paper">
      <header className="h-12 border-b border-zinc-200/70 px-4 flex items-center justify-between gap-3 bg-white/90 backdrop-blur z-10">
        <div className="flex items-center gap-2 min-w-0 text-xs">
          <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-900">
            dashboard
          </Link>
          <span className="text-zinc-300">/</span>
          <Link
            href={`/workspaces/${brain.workspaceId}`}
            className="text-zinc-500 hover:text-zinc-900 truncate"
          >
            {brain.workspaceName}
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-500 truncate">{brain.projectName}</span>
          <span className="text-zinc-300">/</span>
          <span className="font-medium truncate text-zinc-900">{brain.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="mono text-[10px] text-zinc-400">
            {nodes.length} nós · {edges.length} edges
          </span>
        </div>
      </header>
      <div className="flex-1 relative">
        <CanvasEditor
          brainId={brain.id}
          initialNodes={nodes}
          initialEdges={edges}
        />
      </div>
    </div>
  )
}
