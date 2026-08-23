export const STORAGE_BACKENDS = ['local', 'rusfs', 's3'] as const

export type StorageBackend = (typeof STORAGE_BACKENDS)[number]

export type S3StorageProvider = 'aws' | 'huawei-obs' | 'aliyun-oss' | 'tencent-cos' | 'custom'

export interface StorageObjectInput {
  name: string
  buffer: Buffer
  mimeType: string
}

export interface PutResult {
  storage: StorageBackend
  key: string
  url: string
}

export interface LocalStorageConfig {
  publicUrlPrefix?: string
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

export interface StorageConfig {
  active: StorageBackend
  local: LocalStorageConfig
  rusfs: S3CompatibleStorageConfig
  s3: S3CompatibleStorageConfig & {
    provider: S3StorageProvider
  }
}

export interface MaskedS3CompatibleStorageConfig
  extends Omit<S3CompatibleStorageConfig, 'accessKey' | 'secretKey'> {
  accessKey: string
  secretKey: string
}

export interface MaskedStorageConfig {
  active: StorageBackend
  local: LocalStorageConfig
  rusfs: MaskedS3CompatibleStorageConfig
  s3: MaskedS3CompatibleStorageConfig & {
    provider: S3StorageProvider
  }
}

export interface StorageConnectionResult {
  success: boolean
  message: string
}

export interface StorageMigrationFailure {
  id: number
  filename: string
  error: string
}

export interface StorageMigrationResult {
  total: number
  migrated: number
  failed: number
  failures: StorageMigrationFailure[]
}

export function createDefaultStorageConfig(): StorageConfig {
  return {
    active: 'local',
    local: {
      publicUrlPrefix: '/uploads'
    },
    rusfs: {
      endpoint: '',
      bucket: '',
      accessKey: '',
      secretKey: '',
      region: '',
      pathStyle: true,
      publicUrlBase: ''
    },
    s3: {
      provider: 'aws',
      endpoint: '',
      bucket: '',
      accessKey: '',
      secretKey: '',
      region: '',
      pathStyle: false,
      publicUrlBase: ''
    }
  }
}
