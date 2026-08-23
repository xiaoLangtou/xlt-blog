import { EntityManager } from '@mikro-orm/mysql'
import { BadRequestException, Injectable } from '@nestjs/common'
import { Attachment, Setting } from '../entities'
import type { StorageDriver } from './storage-driver.interface'
import { LocalStorageDriver } from './local-storage.driver'
import { S3CompatibleDriver } from './s3-compatible.driver'
import { StorageCryptoService } from './storage-crypto.service'
import type {
  MaskedStorageConfig,
  S3CompatibleStorageConfig,
  StorageBackend,
  StorageConfig,
  StorageConnectionResult,
  StorageMigrationResult,
  StorageObjectInput
} from './storage.types'
import { STORAGE_BACKENDS, createDefaultStorageConfig } from './storage.types'

const STORAGE_CONFIG_KEY = 'storageConfig'

type ConfigPayload = {
  active?: StorageBackend
  local?: Partial<StorageConfig['local']>
  rusfs?: Partial<StorageConfig['rusfs']>
  s3?: Partial<StorageConfig['s3']>
}

@Injectable()
export class StorageService {
  private readonly drivers = new Map<StorageBackend, StorageDriver>()

  constructor(
    private readonly em: EntityManager,
    private readonly crypto: StorageCryptoService
  ) {}

  async getMaskedConfig(): Promise<MaskedStorageConfig> {
    const config = await this.getConfig()
    return {
      active: config.active,
      local: { ...config.local },
      rusfs: {
        ...config.rusfs,
        accessKey: this.crypto.maskSecret(config.rusfs.accessKey),
        secretKey: this.crypto.maskSecret(config.rusfs.secretKey)
      },
      s3: {
        ...config.s3,
        accessKey: this.crypto.maskSecret(config.s3.accessKey),
        secretKey: this.crypto.maskSecret(config.s3.secretKey)
      }
    }
  }

  async saveConfig(payload: ConfigPayload): Promise<MaskedStorageConfig> {
    const stored = await this.getStoredConfig()
    const current = this.decryptConfig(stored)
    const config = this.mergeConfig(current, payload)
    this.validateRemoteUrls(config)
    this.validateActiveConfig(config)
    await this.assertRemoteStorageLocationsCanChange(current, config)

    const row = await this.em.findOne(Setting, { key: STORAGE_CONFIG_KEY })
    const value = this.encryptConfig(config, stored)
    if (row) row.value = value
    else this.em.persist(this.em.create(Setting, { key: STORAGE_CONFIG_KEY, value }))
    await this.em.flush()
    this.drivers.clear()

    return this.toMaskedConfig(config)
  }

  async put(file: StorageObjectInput) {
    const config = await this.getConfig()
    return this.getDriver(config.active, config).put(file)
  }

  async delete(backend: StorageBackend, key: string): Promise<void> {
    const config = await this.getConfig()
    await this.getDriver(backend, config).delete(key)
  }

  async testConfig(payload?: ConfigPayload): Promise<StorageConnectionResult> {
    try {
      const current = await this.getConfig()
      const config = payload ? this.mergeConfig(current, payload) : current
      this.validateRemoteUrls(config)
      this.validateActiveConfig(config)
      const driver = this.createDriver(config.active, config)

      if (driver instanceof S3CompatibleDriver) {
        await driver.testConnection()
      } else {
        const probe = await driver.put({
          name: 'storage-probe.txt',
          buffer: Buffer.from('xlt-blog storage probe'),
          mimeType: 'text/plain'
        })
        await driver.delete(probe.key)
      }

      return { success: true, message: '存储连接成功' }
    } catch {
      return { success: false, message: '存储连接失败，请检查配置和网络连接' }
    }
  }

  async migrateAttachments(): Promise<StorageMigrationResult> {
    const config = await this.getConfig()
    const activeDriver = this.getDriver(config.active, config)
    const attachments = await this.em.find(Attachment, {})
    const result: StorageMigrationResult = {
      total: attachments.length,
      migrated: 0,
      failed: 0,
      failures: []
    }

    for (const attachment of attachments) {
      if (!attachment.storageKey) {
        this.recordMigrationFailure(result, attachment.id, attachment.filename, '附件缺少存储对象键')
        continue
      }
      if (attachment.storage === config.active) continue
      if (!attachment.storage || !this.isStorageBackend(attachment.storage)) {
        this.recordMigrationFailure(result, attachment.id, attachment.filename, '附件存储后端无效')
        continue
      }

      try {
        const source = this.getDriver(attachment.storage, config)
        const buffer = await source.read(attachment.storageKey)
        const uploaded = await activeDriver.put({
          name: attachment.filename,
          buffer,
          mimeType: attachment.mimeType
        })
        const previousStorage = attachment.storage
        const previousStorageKey = attachment.storageKey
        const previousUrl = attachment.url

        try {
          attachment.storage = uploaded.storage
          attachment.storageKey = uploaded.key
          attachment.url = uploaded.url
          await this.em.flush()
          result.migrated++
        } catch {
          attachment.storage = previousStorage
          attachment.storageKey = previousStorageKey
          attachment.url = previousUrl
          await activeDriver.delete(uploaded.key).catch(() => undefined)
          this.recordMigrationFailure(result, attachment.id, attachment.filename, '附件迁移失败')
        }
      } catch {
        this.recordMigrationFailure(result, attachment.id, attachment.filename, '附件迁移失败')
      }
    }

    return result
  }

  private async getConfig(): Promise<StorageConfig> {
    return this.decryptConfig(await this.getStoredConfig())
  }

  private async getStoredConfig(): Promise<StorageConfig> {
    const row = await this.em.findOne(Setting, { key: STORAGE_CONFIG_KEY })
    return this.normalizeConfig(row?.value)
  }

  private getDriver(backend: StorageBackend, config: StorageConfig): StorageDriver {
    const cached = this.drivers.get(backend)
    if (cached) return cached

    const driver = this.createDriver(backend, config)
    this.drivers.set(backend, driver)
    return driver
  }

  private createDriver(backend: StorageBackend, config: StorageConfig): StorageDriver {
    if (backend === 'local') return new LocalStorageDriver(config.local)
    return new S3CompatibleDriver(backend, config[backend])
  }

  private validateActiveConfig(config: StorageConfig) {
    if (config.active !== 'local') this.createDriver(config.active, config)
  }

  private async assertRemoteStorageLocationsCanChange(current: StorageConfig, config: StorageConfig) {
    for (const backend of ['rusfs', 's3'] as const) {
      if (!this.isRemoteStorageLocationChanged(current[backend], config[backend])) continue

      const attachment = await this.em.findOne(Attachment, { storage: backend })
      if (attachment) {
        throw new BadRequestException(
          '该存储后端仍有关联附件，不能直接变更 endpoint 或 bucket；请先迁移到其他后端'
        )
      }
    }
  }

  private isRemoteStorageLocationChanged(
    current: S3CompatibleStorageConfig,
    config: S3CompatibleStorageConfig
  ) {
    return (
      this.normalizeRemoteEndpoint(current.endpoint) !== this.normalizeRemoteEndpoint(config.endpoint) ||
      this.normalizeRemoteBucket(current.bucket) !== this.normalizeRemoteBucket(config.bucket)
    )
  }

  private normalizeRemoteEndpoint(value: string | undefined): string {
    const endpoint = value?.trim() ?? ''
    if (!endpoint) return ''

    try {
      return new URL(endpoint).toString().replace(/\/+$/, '')
    } catch {
      return endpoint.replace(/\/+$/, '')
    }
  }

  private normalizeRemoteBucket(value: string): string {
    return value.trim()
  }

  private validateRemoteUrls(config: StorageConfig) {
    for (const remote of [config.rusfs, config.s3]) {
      this.validateRemoteUrl(remote.endpoint)
      this.validateRemoteUrl(remote.publicUrlBase)
    }
  }

  private validateRemoteUrl(value?: string) {
    const urlValue = value?.trim()
    if (!urlValue) return

    try {
      const url = new URL(urlValue)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error()
      if (url.username || url.password) throw new Error()
    } catch {
      throw new BadRequestException('存储服务地址无效')
    }
  }

  private normalizeConfig(value: unknown): StorageConfig {
    const defaults = createDefaultStorageConfig()
    const input = this.asRecord(value)
    const active = this.isStorageBackend(input?.active) ? input.active : defaults.active
    const local = this.asRecord(input?.local)
    const rusfs = this.asRecord(input?.rusfs)
    const s3 = this.asRecord(input?.s3)

    return {
      active,
      local: {
        publicUrlPrefix: this.stringValue(local?.publicUrlPrefix, defaults.local.publicUrlPrefix)
      },
      rusfs: this.normalizeRemoteConfig(rusfs, defaults.rusfs),
      s3: {
        ...this.normalizeRemoteConfig(s3, defaults.s3),
        provider: this.isS3Provider(s3?.provider) ? s3.provider : defaults.s3.provider
      }
    }
  }

  private decryptConfig(config: StorageConfig): StorageConfig {
    return {
      ...config,
      rusfs: this.decryptRemoteConfig(config.rusfs),
      s3: this.decryptRemoteConfig(config.s3)
    }
  }

  private decryptRemoteConfig<T extends S3CompatibleStorageConfig>(config: T): T {
    return {
      ...config,
      accessKey: this.decryptCredential(config.accessKey),
      secretKey: this.decryptCredential(config.secretKey)
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

  private encryptConfig(config: StorageConfig, stored: StorageConfig): StorageConfig {
    return {
      ...config,
      rusfs: this.encryptRemoteConfig(config.rusfs, stored.rusfs),
      s3: this.encryptRemoteConfig(config.s3, stored.s3)
    }
  }

  private encryptRemoteConfig<T extends S3CompatibleStorageConfig>(config: T, stored: T): T {
    return {
      ...config,
      accessKey: config.accessKey ? this.crypto.encrypt(config.accessKey) : this.encryptedCredential(stored.accessKey),
      secretKey: config.secretKey ? this.crypto.encrypt(config.secretKey) : this.encryptedCredential(stored.secretKey)
    }
  }

  private encryptedCredential(value: string): string {
    return value.startsWith('v1:') ? value : ''
  }

  private mergeConfig(current: StorageConfig, payload: ConfigPayload): StorageConfig {
    const input = this.asRecord(payload) ?? {}
    const local = this.asRecord(input.local)
    const rusfs = this.asRecord(input.rusfs)
    const s3 = this.asRecord(input.s3)

    return {
      active: this.isStorageBackend(input.active) ? input.active : current.active,
      local: {
        publicUrlPrefix: this.stringValue(local?.publicUrlPrefix, current.local.publicUrlPrefix)
      },
      rusfs: this.mergeRemoteConfig(current.rusfs, rusfs),
      s3: {
        ...this.mergeRemoteConfig(current.s3, s3),
        provider: this.isS3Provider(s3?.provider) ? s3.provider : current.s3.provider
      }
    }
  }

  private mergeRemoteConfig(
    current: S3CompatibleStorageConfig,
    input: Record<string, unknown> | undefined
  ): S3CompatibleStorageConfig {
    return {
      endpoint: this.stringValue(input?.endpoint, current.endpoint),
      bucket: this.stringValue(input?.bucket, current.bucket) ?? '',
      accessKey: this.credentialValue(input?.accessKey, current.accessKey),
      secretKey: this.credentialValue(input?.secretKey, current.secretKey),
      region: this.stringValue(input?.region, current.region),
      pathStyle: typeof input?.pathStyle === 'boolean' ? input.pathStyle : current.pathStyle,
      publicUrlBase: this.stringValue(input?.publicUrlBase, current.publicUrlBase)
    }
  }

  private normalizeRemoteConfig(
    input: Record<string, unknown> | undefined,
    defaults: S3CompatibleStorageConfig
  ): S3CompatibleStorageConfig {
    return {
      endpoint: this.stringValue(input?.endpoint, defaults.endpoint),
      bucket: this.stringValue(input?.bucket, defaults.bucket) ?? '',
      accessKey: this.stringValue(input?.accessKey, defaults.accessKey) ?? '',
      secretKey: this.stringValue(input?.secretKey, defaults.secretKey) ?? '',
      region: this.stringValue(input?.region, defaults.region),
      pathStyle: typeof input?.pathStyle === 'boolean' ? input.pathStyle : defaults.pathStyle,
      publicUrlBase: this.stringValue(input?.publicUrlBase, defaults.publicUrlBase)
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
      active: config.active,
      local: { ...config.local },
      rusfs: {
        ...config.rusfs,
        accessKey: this.crypto.maskSecret(config.rusfs.accessKey),
        secretKey: this.crypto.maskSecret(config.rusfs.secretKey)
      },
      s3: {
        ...config.s3,
        accessKey: this.crypto.maskSecret(config.s3.accessKey),
        secretKey: this.crypto.maskSecret(config.s3.secretKey)
      }
    }
  }

  private recordMigrationFailure(
    result: StorageMigrationResult,
    id: number,
    filename: string,
    error: string
  ) {
    result.failed++
    result.failures.push({ id, filename, error })
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined
  }

  private stringValue(value: unknown, fallback: string | undefined): string | undefined {
    return typeof value === 'string' ? value : fallback
  }

  private isStorageBackend(value: unknown): value is StorageBackend {
    return typeof value === 'string' && (STORAGE_BACKENDS as readonly string[]).includes(value)
  }

  private isS3Provider(value: unknown): value is StorageConfig['s3']['provider'] {
    return (
      value === 'aws' ||
      value === 'huawei-obs' ||
      value === 'aliyun-oss' ||
      value === 'tencent-cos' ||
      value === 'custom'
    )
  }
}
