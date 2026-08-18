import { Entity, PrimaryKey, Property } from '@mikro-orm/core'

@Entity({ tableName: 'admin_menus' })
export class AdminMenu {
  @PrimaryKey()
  id!: number

  @Property({ type: 'string', length: 100 })
  title!: string

  @Property({ type: 'string', length: 200, nullable: true })
  path?: string | null

  @Property({ type: 'string', length: 100, nullable: true })
  icon?: string | null

  @Property({ type: 'integer', nullable: true })
  parentId?: number | null

  @Property({ type: 'integer', default: 0 })
  sort!: number

  @Property({ type: 'boolean', default: true })
  visible!: boolean

  @Property({ type: 'string', length: 100, nullable: true })
  component?: string | null

  @Property({ type: 'boolean', default: false })
  keepAlive!: boolean

  @Property({ onCreate: () => new Date(), defaultRaw: 'current_timestamp' })
  createdAt: Date = new Date()

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date(), defaultRaw: 'current_timestamp' })
  updatedAt: Date = new Date()
}
