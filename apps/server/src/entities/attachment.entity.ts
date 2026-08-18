import { Entity, PrimaryKey, Property } from '@mikro-orm/core'

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

  @Property()
  createdAt: Date = new Date()
}
