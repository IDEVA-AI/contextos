import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  vector
} from 'drizzle-orm/pg-core'

// --- Enums ---

export const scopeTypeEnum = pgEnum('scope_type', [
  'global',
  'workspace',
  'empresa',
  'projeto',
  'cliente',
  'processo',
  'agente',
  'execucao',
  'temporario'
])

export const nodeTypeEnum = pgEnum('node_type', [
  'context_block',
  'persona',
  'rule',
  'memory',
  'document',
  'knowledge',
  'output_template'
])

export const nodeModeEnum = pgEnum('node_mode', ['single', 'multi'])

export const memoryScopeEnum = pgEnum('memory_scope', ['workspace', 'projeto', 'execucao'])

export const documentStatusEnum = pgEnum('document_status', [
  'uploading',
  'indexing',
  'ready',
  'error'
])

// --- Tables ---

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const brains = pgTable('brains', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  currentVersionId: uuid('current_version_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const brainVersions = pgTable('brain_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  brainId: uuid('brain_id')
    .references(() => brains.id, { onDelete: 'cascade' })
    .notNull(),
  snapshot: jsonb('snapshot').notNull(),
  description: text('description'),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const nodes = pgTable('nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  brainId: uuid('brain_id')
    .references(() => brains.id, { onDelete: 'cascade' })
    .notNull(),
  type: nodeTypeEnum('type').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  priority: integer('priority').default(50).notNull(),
  scope: scopeTypeEnum('scope').default('projeto').notNull(),
  tags: jsonb('tags').$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  mode: nodeModeEnum('mode').default('multi').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  positionX: integer('position_x').default(0).notNull(),
  positionY: integer('position_y').default(0).notNull(),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const edges = pgTable('edges', {
  id: uuid('id').primaryKey().defaultRandom(),
  brainId: uuid('brain_id')
    .references(() => brains.id, { onDelete: 'cascade' })
    .notNull(),
  sourceNodeId: uuid('source_node_id')
    .references(() => nodes.id, { onDelete: 'cascade' })
    .notNull(),
  targetNodeId: uuid('target_node_id')
    .references(() => nodes.id, { onDelete: 'cascade' })
    .notNull(),
  label: text('label')
})

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  brainId: uuid('brain_id')
    .references(() => brains.id, { onDelete: 'cascade' })
    .notNull(),
  fileName: text('file_name').notNull(),
  fileRef: text('file_ref').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  status: documentStatusEnum('status').default('uploading').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const knowledgeChunks = pgTable('knowledge_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' })
    .notNull(),
  brainId: uuid('brain_id')
    .references(() => brains.id, { onDelete: 'cascade' })
    .notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  tokens: integer('tokens').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
  tags: jsonb('tags').$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const memories = pgTable('memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  scopeType: memoryScopeEnum('scope_type').notNull(),
  scopeId: uuid('scope_id').notNull(),
  title: text('title'),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
  tags: jsonb('tags').$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  scopes: jsonb('scopes').$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  totalRequests: integer('total_requests').default(0).notNull(),
  revokedAt: timestamp('revoked_at'),
  createdBy: uuid('created_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const executionTraces = pgTable('execution_traces', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  brainId: uuid('brain_id').references(() => brains.id, { onDelete: 'set null' }),
  brainVersionId: uuid('brain_version_id').references(() => brainVersions.id, {
    onDelete: 'set null'
  }),
  apiKeyId: uuid('api_key_id').references(() => apiKeys.id, { onDelete: 'set null' }),
  endpoint: text('endpoint').notNull(),
  requestPayload: jsonb('request_payload').notNull(),
  responsePackageId: text('response_package_id'),
  blocksConsidered: integer('blocks_considered').default(0).notNull(),
  blocksIncluded: integer('blocks_included').default(0).notNull(),
  blocksExcluded: integer('blocks_excluded').default(0).notNull(),
  tokensEstimated: integer('tokens_estimated').default(0).notNull(),
  warnings: jsonb('warnings').$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  statusCode: integer('status_code').notNull(),
  durationMs: integer('duration_ms').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// --- Types inferidos ---

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Workspace = typeof workspaces.$inferSelect
export type Project = typeof projects.$inferSelect
export type Brain = typeof brains.$inferSelect
export type BrainVersion = typeof brainVersions.$inferSelect
export type Node = typeof nodes.$inferSelect
export type NewNode = typeof nodes.$inferInsert
export type Edge = typeof edges.$inferSelect
export type Document = typeof documents.$inferSelect
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect
export type Memory = typeof memories.$inferSelect
export type ApiKey = typeof apiKeys.$inferSelect
export type ExecutionTrace = typeof executionTraces.$inferSelect
