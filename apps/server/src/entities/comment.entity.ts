import { Entity, Enum, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { CommentStatus } from '@xlt-blog/shared'
import { Article } from './article.entity'

@Entity({ tableName: 'comments' })
export class Comment {
  @PrimaryKey()
  id!: number

  @ManyToOne(() => Article, { deleteRule: 'cascade' })
  article!: Article

  @Property()
  nickname!: string

  @Property({ type: 'string', nullable: true, hidden: true })
  email: string | null = null

  @Property({ type: 'text' })
  content!: string

  @Index()
  @Enum({ items: () => CommentStatus, default: CommentStatus.Pending })
  status: CommentStatus = CommentStatus.Pending

  /** 父评论，支持一层回复 */
  @ManyToOne(() => Comment, { nullable: true, deleteRule: 'cascade' })
  parent: Comment | null = null

  @Property()
  createdAt: Date = new Date()
}
