import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { BadRequestException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import type { StorageDriver } from './storage-driver.interface'
import type {
  PutResult,
  S3CompatibleStorageConfig,
  StorageBackend,
  StorageObjectInput
} from './storage.types'

export class S3CompatibleDriver implements StorageDriver {
  private readonly client: S3Client
  private readonly endpoint?: string

  constructor(
    private readonly backend: Extract<StorageBackend, 'rusfs' | 's3'>,
    private readonly config: S3CompatibleStorageConfig
  ) {
    this.endpoint = this.normalizeEndpoint(config.endpoint)
    this.validateConfig()
    this.client = new S3Client({
      endpoint: this.endpoint,
      region: config.region || 'us-east-1',
      forcePathStyle: config.pathStyle ?? backend === 'rusfs',
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey
      }
    })
  }

  async put(file: StorageObjectInput): Promise<PutResult> {
    const now = new Date()
    const key = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${randomUUID()}${extname(file.name).toLowerCase()}`
    await new Upload({
      client: this.client,
      params: {
        Bucket: this.config.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimeType
      }
    }).done()

    return {
      storage: this.backend,
      key,
      url: this.createPublicUrl(key)
    }
  }

  async read(key: string): Promise<Buffer> {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      })
    )
    const body = result.Body
    if (!body) throw new Error('存储对象不存在')

    const transformToByteArray = (body as { transformToByteArray?: () => Promise<Uint8Array> })
      .transformToByteArray
    if (transformToByteArray) {
      return Buffer.from(await transformToByteArray.call(body))
    }

    if (Symbol.asyncIterator in body) {
      const chunks: Buffer[] = []
      for await (const chunk of body as AsyncIterable<Buffer | Uint8Array | string>) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }
      return Buffer.concat(chunks)
    }

    throw new Error('存储响应无法读取')
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      })
    )
  }

  async getUrl(key: string): Promise<string> {
    return this.createPublicUrl(key)
  }

  async testConnection(): Promise<void> {
    const key = `__xlt-blog-probe/${randomUUID()}.txt`
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          Body: 'xlt-blog storage probe',
          ContentType: 'text/plain'
        })
      )
    } finally {
      await this.client
        .send(
          new DeleteObjectCommand({
            Bucket: this.config.bucket,
            Key: key
          })
        )
        .catch(() => undefined)
    }
  }

  private validateConfig() {
    if (!this.config.bucket.trim()) throw new BadRequestException('存储桶不能为空')
    if (!this.config.accessKey.trim() || !this.config.secretKey.trim()) {
      throw new BadRequestException('存储访问凭据不能为空')
    }
    this.validatePublicUrlBase(this.config.publicUrlBase)
  }

  private normalizeEndpoint(endpoint?: string): string | undefined {
    const value = endpoint?.trim()
    if (!value) return undefined

    try {
      const url = new URL(value)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error()
      if (url.username || url.password) throw new Error()
      return url.toString().replace(/\/$/, '')
    } catch {
      throw new BadRequestException('存储服务地址无效')
    }
  }

  private validatePublicUrlBase(publicUrlBase?: string) {
    const value = publicUrlBase?.trim()
    if (!value) return

    try {
      const url = new URL(value)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error()
      if (url.username || url.password) throw new Error()
    } catch {
      throw new BadRequestException('存储服务地址无效')
    }
  }

  private createPublicUrl(key: string): string {
    const base = this.config.publicUrlBase?.trim().replace(/\/+$/, '')
    const encodedKey = key.split('/').map(encodeURIComponent).join('/')
    if (base) return `${base}/${encodedKey}`
    if (this.endpoint) return `${this.endpoint}/${this.config.bucket}/${encodedKey}`

    const region = this.config.region || 'us-east-1'
    return `https://${this.config.bucket}.s3.${region}.amazonaws.com/${encodedKey}`
  }
}
