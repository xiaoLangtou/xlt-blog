import { Entity, PrimaryKey, Property } from '@mikro-orm/core'

@Entity({ tableName: 'users' })
export class User {
  @PrimaryKey()
  id!: number

  @Property({ unique: true })
  username!: string

  /** bcrypt hash，任何接口都不允许返回该字段 */
  @Property({ hidden: true })
  password!: string

  @Property()
  nickname!: string

  @Property({ type: 'string', nullable: true })
  avatar: string | null = null

  @Property()
  createdAt: Date = new Date()
}
