import { EntityManager, raw } from '@mikro-orm/mysql'
import { Injectable, NotFoundException } from '@nestjs/common'
import {
  ArchiveGroup,
  ArticleStatus,
  CommentStatus,
  DEFAULT_MENUS,
  DEFAULT_RESUME,
  DEFAULT_THEME_COLOR,
  MenuItemConfig,
  ResumeDto,
  SiteConfig,
  SiteStats
} from '@xlt-blog/shared'
import {
  Article,
  Category,
  Column,
  ColumnArticle,
  Comment,
  FriendLink,
  Page,
  Setting,
  Tag
} from '../entities'
import { ArticleQueryDto, CreateCommentDto } from './blog.dto'

@Injectable()
export class BlogService {
  constructor(private readonly em: EntityManager) {}

  async listArticles(query: ArticleQueryDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 10, 50)

    const where: Record<string, unknown> = { status: ArticleStatus.Published }
    if (query.category) where.category = { slug: query.category }
    if (query.tag) where.tags = { slug: query.tag }
    if (query.keyword) {
      where.$or = [
        { title: { $like: `%${query.keyword}%` } },
        { summary: { $like: `%${query.keyword}%` } }
      ]
    }

    const [items, total] = await this.em.findAndCount(Article, where, {
      populate: ['category', 'tags'],
      exclude: ['rawContent', 'renderHtml'],
      orderBy: { publishedAt: 'DESC' },
      limit: pageSize,
      offset: (page - 1) * pageSize
    })
    return { items, total, page, pageSize }
  }

  async getArticleBySlug(slug: string) {
    const article = await this.em.findOne(
      Article,
      { slug, status: ArticleStatus.Published },
      { populate: ['category', 'tags'] }
    )
    if (!article) throw new NotFoundException('文章不存在')
    // 简单浏览计数（不做去重）
    article.views += 1
    await this.em.flush()
    // 公开接口不返回 rawContent / rendererVersion，仅返回渲染结果
    const { rawContent, rendererVersion, ...dto } = serialize(article)
    return dto
  }

  async listCategories() {
    const categories = await this.em.find(Category, {}, { orderBy: { sort: 'ASC', id: 'ASC' } })
    return this.withArticleCount(categories, 'category')
  }

  async listTags() {
    const tags = await this.em.find(Tag, {}, { orderBy: { id: 'ASC' } })
    return this.withArticleCount(tags, 'tags')
  }

  async listColumns() {
    return this.em.find(
      Column,
      { status: ArticleStatus.Published },
      { orderBy: { sort: 'ASC', id: 'ASC' } }
    )
  }

  async getColumnBySlug(slug: string) {
    const column = await this.em.findOne(Column, { slug, status: ArticleStatus.Published })
    if (!column) throw new NotFoundException('专栏不存在')
    const relations = await this.em.find(
      ColumnArticle,
      { column: column.id, article: { status: ArticleStatus.Published } },
      { populate: ['article'], orderBy: { sort: 'ASC' } }
    )
    return {
      ...column,
      articles: relations.map((r) => ({
        id: r.article.id,
        title: r.article.title,
        slug: r.article.slug,
        summary: r.article.summary,
        cover: r.article.cover,
        views: r.article.views,
        publishedAt: r.article.publishedAt
      }))
    }
  }

  private async withArticleCount<T extends { id: number }>(rows: T[], field: 'category' | 'tags') {
    return Promise.all(
      rows.map(async row => {
        const articleCount = await this.em.count(Article, {
          status: ArticleStatus.Published,
          [field]: field === 'category' ? row.id : { id: row.id }
        })
        return { ...serialize(row), articleCount }
      })
    )
  }

  async listComments(slug: string) {
    const article = await this.em.findOne(Article, { slug })
    if (!article) throw new NotFoundException('文章不存在')
    const comments = await this.em.find(
      Comment,
      { article, status: CommentStatus.Approved },
      { populate: ['parent'], orderBy: { createdAt: 'ASC' } }
    )
    return comments
  }

  async createComment(slug: string, dto: CreateCommentDto) {
    const article = await this.em.findOne(Article, { slug, status: ArticleStatus.Published })
    if (!article) throw new NotFoundException('文章不存在')

    const comment = this.em.create(Comment, {
      article,
      nickname: dto.nickname,
      email: dto.email ?? null,
      content: dto.content,
      status: CommentStatus.Pending,
      parent: dto.parentId ? await this.em.findOneOrFail(Comment, { id: dto.parentId }) : null,
      createdAt: new Date()
    })
    await this.em.persistAndFlush(comment)
    return { id: comment.id, status: comment.status }
  }

  async archive(): Promise<ArchiveGroup[]> {
    const articles = await this.em.find(
      Article,
      { status: ArticleStatus.Published },
      { fields: ['id', 'title', 'slug', 'publishedAt'], orderBy: { publishedAt: 'DESC' } }
    )
    const groups = new Map<string, ArchiveGroup>()
    for (const a of articles) {
      const d = a.publishedAt ?? new Date()
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`
      if (!groups.has(key)) {
        groups.set(key, { year: d.getFullYear(), month: d.getMonth() + 1, articles: [] })
      }
      groups.get(key)!.articles.push({
        id: a.id,
        title: a.title,
        slug: a.slug,
        publishedAt: a.publishedAt?.toISOString() ?? null
      })
    }
    return [...groups.values()]
  }

  async siteStats(): Promise<SiteStats> {
    const [articleCount, categoryCount, tagCount] = await Promise.all([
      this.em.count(Article, { status: ArticleStatus.Published }),
      this.em.count(Category, {}),
      this.em.count(Tag, {})
    ])
    const views = await this.em
      .createQueryBuilder(Article, 'a')
      .select(raw('coalesce(sum(a.views), 0) as totalViews'))
      .where({ status: ArticleStatus.Published })
      .execute<{ totalViews: string }[]>()
    return { articleCount, categoryCount, tagCount, totalViews: Number(views[0]?.totalViews ?? 0) }
  }

  /** 站点公开配置（主题色 + 菜单），缺省值兜底 */
  async siteConfig(): Promise<SiteConfig> {
    const rows = await this.em.find(Setting, {})
    const map = new Map(rows.map(row => [row.key, row.value]))
    const menus = map.get('menus') as MenuItemConfig[] | undefined
    return {
      themeColor: (map.get('themeColor') as string | undefined) ?? DEFAULT_THEME_COLOR,
      menus: menus?.length ? [...menus].sort((a, b) => a.sort - b.sort) : DEFAULT_MENUS
    }
  }

  listLinks() {
    return this.em.find(FriendLink, {}, { orderBy: { sort: 'ASC', id: 'ASC' } })
  }

  async getResume(): Promise<ResumeDto> {
    const setting = await this.em.findOne(Setting, { key: 'resume' })
    return (setting?.value as ResumeDto | undefined) ?? DEFAULT_RESUME
  }

  async getPageBySlug(slug: string) {
    const page = await this.em.findOne(Page, { slug, status: ArticleStatus.Published })
    if (!page) throw new NotFoundException('页面不存在')
    const { rawContent, rendererVersion, ...dto } = serialize(page)
    return dto
  }
}

/** 将实体转为普通对象（保留可枚举属性） */
function serialize<T>(row: T): T {
  return JSON.parse(JSON.stringify(row))
}
