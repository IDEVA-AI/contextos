import { readFile, stat } from 'node:fs/promises'
import { basename, extname, resolve } from 'node:path'

import { Command } from 'commander'

import { apiRequest } from '../lib/client.js'
import { getActiveProfile, loadConfig } from '../lib/config.js'
import {
  bold,
  brand,
  dim,
  formatDate,
  handleError,
  info,
  printJson,
  shortId,
  table
} from '../lib/output.js'

type ListOptions = {
  profile?: string
  json?: boolean
}

type UploadOptions = {
  profile?: string
  json?: boolean
}

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.md': 'text/markdown',
  '.txt': 'text/plain'
}

async function list(brainId: string, options: ListOptions) {
  const config = await loadConfig()
  let profile
  try {
    profile = getActiveProfile(config, options.profile)
  } catch (err) {
    handleError(err)
  }
  try {
    const data = await apiRequest<{
      brain_id: string
      documents: Array<{
        id: string
        file_name: string
        mime_type: string
        size_bytes: number
        status: string
        chunk_count: number
        created_at: string
      }>
      total: number
    }>(profile, {
      method: 'GET',
      path: `/v1/documents?brain_id=${encodeURIComponent(brainId)}`
    })
    if (options.json) {
      printJson(data)
      return
    }
    console.log(bold(`Documentos (${data.total})`))
    table(
      data.documents.map((d) => ({
        id: shortId(d.id),
        name: d.file_name,
        mime: d.mime_type,
        size: formatBytes(d.size_bytes),
        chunks: d.chunk_count,
        status: d.status,
        created: formatDate(d.created_at)
      })),
      [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'ARQUIVO' },
        { key: 'mime', label: 'MIME' },
        { key: 'size', label: 'TAMANHO' },
        { key: 'chunks', label: 'CHUNKS' },
        { key: 'status', label: 'STATUS' },
        { key: 'created', label: 'CRIADO' }
      ]
    )
  } catch (err) {
    handleError(err)
  }
}

async function upload(brainId: string, file: string, options: UploadOptions) {
  const config = await loadConfig()
  let profile
  try {
    profile = getActiveProfile(config, options.profile)
  } catch (err) {
    handleError(err)
  }
  const absPath = resolve(file)
  let info_stat
  try {
    info_stat = await stat(absPath)
  } catch {
    handleError(new Error(`Arquivo não encontrado: ${absPath}`))
  }
  if (!info_stat.isFile()) {
    handleError(new Error(`Não é arquivo: ${absPath}`))
  }
  const ext = extname(absPath).toLowerCase()
  const mime = MIME_BY_EXT[ext]
  if (!mime) {
    handleError(
      new Error(`Extensão não suportada: ${ext || '(sem extensão)'} — use .pdf .md .txt`)
    )
  }

  const buf = await readFile(absPath)
  const blob = new Blob([new Uint8Array(buf)], { type: mime })
  const fd = new FormData()
  fd.append('brain_id', brainId)
  fd.append('file', blob, basename(absPath))

  try {
    const data = await apiRequest<{
      id: string
      file_name: string
      mime_type: string
      size_bytes: number
      status: string
      created_at: string
    }>(profile, {
      method: 'POST',
      path: '/v1/documents',
      body: fd
    })
    if (options.json) {
      printJson(data)
      return
    }
    table(
      [
        {
          id: shortId(data.id),
          name: data.file_name,
          size: formatBytes(data.size_bytes),
          status: data.status
        }
      ],
      [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'ARQUIVO' },
        { key: 'size', label: 'TAMANHO' },
        { key: 'status', label: 'STATUS' }
      ]
    )
    info(`Worker indexa em background. ${dim(`Cheque com: contextos docs list ${shortId(brainId)}`)}`)
  } catch (err) {
    handleError(err)
  }
}

async function deleteDoc(documentId: string, options: { profile?: string }) {
  const config = await loadConfig()
  let profile
  try {
    profile = getActiveProfile(config, options.profile)
  } catch (err) {
    handleError(err)
  }
  try {
    await apiRequest(profile, {
      method: 'DELETE',
      path: `/v1/documents/${encodeURIComponent(documentId)}`
    })
    console.log(`${brand('✓')} Documento ${shortId(documentId)} removido.`)
  } catch (err) {
    handleError(err)
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export function registerDocsCommands(program: Command): void {
  const cmd = program.command('docs').description('Documentos do cérebro')

  cmd
    .command('list <brainId>')
    .description('Listar documentos do cérebro')
    .option('-p, --profile <name>', 'perfil')
    .option('--json', 'output JSON cru')
    .action(list)

  cmd
    .command('upload <brainId> <file>')
    .description('Subir documento (.pdf .md .txt) — worker indexa em background')
    .option('-p, --profile <name>', 'perfil')
    .option('--json', 'output JSON cru')
    .action(upload)

  cmd
    .command('delete <documentId>')
    .description('Apagar documento + chunks')
    .option('-p, --profile <name>', 'perfil')
    .action(deleteDoc)
}
