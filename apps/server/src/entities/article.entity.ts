import {
  Collection,
  Entity,
  Enum,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property
} from '@mikro-orm/core'
import { ArticleStatus, CodeTheme, ContentFormat } from '@xlt-blog/shared'
import { Category } from './category.entity'
import { Tag } from './tag.entity'
// eslint-disable-next-line import/no-cycle
import { Comment } from './comment.entity'

@Entity({ tableName: 'articles' })
export class Article {
  @PrimaryKey()
  id!: number

  @Property()
  title!: string

  @Property({ unique: true })
  slug!: string

  @Property({ type: 'string', length: 500, nullable: true })
  summary: string | null = null

  /** 正文原文（Markdown 或安全 HTML，取决于 contentFormat） */
  @Property({ type: 'text', columnType: 'longtext' })
  content!: string

  /** 正文格式：markdown（Markdown 编辑器）或 html（富文本编辑器） */
  @Enum({ items: () => ContentFormat, default: ContentFormat.Html })
  contentFormat: ContentFormat = ContentFormat.Html

  @Enum({ items: () => CodeTheme, default: CodeTheme.Github })
  codeTheme: CodeTheme = CodeTheme.Github

  @Property({ type: 'string', nullable: true })
  cover: string | null = null

  @Index()
  @Enum({ items: () => ArticleStatus, default: ArticleStatus.Draft })
  status: ArticleStatus = ArticleStatus.Draft

  @Property({ default: 0 })
  views: number = 0

  @ManyToOne(() => Category, { nullable: true, deleteRule: 'set null' })
  category: Category | null = null

  @ManyToMany(() => Tag, (tag) => tag.articles, { owner: true })
  tags = new Collection<Tag>(this)

  @OneToMany(() => Comment, (comment) => comment.article)
  comments = new Collection<Comment>(this)

  @Property({ type: 'Date', nullable: true })
  publishedAt: Date | null = null

  @Property()
  createdAt: Date = new Date()

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}
