import chalk from 'chalk'

import { ContextOSError } from './client.js'

export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

export function success(message: string): void {
  console.log(`${chalk.hex('#C5F432')('✓')} ${message}`)
}

export function info(message: string): void {
  console.log(`${chalk.cyan('•')} ${message}`)
}

export function warn(message: string): void {
  console.log(`${chalk.yellow('!')} ${message}`)
}

export function failure(message: string): void {
  console.error(`${chalk.red('✗')} ${message}`)
}

export function dim(text: string): string {
  return chalk.dim(text)
}

export function bold(text: string): string {
  return chalk.bold(text)
}

export function brand(text: string): string {
  return chalk.hex('#C5F432')(text)
}

export function handleError(err: unknown): never {
  if (err instanceof ContextOSError) {
    failure(err.message)
    if (err.body && typeof err.body === 'object') {
      const details = (err.body as { details?: unknown }).details
      if (details) {
        console.error(chalk.dim(JSON.stringify(details, null, 2)))
      }
    }
  } else if (err instanceof Error) {
    failure(err.message)
  } else {
    failure('Erro desconhecido')
  }
  process.exit(1)
}

export function table(
  rows: Array<Record<string, string | number | null | undefined>>,
  columns: Array<{ key: string; label: string; width?: number }>
): void {
  if (rows.length === 0) {
    console.log(chalk.dim('  (vazio)'))
    return
  }
  const widths = columns.map((c) => {
    const headerLen = c.label.length
    const maxRow = Math.max(
      ...rows.map((r) => String(r[c.key] ?? '').length)
    )
    return c.width ?? Math.min(Math.max(headerLen, maxRow), 60)
  })
  const header = columns
    .map((c, i) => chalk.bold(c.label.padEnd(widths[i] ?? 0)))
    .join('  ')
  const sep = columns
    .map((_, i) => chalk.dim('─'.repeat(widths[i] ?? 0)))
    .join('  ')
  console.log(header)
  console.log(sep)
  for (const r of rows) {
    const line = columns
      .map((c, i) => String(r[c.key] ?? '').padEnd(widths[i] ?? 0))
      .join('  ')
    console.log(line)
  }
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

export function shortId(id: string | null | undefined): string {
  if (!id) return ''
  return id.length > 8 ? `${id.slice(0, 8)}…` : id
}
