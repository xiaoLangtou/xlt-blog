import { Entity, Enum, Index, PrimaryKey, Property } from '@mikro-orm/core'
import { ArticleStatus, ContentFormat } from '@xlt-blog/shared'

@Entity({ tableName: 'pages' })
export class Page {
  @PrimaryKey()
  id!: number

  @Property()
  title!: string

  @Property({ unique: true })
  slug!: string

  /** 正文原文（Markdown 或安全 HTML，取决于 contentFormat） */
  @Property({ type: 'text', columnType: 'longtext' })
  content!: string

  /** 正文格式：markdown 或 html */
  @Enum({ items: () => ContentFormat, default: ContentFormat.Html })
  contentFormat: ContentFormat = ContentFormat.Html

  @Index()
  @Enum({ items: () => ArticleStatus, default: ArticleStatus.Draft })
  status: ArticleStatus = ArticleStatus.Draft

  @Property()
  createdAt: Date = new Date()

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}
