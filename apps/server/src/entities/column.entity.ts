import { Collection, Entity, Enum, OneToMany, PrimaryKey, Property } from '@mikro-orm/core'
import { ArticleStatus } from '@xlt-blog/shared'
import { ColumnArticle } from './column-article.entity'

@Entity({ tableName: 'columns' })
export class Column {
  @PrimaryKey()
  id!: number

  @Property({ unique: true })
  name!: string

  @Property({ unique: true })
  slug!: string

  @Property({ type: 'string', length: 500, nullable: true })
  description: string | null = null

  @Property({ type: 'string', nullable: true })
  cover: string | null = null

  @Enum({ items: () => ArticleStatus, default: ArticleStatus.Draft })
  status: ArticleStatus = ArticleStatus.Draft

  @Property({ default: 0 })
  sort: number = 0

  @OneToMany(() => ColumnArticle, (item) => item.column, { orderBy: { sort: 'ASC' } })
  columnArticles = new Collection<ColumnArticle>(this)

  @Property()
  createdAt: Date = new Date()

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}
