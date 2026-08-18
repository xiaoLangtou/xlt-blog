import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core'
// eslint-disable-next-line import/no-cycle
import { Article } from './article.entity'

@Entity({ tableName: 'categories' })
export class Category {
  @PrimaryKey()
  id!: number

  @Property({ unique: true })
  name!: string

  @Property({ unique: true })
  slug!: string

  @Property({ type: 'string', nullable: true })
  description: string | null = null

  @Property({ default: 0 })
  sort: number = 0

  @OneToMany(() => Article, article => article.category)
  articles = new Collection<Article>(this)
}
