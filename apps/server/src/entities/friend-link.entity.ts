import { Entity, PrimaryKey, Property } from '@mikro-orm/core'

@Entity({ tableName: 'friend_links' })
export class FriendLink {
  @PrimaryKey()
  id!: number

  @Property()
  name!: string

  @Property()
  url!: string

  @Property({ type: 'string', nullable: true })
  logo: string | null = null

  @Property({ type: 'string', nullable: true })
  description: string | null = null

  @Property({ default: 0 })
  sort: number = 0
}
