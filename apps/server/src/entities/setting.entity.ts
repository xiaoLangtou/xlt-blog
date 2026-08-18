import { Entity, PrimaryKey, Property } from '@mikro-orm/core'

@Entity({ tableName: 'settings' })
export class Setting {
  @PrimaryKey({ type: 'string', length: 100 })
  key!: string

  @Property({ type: 'json' })
  value!: unknown
}
