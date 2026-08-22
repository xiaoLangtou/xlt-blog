import { Entity, Enum, Index, PrimaryKey, Property } from '@mikro-orm/core'
import { ArticleStatus, CURRENT_RENDERER_VERSION, EditorType } from '@xlt-blog/shared'

@Entity({ tableName: 'pages' })
export class Page {
  @PrimaryKey()
  id!: number

  @Property()
  title!: string

  @Property({ unique: true })
  slug!: string

  /** 原始内容（编辑回填用）：页面编辑器固定 Markdown 源码 */
  @Property({ type: 'text', columnType: 'longtext' })
  rawContent!: string

  /** 统一转换 + 净化后的安全 HTML（前台展示用） */
  @Property({ type: 'text', columnType: 'longtext' })
  renderHtml!: string

  /** 页面内容编辑器类型（当前管理端为 Markdown 文本域） */
  @Enum({ items: () => EditorType, default: EditorType.MD })
  editorType: EditorType = EditorType.MD

  /** 渲染器版本：转换器/白名单升级后批量重渲染用 */
  @Property({ default: CURRENT_RENDERER_VERSION })
  rendererVersion: number = CURRENT_RENDERER_VERSION

  @Index()
  @Enum({ items: () => ArticleStatus, default: ArticleStatus.Draft })
  status: ArticleStatus = ArticleStatus.Draft

  @Property()
  createdAt: Date = new Date()

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}
