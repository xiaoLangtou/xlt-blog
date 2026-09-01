import { Entity, PrimaryKey, Property } from '@mikro-orm/core'
import type { StorageKind } from '../storage/storage.types'

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
  storage: StorageKind = 'local'

  /** 固定本地实例为 local；远端附件保存独立配置实例 ID。 */
  @Property({ nullable: true, length: 64 })
  storageId: string | null = null

  @Property({ nullable: true })
  storageKey: string | null = null

  @Property()
  createdAt: Date = new Date()
}
