import { Collection, Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/core'
// eslint-disable-next-line import/no-cycle
import { Article } from './article.entity'

@Entity({ tableName: 'tags' })
export class Tag {
  @PrimaryKey()
  id!: number

  @Property({ unique: true })
  name!: string

  @Property({ unique: true })
  slug!: string

  @Property({ type: 'string', length: 32, nullable: true })
  color: string | null = null

  @Property({ type: 'string', length: 500, nullable: true })
  icon: string | null = null

  @ManyToMany(() => Article, article => article.tags)
  articles = new Collection<Article>(this)
}
