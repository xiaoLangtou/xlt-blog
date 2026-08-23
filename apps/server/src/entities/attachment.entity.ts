import { Entity, PrimaryKey, Property } from '@mikro-orm/core'
import type { StorageBackend } from '../storage/storage.types'

@Entity({ tableName: 'attachments' })
export class Attachment {
  @PrimaryKey()
  id!: number

  @Property()
  filename!: string

  @Property()
  url!: string

  @Property()
  mimeType!: string

  @Property({ default: 0 })
  size: number = 0

  @Property({ default: 'local' })
  storage: StorageBackend = 'local'

  @Property({ nullable: true })
  storageKey: string | null = null

  @Property()
  createdAt: Date = new Date()
}
