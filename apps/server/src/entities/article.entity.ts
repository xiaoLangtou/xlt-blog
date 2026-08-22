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
import { ArticleStatus, CodeTheme, CURRENT_RENDERER_VERSION, EditorType } from '@xlt-blog/shared'
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

  /** 原始内容（编辑回填用）：md 为 Markdown 源码，tiptap/domternal 为 ProseMirror JSON 字符串 */
  @Property({ type: 'text', columnType: 'longtext' })
  rawContent!: string

  /** 统一转换 + 净化后的安全 HTML（前台/预览展示用） */
  @Property({ type: 'text', columnType: 'longtext' })
  renderHtml!: string

  /** 生成 renderHtml 时使用的编辑器类型（决定 rawContent 结构与转换器） */
  @Enum({ items: () => EditorType, default: EditorType.TIPTAP })
  editorType: EditorType = EditorType.TIPTAP

  /** 渲染器版本：转换器/白名单升级后批量重渲染用 */
  @Property({ default: CURRENT_RENDERER_VERSION })
  rendererVersion: number = CURRENT_RENDERER_VERSION

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
