import { Entity, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/core'
import { Article } from './article.entity'
import { Column } from './column.entity'

@Entity({ tableName: 'column_articles' })
@Unique({ properties: ['column', 'article'] })
export class ColumnArticle {
  @PrimaryKey()
  id!: number

  @ManyToOne(() => Column, { deleteRule: 'cascade' })
  column!: Column

  @ManyToOne(() => Article, { deleteRule: 'cascade' })
  article!: Article

  @Property({ default: 0 })
  sort: number = 0
}
