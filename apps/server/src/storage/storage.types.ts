export const STORAGE_KINDS = ['local', 'rusfs', 's3'] as const

/** 存储驱动类型；远端配置可拥有多个相同类型的实例。 */
export type StorageKind = (typeof STORAGE_KINDS)[number]

/** 固定的本地存储实例 ID。 */
export const LOCAL_STORAGE_ID = 'local'
export const LEGACY_RUSFS_STORAGE_ID = 'legacy-rusfs'
export const LEGACY_S3_STORAGE_ID = 'legacy-s3'

export type S3StorageProvider = 'aws' | 'huawei-obs' | 'aliyun-oss' | 'tencent-cos' | 'custom'

export interface StorageObjectInput {
  name: string
  buffer: Buffer
  mimeType: string
}

/** 单个驱动写入对象的结果。storageId 由 StorageService 在选择实例后补充。 */
export interface PutResult {
  storage: StorageKind
  key: string
  url: string
}

export interface LocalStorageConfig {
  /** 本地文件由应用固定映射至 /uploads，不允许作为可切换实例编辑。 */
  publicUrlPrefix: '/uploads'
}

export interface S3CompatibleStorageConfig {
  endpoint?: string
  bucket: string
  accessKey: string
  secretKey: string
  region?: string
  pathStyle?: boolean
  publicUrlBase?: string
}

/** 一个可独立使用的远端对象存储实例。 */
export interface RemoteStorageConfig extends S3CompatibleStorageConfig {
  id: string
  name: string
  kind: Extract<StorageKind, 'rusfs' | 's3'>
  provider?: S3StorageProvider
}

export interface StorageConfig {
  /** 未传 storageId 时的新附件默认写入的实例；不代表其他实例不可用。 */
  defaultTargetId: string
  local: LocalStorageConfig
  remotes: RemoteStorageConfig[]
}

export interface MaskedRemoteStorageConfig
  extends Omit<RemoteStorageConfig, 'accessKey' | 'secretKey'> {
  accessKey: string
  secretKey: string
}

export interface MaskedStorageConfig {
  defaultTargetId: string
  local: LocalStorageConfig
  remotes: MaskedRemoteStorageConfig[]
}

export interface StorageConnectionResult {
  success: boolean
  message: string
}

export function legacyStorageId(kind: StorageKind): string {
  if (kind === 'rusfs') return LEGACY_RUSFS_STORAGE_ID
  if (kind === 's3') return LEGACY_S3_STORAGE_ID
  return LOCAL_STORAGE_ID
}

export function createDefaultStorageConfig(): StorageConfig {
  return {
    defaultTargetId: LOCAL_STORAGE_ID,
    local: { publicUrlPrefix: '/uploads' },
    remotes: []
  }
}
