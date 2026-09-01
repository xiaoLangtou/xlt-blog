import { EntityManager } from '@mikro-orm/mysql'
import { BadRequestException, Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { Attachment, Setting } from '../entities'
import { LocalStorageDriver } from './local-storage.driver'
import { S3CompatibleDriver } from './s3-compatible.driver'
import { StorageCryptoService } from './storage-crypto.service'
import type { StorageDriver } from './storage-driver.interface'
import {
  createDefaultStorageConfig,
  legacyStorageId,
  LOCAL_STORAGE_ID,
  type MaskedRemoteStorageConfig,
  type MaskedStorageConfig,
  type RemoteStorageConfig,
  type S3CompatibleStorageConfig,
  type StorageConfig,
  type StorageConnectionResult,
  type StorageKind,
  type StorageObjectInput
} from './storage.types'

const STORAGE_CONFIG_KEY = 'storageConfig'
const REMOTE_STORAGE_KINDS = ['rusfs', 's3'] as const
type RemoteStorageKind = (typeof REMOTE_STORAGE_KINDS)[number]
type RemoteStorageInput = Partial<Omit<RemoteStorageConfig, 'id'>>

/** 本地存储固定为 local；defaultTargetId 仅为未指定目标的上传默认值。 */
@Injectable()
export class StorageService {
  private readonly drivers = new Map<string, StorageDriver>()

  constructor(
    private readonly em: EntityManager,
    private readonly crypto: StorageCryptoService
  ) {}

  async getMaskedConfig(): Promise<MaskedStorageConfig> {
    return this.toMaskedConfig(await this.getConfig())
  }

  async setDefaultTarget(defaultTargetId: string): Promise<MaskedStorageConfig> {
    const config = await this.getConfig()
    this.resolveTarget(defaultTargetId, config)
    config.defaultTargetId = defaultTargetId
    await this.persistConfig(config)
    return this.toMaskedConfig(config)
  }

  async createRemote(input: RemoteStorageInput): Promise<MaskedRemoteStorageConfig> {
    const config = await this.getConfig()
    const remote = this.createRemoteConfig(input)
    this.validateRemoteUrls(remote)
    this.createRemoteDriver(remote)
    config.remotes.push(remote)
    await this.persistConfig(config)
    return this.toMaskedRemoteConfig(remote)
  }

  async updateRemote(id: string, input: RemoteStorageInput): Promise<MaskedRemoteStorageConfig> {
    const config = await this.getConfig()
    const index = config.remotes.findIndex((remote) => remote.id === id)
    if (index < 0) throw new BadRequestException('存储配置不存在')

    const current = config.remotes[index]
    const updated = this.mergeRemoteConfig(current, input)
    this.validateRemoteUrls(updated)
    await this.assertRemoteLocationCanChange(current, updated)
    this.createRemoteDriver(updated)
    config.remotes[index] = updated
    await this.persistConfig(config)
    return this.toMaskedRemoteConfig(updated)
  }

  async deleteRemote(id: string): Promise<void> {
    const config = await this.getConfig()
    if (!config.remotes.some((item) => item.id === id)) {
      throw new BadRequestException('存储配置不存在')
    }
    if (config.defaultTargetId === id) {
      throw new BadRequestException('请先将默认上传存储切换为其他实例，再删除此配置')
    }
    if (await this.hasAttachedObjects(id)) {
      throw new BadRequestException('该存储实例仍有关联附件，不能删除')
    }

    config.remotes = config.remotes.filter((item) => item.id !== id)
    await this.persistConfig(config)
  }

  async testRemote(input: RemoteStorageInput, id?: string): Promise<StorageConnectionResult> {
    try {
      const config = await this.getConfig()
      const existing = id ? config.remotes.find((remote) => remote.id === id) : undefined
      if (id && !existing) throw new BadRequestException('存储配置不存在')
      const remote = existing ? this.mergeRemoteConfig(existing, input) : this.createRemoteConfig(input, 'test-target')
      this.validateRemoteUrls(remote)
      await this.createRemoteDriver(remote).testConnection()
      return { success: true, message: '存储连接成功' }
    } catch {
      return { success: false, message: '存储连接失败，请检查配置和网络连接' }
    }
  }

  async put(file: StorageObjectInput, targetId?: string) {
    const config = await this.getConfig()
    const id = targetId || config.defaultTargetId
    const result = await this.getDriver(id, config).put(file)
    return { ...result, storageId: id }
  }

  async delete(storageId: string, key: string): Promise<void> {
    const config = await this.getConfig()
    await this.getDriver(storageId, config).delete(key)
  }

  getAttachmentStorageId(attachment: Pick<Attachment, 'storage' | 'storageId'>): string {
    return attachment.storageId || legacyStorageId(attachment.storage)
  }

  private async getConfig(): Promise<StorageConfig> {
    return this.decryptConfig(await this.getStoredConfig())
  }

  private async getStoredConfig(): Promise<StorageConfig> {
    const row = await this.em.findOne(Setting, { key: STORAGE_CONFIG_KEY })
    return this.normalizeConfig(row?.value)
  }

  private async persistConfig(config: StorageConfig): Promise<void> {
    const row = await this.em.findOne(Setting, { key: STORAGE_CONFIG_KEY })
    const value = this.encryptConfig(config)
    if (row) row.value = value
    else this.em.persist(this.em.create(Setting, { key: STORAGE_CONFIG_KEY, value }))
    await this.em.flush()
    this.drivers.clear()
  }

  private getDriver(id: string, config: StorageConfig): StorageDriver {
    const cached = this.drivers.get(id)
    if (cached) return cached

    const target = this.resolveTarget(id, config)
    const driver = target === 'local'
      ? new LocalStorageDriver(config.local)
      : this.createRemoteDriver(target)
    this.drivers.set(id, driver)
    return driver
  }

  private resolveTarget(id: string, config: StorageConfig): 'local' | RemoteStorageConfig {
    if (id === LOCAL_STORAGE_ID) return 'local'
    const target = config.remotes.find((remote) => remote.id === id)
    if (!target) throw new BadRequestException('存储配置不存在')
    return target
  }

  private createRemoteDriver(remote: RemoteStorageConfig): S3CompatibleDriver {
    return new S3CompatibleDriver(remote.kind, remote)
  }

  private async assertRemoteLocationCanChange(
    current: RemoteStorageConfig,
    updated: RemoteStorageConfig
  ): Promise<void> {
    if (!this.isRemoteLocationChanged(current, updated)) return
    if (await this.hasAttachedObjects(current.id)) {
      throw new BadRequestException('该存储实例仍有关联附件，不能变更 endpoint 或 bucket')
    }
  }

  private async hasAttachedObjects(storageId: string): Promise<boolean> {
    const existing = await this.em.findOne(Attachment, { storageId })
    if (existing) return true

    // 为升级前记录保留兼容：旧 storage 字段只记录驱动类型，映射到稳定的 legacy 实例。
    if (storageId === legacyStorageId('rusfs')) {
      return Boolean(await this.em.findOne(Attachment, { storage: 'rusfs', storageId: null }))
    }
    if (storageId === legacyStorageId('s3')) {
      return Boolean(await this.em.findOne(Attachment, { storage: 's3', storageId: null }))
    }
    return false
  }

  private isRemoteLocationChanged(
    current: S3CompatibleStorageConfig,
    updated: S3CompatibleStorageConfig
  ): boolean {
    return (
      this.normalizeEndpoint(current.endpoint) !== this.normalizeEndpoint(updated.endpoint) ||
      current.bucket.trim() !== updated.bucket.trim()
    )
  }

  private normalizeEndpoint(value?: string): string {
    const endpoint = value?.trim() ?? ''
    if (!endpoint) return ''
    try {
      return new URL(endpoint).toString().replace(/\/+$/, '')
    } catch {
      return endpoint.replace(/\/+$/, '')
    }
  }

  private validateRemoteUrls(remote: S3CompatibleStorageConfig): void {
    this.validateRemoteUrl(remote.endpoint)
    this.validateRemoteUrl(remote.publicUrlBase)
  }

  private validateRemoteUrl(value?: string): void {
    const urlValue = value?.trim()
    if (!urlValue) return
    try {
      const url = new URL(urlValue)
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error()
    } catch {
      throw new BadRequestException('存储服务地址无效')
    }
  }

  private normalizeConfig(value: unknown): StorageConfig {
    const input = this.asRecord(value)
    if (Array.isArray(input?.remotes)) return this.normalizeNewConfig(input)
    return this.normalizeLegacyConfig(input)
  }

  private normalizeNewConfig(input: Record<string, unknown>): StorageConfig {
    const remotes = (input.remotes as unknown[])
      .map((remote) => this.normalizeRemoteConfig(this.asRecord(remote)))
      .filter((remote): remote is RemoteStorageConfig => Boolean(remote))
    const defaultTargetId = this.stringValue(input.defaultTargetId, LOCAL_STORAGE_ID) ?? LOCAL_STORAGE_ID
    return {
      defaultTargetId: defaultTargetId === LOCAL_STORAGE_ID || remotes.some((remote) => remote.id === defaultTargetId)
        ? defaultTargetId
        : LOCAL_STORAGE_ID,
      local: { publicUrlPrefix: '/uploads' },
      remotes
    }
  }

  private normalizeLegacyConfig(input: Record<string, unknown> | undefined): StorageConfig {
    const defaults = createDefaultStorageConfig()
    const remotes: RemoteStorageConfig[] = []
    const rusfs = this.normalizeLegacyRemote('rusfs', this.asRecord(input?.rusfs))
    const s3 = this.normalizeLegacyRemote('s3', this.asRecord(input?.s3))
    if (rusfs) remotes.push(rusfs)
    if (s3) remotes.push(s3)

    const legacyActive = input?.active
    const defaultTargetId = legacyActive === 'rusfs'
      ? legacyStorageId('rusfs')
      : legacyActive === 's3'
        ? legacyStorageId('s3')
        : defaults.defaultTargetId
    return { ...defaults, defaultTargetId, remotes }
  }

  private normalizeLegacyRemote(
    kind: RemoteStorageKind,
    input: Record<string, unknown> | undefined
  ): RemoteStorageConfig | undefined {
    if (!input || !['endpoint', 'bucket', 'accessKey', 'secretKey'].some((key) => this.stringValue(input[key], '')?.trim())) {
      return undefined
    }
    return this.buildRemoteConfig({
      id: legacyStorageId(kind),
      name: kind === 'rusfs' ? '旧版 RustFS 存储' : '旧版对象存储',
      kind,
      ...input
    })
  }

  private normalizeRemoteConfig(input: Record<string, unknown> | undefined): RemoteStorageConfig | undefined {
    if (!input || !this.isStorageId(input.id) || !this.isRemoteStorageKind(input.kind)) return undefined
    return this.buildRemoteConfig(input)
  }

  private createRemoteConfig(input: RemoteStorageInput, id = `storage-${randomUUID()}`): RemoteStorageConfig {
    return this.buildRemoteConfig({ ...input, id })
  }

  private mergeRemoteConfig(current: RemoteStorageConfig, input: RemoteStorageInput): RemoteStorageConfig {
    return this.buildRemoteConfig({
      ...current,
      ...input,
      id: current.id,
      kind: current.kind,
      accessKey: this.credentialValue(input.accessKey, current.accessKey),
      secretKey: this.credentialValue(input.secretKey, current.secretKey)
    })
  }

  private buildRemoteConfig(input: Record<string, unknown>): RemoteStorageConfig {
    const kind = this.isRemoteStorageKind(input.kind) ? input.kind : 's3'
    const name = this.stringValue(input.name, '')?.trim() || (kind === 'rusfs' ? 'RustFS 存储' : '对象存储')
    return {
      id: this.isStorageId(input.id) ? input.id : `storage-${randomUUID()}`,
      name,
      kind,
      endpoint: this.stringValue(input.endpoint, ''),
      bucket: this.stringValue(input.bucket, '') ?? '',
      accessKey: this.stringValue(input.accessKey, '') ?? '',
      secretKey: this.stringValue(input.secretKey, '') ?? '',
      region: this.stringValue(input.region, ''),
      pathStyle: typeof input.pathStyle === 'boolean' ? input.pathStyle : kind === 'rusfs',
      publicUrlBase: this.stringValue(input.publicUrlBase, ''),
      ...(kind === 's3' ? { provider: this.isS3Provider(input.provider) ? input.provider : 'aws' } : {})
    }
  }

  private decryptConfig(config: StorageConfig): StorageConfig {
    return {
      ...config,
      remotes: config.remotes.map((remote) => ({
        ...remote,
        accessKey: this.decryptCredential(remote.accessKey),
        secretKey: this.decryptCredential(remote.secretKey)
      }))
    }
  }

  private encryptConfig(config: StorageConfig): StorageConfig {
    return {
      ...config,
      remotes: config.remotes.map((remote) => ({
        ...remote,
        accessKey: remote.accessKey ? this.crypto.encrypt(remote.accessKey) : '',
        secretKey: remote.secretKey ? this.crypto.encrypt(remote.secretKey) : ''
      }))
    }
  }

  private decryptCredential(value: string): string {
    if (!value || !value.startsWith('v1:')) return ''
    try {
      return this.crypto.decrypt(value)
    } catch {
      return ''
    }
  }

  private credentialValue(value: unknown, current: string): string {
    if (
      typeof value !== 'string' ||
      !value ||
      /^\*+$/.test(value) ||
      value === this.crypto.maskSecret(current)
    ) {
      return current
    }
    return value
  }

  private toMaskedConfig(config: StorageConfig): MaskedStorageConfig {
    return {
      defaultTargetId: config.defaultTargetId,
      local: { publicUrlPrefix: '/uploads' },
      remotes: config.remotes.map((remote) => this.toMaskedRemoteConfig(remote))
    }
  }

  private toMaskedRemoteConfig(remote: RemoteStorageConfig): MaskedRemoteStorageConfig {
    return {
      ...remote,
      accessKey: this.crypto.maskSecret(remote.accessKey),
      secretKey: this.crypto.maskSecret(remote.secretKey)
    }
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined
  }

  private stringValue(value: unknown, fallback: string | undefined): string | undefined {
    return typeof value === 'string' ? value : fallback
  }

  private isStorageId(value: unknown): value is string {
    return typeof value === 'string' && /^[a-z][a-z0-9_-]{0,63}$/i.test(value)
  }

  private isRemoteStorageKind(value: unknown): value is RemoteStorageKind {
    return typeof value === 'string' && (REMOTE_STORAGE_KINDS as readonly string[]).includes(value)
  }

  private isS3Provider(value: unknown): value is RemoteStorageConfig['provider'] {
    return ['aws', 'huawei-obs', 'aliyun-oss', 'tencent-cos', 'custom'].includes(value as string)
  }
}
