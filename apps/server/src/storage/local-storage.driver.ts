import { BadRequestException } from '@nestjs/common'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { StorageDriver } from './storage-driver.interface'
import type { LocalStorageConfig, PutResult, StorageObjectInput } from './storage.types'

const UPLOAD_DIR = join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads')

export class LocalStorageDriver implements StorageDriver {
  constructor(private readonly config: LocalStorageConfig) {}

  async put(file: StorageObjectInput): Promise<PutResult> {
    const now = new Date()
    const key = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${randomUUID()}${extname(file.name).toLowerCase()}`
    const path = this.resolveKey(key)

    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, file.buffer)

    return {
      storage: 'local',
      key,
      url: this.createPublicUrl(key)
    }
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.resolveKey(key))
  }

  async delete(key: string): Promise<void> {
    try {
      await rm(this.resolveKey(key))
    } catch (error) {
      if (this.isNotFoundError(error)) return
      throw error
    }
  }

  async getUrl(key: string): Promise<string> {
    this.resolveKey(key)
    return this.createPublicUrl(key)
  }

  private resolveKey(key: string): string {
    if (!key || isAbsolute(key)) {
      throw new BadRequestException('存储对象键无效')
    }

    const path = resolve(UPLOAD_DIR, key)
    const pathRelativeToUploadDir = relative(UPLOAD_DIR, path)
    if (
      !pathRelativeToUploadDir ||
      pathRelativeToUploadDir === '..' ||
      pathRelativeToUploadDir.startsWith(`..${sep}`) ||
      isAbsolute(pathRelativeToUploadDir)
    ) {
      throw new BadRequestException('存储对象键无效')
    }

    return path
  }

  private createPublicUrl(key: string): string {
    const prefix = (this.config.publicUrlPrefix ?? '/uploads').replace(/\/+$/, '') || '/'
    return `${prefix === '/' ? '' : prefix}/${key}`
  }

  private isNotFoundError(error: unknown): error is NodeJS.ErrnoException {
    return typeof error === 'object' && error !== null && (error as NodeJS.ErrnoException).code === 'ENOENT'
  }
}
