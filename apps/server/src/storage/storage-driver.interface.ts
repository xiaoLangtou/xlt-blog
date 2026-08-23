import type { PutResult, StorageObjectInput } from './storage.types'

export interface StorageDriver {
  put(file: StorageObjectInput): Promise<PutResult>
  read(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  getUrl?(key: string, options?: { expiresIn?: number }): Promise<string>
}
