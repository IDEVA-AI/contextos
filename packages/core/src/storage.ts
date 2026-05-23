import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

export interface StorageInterface {
  save(content: Buffer, opts: { extension: string }): Promise<string>
  read(ref: string): Promise<Buffer>
  delete(ref: string): Promise<void>
  getAbsolutePath(ref: string): string
}

class FilesystemStorage implements StorageInterface {
  private readonly absoluteBase: string

  constructor(baseDir: string) {
    this.absoluteBase = resolve(baseDir)
  }

  private resolveRef(ref: string): string {
    const abs = resolve(this.absoluteBase, ref)
    if (!abs.startsWith(this.absoluteBase)) {
      throw new Error('storage_traversal_blocked')
    }
    return abs
  }

  async save(content: Buffer, opts: { extension: string }): Promise<string> {
    const id = randomUUID()
    const ext = opts.extension.startsWith('.') ? opts.extension : `.${opts.extension}`
    const ref = join(id.slice(0, 2), `${id}${ext}`)
    const abs = this.resolveRef(ref)
    await mkdir(dirname(abs), { recursive: true })
    await writeFile(abs, content)
    return ref
  }

  async read(ref: string): Promise<Buffer> {
    return readFile(this.resolveRef(ref))
  }

  async delete(ref: string): Promise<void> {
    try {
      await unlink(this.resolveRef(ref))
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    }
  }

  getAbsolutePath(ref: string): string {
    return this.resolveRef(ref)
  }
}

let cached: StorageInterface | null = null

export function getStorage(): StorageInterface {
  if (cached) return cached
  const dir = process.env.STORAGE_DIR ?? './data/storage'
  cached = new FilesystemStorage(dir)
  return cached
}
