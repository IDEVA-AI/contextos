'use client'

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { type DragEvent, useCallback, useMemo, useRef, useState } from 'react'

import { CompilePanel } from './compile-panel'
import { ContextNode } from './context-node'
import { DocumentsPanel } from './documents-panel'
import { NodePalette, type PaletteDragPayload } from './node-palette'
import { PropertiesPanel } from './properties-panel'
import { SaveIndicator } from './save-indicator'
import { useAutoSave } from './use-autosave'
import { VersionsPanel } from './versions-panel'
import type { CanvasEdge, CanvasNode, CanvasNodeData } from '@/lib/node'

const NODE_TYPES = {
  context_block: ContextNode,
  persona: ContextNode,
  rule: ContextNode,
  memory: ContextNode,
  document: ContextNode,
  knowledge: ContextNode,
  output_template: ContextNode
} as const

type Props = {
  brainId: string
  workspaceId: string
  initialNodes: CanvasNode[]
  initialEdges: CanvasEdge[]
}

function CanvasInner({ brainId, workspaceId, initialNodes, initialEdges }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<CanvasEdge>(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const rf = useReactFlow()

  const { status, lastSavedAt } = useAutoSave({ brainId, nodes, edges })

  const onConnect = useCallback(
    (conn: Connection) => {
      setEdges((eds) =>
        addEdge<CanvasEdge>({ ...conn, id: `e-${crypto.randomUUID()}` }, eds)
      )
    },
    [setEdges]
  )

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const raw = event.dataTransfer.getData('application/contextos-node')
      if (!raw) return
      const payload = JSON.parse(raw) as PaletteDragPayload
      const position = rf.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      })
      const newId = crypto.randomUUID()
      const newNode: CanvasNode = {
        id: newId,
        type: payload.type,
        position,
        data: {
          title: payload.label,
          content: null,
          priority: payload.defaultPriority,
          scope: 'projeto',
          tags: [],
          mode: payload.defaultMode,
          enabled: true,
          metadata: {}
        }
      }
      setNodes((nds) => [...nds, newNode])
      setSelectedNodeId(newId)
    },
    [rf, setNodes]
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<CanvasNodeData>) => {
      setSelectedNodeId(node.id)
    },
    []
  )

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  const updateNodeData = useCallback(
    (nodeId: string, patch: Partial<CanvasNodeData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n
        )
      )
    },
    [setNodes]
  )

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId))
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      )
      setSelectedNodeId(null)
    },
    [setNodes, setEdges]
  )

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  )

  const nodeTypes = useMemo(() => NODE_TYPES, [])

  return (
    <div ref={wrapperRef} className="w-full h-full relative">
      <NodePalette />
      <SaveIndicator status={status} lastSavedAt={lastSavedAt} />
      <VersionsPanel brainId={brainId} />
      <DocumentsPanel brainId={brainId} />
      <CompilePanel brainId={brainId} workspaceId={workspaceId} />
      <PropertiesPanel
        node={selectedNode}
        onChange={updateNodeData}
        onDelete={deleteNode}
        onClose={() => setSelectedNodeId(null)}
      />
      <ReactFlow<CanvasNode, CanvasEdge>
        nodes={nodes as Node<CanvasNode['data']>[]}
        edges={edges as Edge[]}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes as unknown as Record<string, typeof ContextNode>}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          style: { stroke: '#a1a1aa', strokeWidth: 1.5, strokeDasharray: '6 4' },
          animated: true
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="rgba(0,0,0,0.08)"
        />
        <Controls
          className="!shadow-none !border !border-zinc-200 !bg-white/90 !backdrop-blur"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-white/90 !backdrop-blur !border !border-zinc-200 !rounded-lg"
          nodeColor="#a1a1aa"
          maskColor="rgba(250, 250, 247, 0.6)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  )
}

export function CanvasEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}
