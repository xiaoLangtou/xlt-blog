import { EntityManager, raw } from '@mikro-orm/mysql'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import matter from 'gray-matter'
import { readFile, unlink } from 'node:fs/promises'
import { extname } from 'node:path'
import {
  ArticleStatus,
  CodeTheme,
  CommentStatus,
  CURRENT_RENDERER_VERSION,
  DashboardStats,
  DEFAULT_MENUS,
  DEFAULT_THEME_COLOR,
  EditorType,
  MenuItemConfig,
  SiteConfig,
  THEME_COLORS
} from '@xlt-blog/shared'
import { renderContentHtml } from '../content/content-renderer'
import {
  Article,
  Attachment,
  Category,
  Column,
  ColumnArticle,
  Comment,
  FriendLink,
  Page,
  Setting,
  SysMenu,
  Tag
} from '../entities'
import {
  AdminArticleQueryDto,
  AdminAttachmentQueryDto,
  AdminColumnQueryDto,
  AdminCommentQueryDto,
  AdminTagQueryDto,
  ImportArticlesDto,
  PreviewContentDto,
  SaveAdminMenuDto,
  SaveArticleDto,
  SaveCategoryDto,
  SaveColumnDto,
  SaveFriendLinkDto,
  SavePageDto,
  SaveSettingsDto,
  SaveStorageConfigDto,
  SaveTagDto,
  SetColumnArticlesDto,
  TestStorageConfigDto
} from './admin.dto'
import { StorageService } from '../storage/storage.service'

export const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024
const MAX_IMPORT_SLUG_ATTEMPTS = 5

export type ImportArticleFile = Pick<Express.Multer.File, 'originalname' | 'size' | 'path'> & {
  tooLarge?: boolean
}

class ImportedArticleContentError extends Error {}
class ImportedArticleDefaultCategoryError extends Error {}
class ImportedArticleSlugConflictError extends Error {}

@Injectable()
export class AdminService {
  constructor(
    private readonly em: EntityManager,
    private readonly storageService: StorageService
  ) {}

  // ---------- 文章 ----------

  async listArticles(query: AdminArticleQueryDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 10, 100)
    const where: Record<string, unknown> = {}
    if (query.status) where.status = query.status
    if (query.keyword) where.title = { $like: `%${query.keyword}%` }

    const [items, total] = await this.em.findAndCount(Article, where, {
      populate: ['category', 'tags'],
      exclude: ['rawContent', 'renderHtml'],
      orderBy: { createdAt: 'DESC' },
      limit: pageSize,
      offset: (page - 1) * pageSize
    })
    return { items, total, page, pageSize }
  }

  async getArticle(id: number) {
    const article = await this.em.findOne(Article, { id }, { populate: ['category', 'tags'] })
    if (!article) throw new NotFoundException('文章不存在')
    return article
  }

  async createArticle(dto: SaveArticleDto) {
    await this.ensureSlugUnique(dto.slug)
    const article = new Article()
    await this.applyArticleDto(article, dto)
    await this.em.persistAndFlush(article)
    return article
  }

  async updateArticle(id: number, dto: SaveArticleDto) {
    const article = await this.getArticle(id)
    await this.ensureSlugUnique(dto.slug, id)
    await this.applyArticleDto(article, dto)
    await this.em.flush()
    return article
  }

  private async ensureSlugUnique(slug: string, excludeId?: number) {
    const exists = await this.em.findOne(Article, { slug })
    if (exists && exists.id !== excludeId) {
      throw new BadRequestException(`slug "${slug}" 已被使用`)
    }
  }

  async importArticles(files: ImportArticleFile[], defaults: ImportArticlesDto) {
    const results: Array<
      | { filename: string; status: 'success'; articleId: number; title: string }
      | { filename: string; status: 'failed'; error: string }
    > = []

    for (const file of files) {
      const filename = Buffer.from(file.originalname, 'latin1').toString('utf8')
      try {
        if (!this.isMarkdownImportFile(filename)) {
          results.push({ filename, status: 'failed', error: '仅支持 Markdown 文件' })
          continue
        }
        if (file.tooLarge || file.size >= MAX_IMPORT_FILE_SIZE) {
          results.push({ filename, status: 'failed', error: '文件超过 5 MiB 限制' })
          continue
        }

        const { data, content, title, codeTheme, renderHtml } = await this.parseImportedArticle(
          file.path,
          filename
        )
        const article = await this.persistImportedArticle(
          data,
          content,
          title,
          codeTheme,
          renderHtml,
          defaults
        )
        results.push({ filename, status: 'success', articleId: article.id, title: article.title })
      } catch (error) {
        results.push({ filename, status: 'failed', error: this.getImportedArticleError(error) })
      } finally {
        await unlink(file.path).catch(() => undefined)
      }
    }

    const success = results.filter((result) => result.status === 'success').length
    return { results, total: results.length, success, failed: results.length - success }
  }

  private isMarkdownImportFile(filename: string) {
    const extension = extname(filename).toLowerCase()
    return extension === '.md' || extension === '.markdown'
  }

  private async parseImportedArticle(path: string, filename: string) {
    try {
      const parsed = matter((await readFile(path)).toString('utf8'))
      const data = parsed.data as Record<string, unknown>
      const title = this.getImportedArticleTitle(data, parsed.content, filename)
      const codeTheme = this.getImportedCodeTheme(data.codeTheme)
      const renderHtml = await renderContentHtml(EditorType.MD, parsed.content, codeTheme)
      return { data, content: parsed.content, title, codeTheme, renderHtml }
    } catch {
      throw new ImportedArticleContentError()
    }
  }

  private async persistImportedArticle(
    data: Record<string, unknown>,
    content: string,
    title: string,
    codeTheme: CodeTheme,
    renderHtml: string,
    defaults: ImportArticlesDto
  ) {
    const baseSlug = this.getImportedArticleSlugBase(title, data.slug)

    for (let attempt = 0; attempt < MAX_IMPORT_SLUG_ATTEMPTS; attempt++) {
      const itemEm = this.em.fork()
      try {
        const article = new Article()
        article.title = title
        article.slug = await this.generateImportedArticleSlug(itemEm, baseSlug)
        article.rawContent = content
        article.editorType = EditorType.MD
        article.codeTheme = codeTheme
        article.renderHtml = renderHtml
        article.rendererVersion = CURRENT_RENDERER_VERSION
        article.summary = typeof data.summary === 'string' ? data.summary : null
        article.cover = typeof data.cover === 'string' ? data.cover : null
        article.category = await this.getImportedArticleCategory(
          itemEm,
          data.category,
          defaults.defaultCategoryId
        )
        article.tags.set(await this.getImportedArticleTags(itemEm, data.tags, defaults.defaultTagIds))
        article.status = this.getImportedArticleStatus(data.status, defaults.defaultStatus)
        article.publishedAt =
          this.getImportedPublishedAt(data.publishedAt) ?? this.getImportedPublishedAt(data.date)
        if (article.status === ArticleStatus.Published && !article.publishedAt) {
          article.publishedAt = new Date()
        }

        await itemEm.persistAndFlush(article)
        return article
      } catch (error) {
        itemEm.clear()
        if (!this.isImportedArticleSlugConflict(error)) throw error
      }
    }

    throw new ImportedArticleSlugConflictError()
  }

  private getImportedArticleTitle(data: Record<string, unknown>, content: string, filename: string) {
    if (typeof data.title === 'string' && data.title.trim()) return data.title.trim()
    const heading = /^#\s+(.+)$/m.exec(content)
    if (heading?.[1].trim()) return heading[1].trim()
    const extension = filename.lastIndexOf('.')
    return extension > 0 ? filename.slice(0, extension) : filename
  }

  private getImportedArticleSlugBase(title: string, frontmatterSlug: unknown) {
    const suppliedSlug =
      typeof frontmatterSlug === 'string' && frontmatterSlug.trim()
        ? frontmatterSlug.trim()
        : undefined
    const normalizedTitle =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `article-${Date.now().toString(36)}`
    return suppliedSlug ?? normalizedTitle
  }

  private async generateImportedArticleSlug(em: EntityManager, base: string) {
    let slug = base
    let suffix = 2
    while (await em.findOne(Article, { slug })) {
      slug = `${base}-${suffix++}`
    }
    return slug
  }

  private getImportedCodeTheme(value: unknown) {
    return value === CodeTheme.Atom || value === CodeTheme.Github ? value : CodeTheme.Github
  }

  private getImportedArticleStatus(value: unknown, defaultStatus: ArticleStatus | undefined) {
    return value === ArticleStatus.Draft || value === ArticleStatus.Published
      ? value
      : (defaultStatus ?? ArticleStatus.Draft)
  }

  private async getImportedArticleCategory(
    em: EntityManager,
    category: unknown,
    defaultCategoryId: number | undefined
  ) {
    if (typeof category === 'string' && category.trim()) {
      return em.findOne(Category, { name: category.trim() })
    }
    if (defaultCategoryId === undefined) return null
    const defaultCategory = await em.findOne(Category, { id: defaultCategoryId })
    if (!defaultCategory) throw new ImportedArticleDefaultCategoryError()
    return defaultCategory
  }

  private async getImportedArticleTags(
    em: EntityManager,
    tags: unknown,
    defaultTagIds: number[] | undefined
  ) {
    if (typeof tags === 'string') {
      return tags ? em.find(Tag, { name: { $in: [tags] } }) : []
    }
    if (Array.isArray(tags)) {
      const names = tags.filter((tag): tag is string => typeof tag === 'string')
      return names.length ? em.find(Tag, { name: { $in: names } }) : []
    }
    return defaultTagIds?.length ? em.find(Tag, { id: { $in: defaultTagIds } }) : []
  }

  private getImportedPublishedAt(value: unknown) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value
    if (typeof value !== 'string') return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  private isImportedArticleSlugConflict(error: unknown) {
    const candidates: unknown[] = [error]
    const seen = new Set<object>()

    while (candidates.length) {
      const candidate = candidates.pop()
      if (!candidate || typeof candidate !== 'object' || seen.has(candidate)) continue
      seen.add(candidate)
      const details = candidate as {
        code?: unknown
        errno?: unknown
        message?: unknown
        cause?: unknown
      }
      if (details.code === 'ER_DUP_ENTRY' || details.errno === 1062) return true
      if (
        typeof details.message === 'string' &&
        /duplicate entry/i.test(details.message) &&
        /for key .*?(?:articles[.`'\"]*)?slug\b/i.test(details.message)
      ) {
        return true
      }
      candidates.push(details.cause)
    }

    return false
  }

  private getImportedArticleError(error: unknown) {
    if (error instanceof ImportedArticleDefaultCategoryError) return '默认分类不存在'
    if (error instanceof ImportedArticleContentError) return 'Markdown 文件解析或内容渲染失败'
    if (error instanceof ImportedArticleSlugConflictError) return '文章 slug 冲突，请重试导入'
    return '文章保存失败'
  }

  private async applyArticleDto(article: Article, dto: SaveArticleDto) {
    article.title = dto.title
    article.slug = dto.slug
    article.summary = dto.summary ?? null
    article.editorType = dto.editorType ?? article.editorType ?? EditorType.TIPTAP
    // codeTheme 参与渲染（Shiki 主题），先落位再生成 renderHtml
    article.codeTheme = dto.codeTheme ?? article.codeTheme ?? CodeTheme.Github
    // 转换 + 净化在后端统一完成（方案 3.1/3.2）：rawContent 原样保存，
    // renderHtml 由 renderContentHtml 生成，二者在随后的同一次 flush 中落库。
    try {
      article.renderHtml = await renderContentHtml(
        article.editorType,
        dto.rawContent,
        article.codeTheme
      )
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : '文章内容格式无效')
    }
    article.rawContent = dto.rawContent
    article.rendererVersion = CURRENT_RENDERER_VERSION
    article.cover = dto.cover ?? null
    article.category = dto.categoryId
      ? await this.em.findOneOrFail(Category, { id: dto.categoryId })
      : null
    if (dto.tagIds) {
      const tags = await this.em.find(Tag, { id: { $in: dto.tagIds } })
      article.tags.set(tags)
    }
    const nextStatus = dto.status ?? article.status ?? ArticleStatus.Draft
    // 首次发布时记录发布时间
    if (nextStatus === ArticleStatus.Published && !article.publishedAt) {
      article.publishedAt = new Date()
    }
    article.status = nextStatus
  }

  /** 内容预览：与保存走完全相同的渲染管线，保证预览即最终效果（方案第六节） */
  async previewContent(dto: PreviewContentDto) {
    try {
      const html = await renderContentHtml(
        dto.editorType,
        dto.rawContent,
        dto.codeTheme ?? CodeTheme.Github
      )
      return { html }
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : '内容格式无效')
    }
  }

  /** 批量重渲染：回刷 rendererVersion 落后的文章与页面（方案第九节） */
  async rerenderOutdatedContent() {
    const articles = await this.em.find(Article, {
      rendererVersion: { $ne: CURRENT_RENDERER_VERSION }
    })
    const pages = await this.em.find(Page, {
      rendererVersion: { $ne: CURRENT_RENDERER_VERSION }
    })
    let processed = 0
    let failed = 0
    for (const article of articles) {
      try {
        article.renderHtml = await renderContentHtml(
          article.editorType,
          article.rawContent,
          article.codeTheme ?? CodeTheme.Github
        )
        article.rendererVersion = CURRENT_RENDERER_VERSION
        processed++
      } catch {
        // 单篇失败不阻塞批量任务（如历史 raw 结构不合法）
        failed++
      }
    }
    for (const page of pages) {
      try {
        page.renderHtml = await renderContentHtml(page.editorType, page.rawContent)
        page.rendererVersion = CURRENT_RENDERER_VERSION
        processed++
      } catch {
        failed++
      }
    }
    await this.em.flush()
    return { processed, failed, total: articles.length + pages.length }
  }

  async setArticleStatus(id: number, status: ArticleStatus) {
    const article = await this.getArticle(id)
    article.status = status
    if (status === ArticleStatus.Published && !article.publishedAt) {
      article.publishedAt = new Date()
    }
    await this.em.flush()
    return article
  }

  async deleteArticle(id: number) {
    const article = await this.getArticle(id)
    await this.em.removeAndFlush(article)
    return null
  }

  // ---------- 分类 ----------

  listCategories() {
    return this.em.find(Category, {}, { orderBy: { sort: 'ASC', id: 'ASC' } })
  }

  async createCategory(dto: SaveCategoryDto) {
    const category = this.em.create(Category, {
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      sort: dto.sort ?? 0
    })
    await this.em.persistAndFlush(category)
    return category
  }

  async updateCategory(id: number, dto: SaveCategoryDto) {
    const category = await this.em.findOneOrFail(Category, { id })
    category.name = dto.name
    category.slug = dto.slug
    category.description = dto.description ?? null
    category.sort = dto.sort ?? category.sort
    await this.em.flush()
    return category
  }

  async deleteCategory(id: number) {
    const category = await this.em.findOneOrFail(Category, { id })
    await this.em.removeAndFlush(category)
    return null
  }

  // ---------- 标签 ----------

  listAllTags() {
    return this.em.find(Tag, {}, { orderBy: { id: 'ASC' } })
  }

  async listTags(query: AdminTagQueryDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 20, 100)
    const where: Record<string, unknown> = {}
    if (query.keyword) {
      where.$or = [
        { name: { $like: `%${query.keyword}%` } },
        { slug: { $like: `%${query.keyword}%` } }
      ]
    }

    const [items, total] = await this.em.findAndCount(Tag, where, {
      orderBy: { id: 'ASC' },
      limit: pageSize,
      offset: (page - 1) * pageSize
    })

    const rows = await Promise.all(
      items.map(async (tag) => ({
        ...tag,
        articleCount: await this.em.count(Article, { tags: { id: tag.id } })
      }))
    )

    return { items: rows, total, page, pageSize }
  }

  async createTag(dto: SaveTagDto) {
    const tag = this.em.create(Tag, {
      name: dto.name,
      slug: dto.slug,
      color: dto.color ?? null,
      icon: dto.icon ?? null
    })
    await this.em.persistAndFlush(tag)
    return tag
  }

  async updateTag(id: number, dto: SaveTagDto) {
    const tag = await this.em.findOneOrFail(Tag, { id })
    tag.name = dto.name
    tag.slug = dto.slug
    tag.color = dto.color ?? null
    tag.icon = dto.icon ?? null
    await this.em.flush()
    return tag
  }

  async deleteTag(id: number) {
    const tag = await this.em.findOneOrFail(Tag, { id })
    await this.em.removeAndFlush(tag)
    return null
  }

  // ---------- 专栏 ----------

  async listColumns(query: AdminColumnQueryDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 20, 100)
    const where: Record<string, unknown> = {}
    if (query.status) where.status = query.status
    if (query.keyword) {
      where.$or = [
        { name: { $like: `%${query.keyword}%` } },
        { slug: { $like: `%${query.keyword}%` } }
      ]
    }

    const [items, total] = await this.em.findAndCount(Column, where, {
      orderBy: { sort: 'ASC', id: 'ASC' },
      limit: pageSize,
      offset: (page - 1) * pageSize
    })

    const rows = await Promise.all(
      items.map(async (col) => ({
        ...col,
        articleCount: await this.em.count(ColumnArticle, { column: col.id })
      }))
    )

    return { items: rows, total, page, pageSize }
  }

  listAllColumns() {
    return this.em.find(Column, {}, { orderBy: { sort: 'ASC', id: 'ASC' } })
  }

  async getColumn(id: number) {
    const column = await this.em.findOneOrFail(Column, { id })
    const relations = await this.em.find(
      ColumnArticle,
      { column: column.id },
      { populate: ['article'], orderBy: { sort: 'ASC' } }
    )
    return {
      ...column,
      articles: relations.map((r, index) => ({ id: r.article.id, title: r.article.title, sort: index }))
    }
  }

  async createColumn(dto: SaveColumnDto) {
    const column = this.em.create(Column, {
      name: dto.name,
      slug: await this.generateColumnSlug(dto.name),
      description: dto.description ?? null,
      cover: dto.cover ?? null,
      status: dto.status ?? ArticleStatus.Draft,
      sort: dto.sort ?? 0,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    await this.em.persistAndFlush(column)
    return column
  }

  async updateColumn(id: number, dto: SaveColumnDto) {
    const column = await this.em.findOneOrFail(Column, { id })
    column.name = dto.name
    column.description = dto.description ?? null
    column.cover = dto.cover ?? null
    column.status = dto.status ?? column.status
    column.sort = dto.sort ?? column.sort
    await this.em.flush()
    return column
  }

  private async generateColumnSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `column-${Date.now().toString(36)}`
    let slug = base
    let suffix = 2
    while (await this.em.findOne(Column, { slug })) {
      slug = `${base}-${suffix++}`
    }
    return slug
  }

  async deleteColumn(id: number) {
    const column = await this.em.findOneOrFail(Column, { id })
    await this.em.removeAndFlush(column)
    return null
  }

  async setColumnArticles(id: number, dto: SetColumnArticlesDto) {
    const column = await this.em.findOneOrFail(Column, { id })
    await this.em.nativeDelete(ColumnArticle, { column: column.id })
    const articles = await this.em.find(Article, { id: { $in: dto.articleIds } })
    const map = new Map(articles.map((a) => [a.id, a]))
    dto.articleIds.forEach((articleId, index) => {
      const article = map.get(articleId)
      if (article) {
        this.em.create(ColumnArticle, { column, article, sort: index })
      }
    })
    await this.em.flush()
    return this.getColumn(id)
  }

  // ---------- 评论 ----------

  async listComments(query: AdminCommentQueryDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 20, 100)
    const where: Record<string, unknown> = {}
    if (query.status) where.status = query.status
    if (query.articleId) where.article = query.articleId
    if (query.keyword) {
      const keyword = `%${query.keyword.trim()}%`
      where.$or = [{ nickname: { $like: keyword } }, { content: { $like: keyword } }]
    }

    const [items, total] = await this.em.findAndCount(Comment, where, {
      populate: ['article', 'parent'],
      orderBy: { createdAt: query.order === 'asc' ? 'ASC' : 'DESC' },
      limit: pageSize,
      offset: (page - 1) * pageSize
    })
    return {
      items: items.map((c) => ({
        id: c.id,
        nickname: c.nickname,
        email: c.email,
        content: c.content,
        status: c.status,
        parentId: c.parent?.id ?? null,
        articleId: c.article.id,
        articleTitle: c.article.title,
        createdAt: c.createdAt
      })),
      total,
      page,
      pageSize
    }
  }

  async setCommentStatus(id: number, status: CommentStatus) {
    const comment = await this.em.findOneOrFail(Comment, { id })
    comment.status = status
    await this.em.flush()
    return comment
  }

  async replyComment(id: number, content: string) {
    const parent = await this.em.findOneOrFail(Comment, { id })
    const reply = this.em.create(Comment, {
      article: parent.article,
      nickname: '管理员',
      email: null,
      content,
      status: CommentStatus.Approved,
      parent,
      createdAt: new Date()
    })
    await this.em.persistAndFlush(reply)
    return reply
  }

  async deleteComment(id: number) {
    const comment = await this.em.findOneOrFail(Comment, { id })
    await this.em.removeAndFlush(comment)
    return null
  }

  // ---------- 设置 ----------

  async getSettings(): Promise<SiteConfig> {
    const rows = await this.em.find(Setting, {})
    const map = new Map(rows.map((row) => [row.key, row.value]))
    const menus = map.get('menus') as MenuItemConfig[] | undefined
    return {
      themeColor: (map.get('themeColor') as string | undefined) ?? DEFAULT_THEME_COLOR,
      menus: menus?.length ? [...menus].sort((a, b) => a.sort - b.sort) : DEFAULT_MENUS
    }
  }

  async saveSettings(dto: SaveSettingsDto) {
    if (dto.themeColor !== undefined) {
      if (!THEME_COLORS.some((palette) => palette.name === dto.themeColor)) {
        throw new BadRequestException('未知的主题色')
      }
      await this.upsertSetting('themeColor', dto.themeColor)
    }
    if (dto.menus !== undefined) {
      await this.upsertSetting(
        'menus',
        dto.menus.map(({ label, url, sort }) => ({ label, url, sort }))
      )
    }
    await this.em.flush()
    return this.getSettings()
  }

  private async upsertSetting(key: string, value: unknown) {
    const row = await this.em.findOne(Setting, { key })
    if (row) row.value = value
    else this.em.persist(this.em.create(Setting, { key, value }))
  }

  // ---------- 附件 ----------

  async listAttachments(query: AdminAttachmentQueryDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 24, 100)
    const where: Record<string, unknown> = {}
    if (query.keyword) where.filename = { $like: `%${query.keyword}%` }
    if (query.category && query.category !== 'all') {
      where.$or = this.attachmentCategoryFilter(query.category)
    }

    const orderBy =
      query.sort === 'name'
        ? ({ filename: 'ASC' } as const)
        : query.sort === 'size'
          ? ({ size: 'DESC' } as const)
          : ({ createdAt: 'DESC' } as const)

    const [items, total] = await this.em.findAndCount(Attachment, where, {
      orderBy,
      limit: pageSize,
      offset: (page - 1) * pageSize
    })
    return { items, total, page, pageSize }
  }

  async getAttachmentStats() {
    const all = await this.em.find(Attachment, {})
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const categoryCounts = { image: 0, video: 0, audio: 0, doc: 0, archive: 0, other: 0 }
    let totalSize = 0
    let todayCount = 0
    for (const item of all) {
      totalSize += item.size
      if (item.createdAt >= today) todayCount++
      const category = this.attachmentCategory(item.mimeType)
      categoryCounts[category]++
    }
    const imageRatio =
      all.length > 0 ? Math.round((categoryCounts.image / all.length) * 100) : 0
    return {
      total: all.length,
      totalSize,
      todayCount,
      imageRatio,
      categoryCounts
    }
  }

  /** mimeType 归类 */
  private attachmentCategory(mimeType: string): 'image' | 'video' | 'audio' | 'doc' | 'archive' | 'other' {
    const mt = (mimeType || '').toLowerCase()
    if (mt.startsWith('image/')) return 'image'
    if (mt.startsWith('video/')) return 'video'
    if (mt.startsWith('audio/')) return 'audio'
    if (mt.startsWith('text/') || mt.startsWith('application/pdf') || mt.startsWith('application/msword') || mt.includes('document') || mt.includes('sheet') || mt.includes('presentation')) return 'doc'
    if (mt.startsWith('application/zip') || mt.includes('rar') || mt.includes('7z') || mt.includes('tar') || mt.includes('gzip')) return 'archive'
    return 'other'
  }

  private attachmentCategoryFilter(category: string): Array<Record<string, unknown>> {
    const prefixes: Record<string, string[]> = {
      image: ['image/'],
      video: ['video/'],
      audio: ['audio/'],
      doc: ['text/', 'application/pdf', 'application/msword', 'application/vnd.'],
      archive: ['application/zip', 'application/x-rar', 'application/x-7z', 'application/gzip', 'application/x-tar']
    }
    const list = prefixes[category] ?? []
    if (category === 'other') {
      const all = Object.values(prefixes).flat()
      return all.map((p) => ({ mimeType: { $not: { $like: `${p}%` } } }))
    }
    return list.map((p) => ({ mimeType: { $like: `${p}%` } }))
  }

  async uploadAttachment(data: { filename: string; buffer: Buffer; mimeType: string; size: number }) {
    const uploaded = await this.storageService.put({
      name: data.filename,
      buffer: data.buffer,
      mimeType: data.mimeType
    })

    try {
      const attachment = this.em.create(Attachment, {
        filename: data.filename,
        url: uploaded.url,
        mimeType: data.mimeType,
        size: data.size,
        storage: uploaded.storage,
        storageKey: uploaded.key,
        createdAt: new Date()
      })
      await this.em.persistAndFlush(attachment)
      return { url: uploaded.url }
    } catch (error) {
      await this.storageService.delete(uploaded.storage, uploaded.key).catch(() => undefined)
      throw error
    }
  }

  async deleteAttachment(id: number) {
    const attachment = await this.em.findOneOrFail(Attachment, { id })
    if (attachment.storageKey) {
      await this.storageService.delete(attachment.storage, attachment.storageKey)
    }
    await this.em.removeAndFlush(attachment)
    return null
  }

  // ---------- 存储 ----------

  getStorageConfig() {
    return this.storageService.getMaskedConfig()
  }

  saveStorageConfig(dto: SaveStorageConfigDto) {
    return this.storageService.saveConfig(dto)
  }

  testStorageConfig(dto: TestStorageConfigDto) {
    return this.storageService.testConfig(dto.config)
  }

  migrateStorageAttachments() {
    return this.storageService.migrateAttachments()
  }

  // ---------- 独立页面 ----------

  listPages() {
    // 页面数量少且弹窗编辑需要回填原文，列表保留 rawContent，仅排除体积大的 renderHtml
    return this.em.find(Page, {}, { exclude: ['renderHtml'], orderBy: { createdAt: 'DESC' } })
  }

  async getPage(id: number) {
    const page = await this.em.findOne(Page, { id })
    if (!page) throw new NotFoundException('页面不存在')
    return page
  }

  async createPage(dto: SavePageDto) {
    await this.ensurePageSlugUnique(dto.slug)
    const editorType = dto.editorType ?? EditorType.MD
    const page = this.em.create(Page, {
      title: dto.title,
      slug: dto.slug,
      editorType,
      renderHtml: await this.renderPageContent(editorType, dto.rawContent),
      rawContent: dto.rawContent,
      rendererVersion: CURRENT_RENDERER_VERSION,
      status: dto.status ?? ArticleStatus.Draft,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    await this.em.persistAndFlush(page)
    return page
  }

  async updatePage(id: number, dto: SavePageDto) {
    const page = await this.getPage(id)
    await this.ensurePageSlugUnique(dto.slug, id)
    page.title = dto.title
    page.slug = dto.slug
    page.editorType = dto.editorType ?? page.editorType ?? EditorType.MD
    page.renderHtml = await this.renderPageContent(page.editorType, dto.rawContent)
    page.rawContent = dto.rawContent
    page.rendererVersion = CURRENT_RENDERER_VERSION
    page.status = dto.status ?? page.status
    await this.em.flush()
    return page
  }

  private async renderPageContent(editorType: EditorType, rawContent: string) {
    try {
      return await renderContentHtml(editorType, rawContent)
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : '内容格式无效')
    }
  }

  async deletePage(id: number) {
    const page = await this.getPage(id)
    await this.em.removeAndFlush(page)
    return null
  }

  private async ensurePageSlugUnique(slug: string, excludeId?: number) {
    const exists = await this.em.findOne(Page, { slug })
    if (exists && exists.id !== excludeId) {
      throw new BadRequestException(`slug "${slug}" 已被使用`)
    }
  }

  // ---------- 友情链接 ----------

  listLinks() {
    return this.em.find(FriendLink, {}, { orderBy: { sort: 'ASC', id: 'ASC' } })
  }

  async createLink(dto: SaveFriendLinkDto) {
    const link = this.em.create(FriendLink, {
      name: dto.name,
      url: dto.url,
      logo: dto.logo ?? null,
      description: dto.description ?? null,
      sort: dto.sort ?? 0
    })
    await this.em.persistAndFlush(link)
    return link
  }

  async updateLink(id: number, dto: SaveFriendLinkDto) {
    const link = await this.em.findOneOrFail(FriendLink, { id })
    link.name = dto.name
    link.url = dto.url
    link.logo = dto.logo ?? null
    link.description = dto.description ?? null
    link.sort = dto.sort ?? link.sort
    await this.em.flush()
    return link
  }

  async deleteLink(id: number) {
    const link = await this.em.findOneOrFail(FriendLink, { id })
    await this.em.removeAndFlush(link)
    return null
  }

  // ---------- 仪表盘 ----------

  async dashboard(): Promise<DashboardStats> {
    const [articleCount, draftCount, categoryCount, tagCount, pendingCommentCount] =
      await Promise.all([
        this.em.count(Article, { status: ArticleStatus.Published }),
        this.em.count(Article, { status: ArticleStatus.Draft }),
        this.em.count(Category, {}),
        this.em.count(Tag, {}),
        this.em.count(Comment, { status: CommentStatus.Pending })
      ])
    const views = await this.em
      .createQueryBuilder(Article, 'a')
      .select(raw('coalesce(sum(a.views), 0) as totalViews'))
      .execute<{ totalViews: string }[]>()
    const recentArticles = await this.em.find(
      Article,
      {},
      {
        populate: ['category', 'tags'],
        exclude: ['rawContent', 'renderHtml'],
        orderBy: { createdAt: 'DESC' },
        limit: 5
      }
    )
    return {
      articleCount,
      draftCount,
      categoryCount,
      tagCount,
      pendingCommentCount,
      totalViews: Number(views[0]?.totalViews ?? 0),
      recentArticles: recentArticles as never
    }
  }

  // ---------- 后台菜单 ----------

  async listAdminMenus() {
    const menus = (
      await this.em.find(SysMenu, {}, { orderBy: { sortOrder: 'ASC', id: 'ASC' } })
    ).filter((menu) => String(menu.delFlag) === '0')
    return this.buildMenuTree(menus)
  }

  private buildMenuTree(menus: SysMenu[], parentId: number = -1): any[] {
    return menus
      .filter((menu) => {
        const menuParentId = Number(menu.parentMenuId ?? -1)
        return parentId === -1
          ? menuParentId === -1 || menuParentId === 0
          : menuParentId === parentId
      })
      .map((menu) => {
        const id = Number(menu.id)
        return {
          id,
          parentId: Number(menu.parentMenuId ?? -1),
          name: menu.name ?? '',
          enName: menu.enName ?? '',
          permission: menu.permission ?? '',
          path: menu.path ?? '',
          icon: menu.icon ?? '',
          visible: menu.visible,
          sortOrder: menu.sortOrder ?? 0,
          keepAlive: menu.keepAlive,
          menuType: menu.menuType,
          isIframe: menu.isIframe,
          iframeUrl: menu.iframeUrl ?? '',
          component: menu.component ?? '',
          remark: menu.remark ?? '',
          meta: {
            title: menu.name ?? '',
            icon: menu.icon ?? '',
            isHide: menu.visible === '1',
            isKeepAlive: menu.keepAlive === '1',
            isIframe: menu.isIframe === '1',
            iframeUrl: menu.iframeUrl ?? undefined
          },
          children: this.buildMenuTree(menus, id)
        }
      })
  }

  async getAdminMenu(id: number) {
    const menu = await this.em.findOne(SysMenu, { id })
    if (!menu || String(menu.delFlag) !== '0') throw new NotFoundException('菜单不存在')
    return menu
  }

  async createAdminMenu(dto: SaveAdminMenuDto) {
    await this.assertMenuParent(dto.parentId)
    const now = new Date()
    const menu = this.em.create(SysMenu, {
      delFlag: 0,
      name: dto.name,
      enName: dto.enName ?? null,
      permission: dto.permission ?? null,
      path: dto.path ?? null,
      parentMenuId: dto.parentId ?? -1,
      icon: dto.icon ?? null,
      visible: dto.visible ?? '0',
      sortOrder: dto.sortOrder ?? 0,
      keepAlive: dto.keepAlive ?? '0',
      menuType: dto.menuType ?? '1',
      isIframe: dto.isIframe ?? '0',
      iframeUrl: dto.iframeUrl ?? null,
      component: dto.component ?? null,
      remark: dto.remark ?? null,
      createTime: now,
      updateTime: now
    })
    await this.em.persistAndFlush(menu)
    return menu
  }

  async updateAdminMenu(id: number, dto: SaveAdminMenuDto) {
    const menu = await this.getAdminMenu(id)
    await this.assertMenuParent(dto.parentId, id)
    menu.name = dto.name
    menu.enName = dto.enName ?? null
    menu.permission = dto.permission ?? null
    menu.path = dto.path ?? null
    menu.parentMenuId = dto.parentId ?? -1
    menu.icon = dto.icon ?? null
    menu.visible = dto.visible ?? menu.visible
    menu.sortOrder = dto.sortOrder ?? menu.sortOrder
    menu.keepAlive = dto.keepAlive ?? menu.keepAlive
    menu.menuType = dto.menuType ?? menu.menuType
    menu.isIframe = dto.isIframe ?? menu.isIframe
    menu.iframeUrl = dto.iframeUrl ?? null
    menu.component = dto.component ?? null
    menu.remark = dto.remark ?? null
    menu.updateTime = new Date()
    await this.em.flush()
    return menu
  }

  private async assertMenuParent(parentId?: number, menuId?: number) {
    if (!parentId || parentId === -1) return
    if (parentId === menuId) throw new BadRequestException('菜单不能选择自身作为父级')
    const parent = await this.em.findOne(SysMenu, { id: parentId })
    if (!parent || String(parent.delFlag) !== '0') throw new BadRequestException('父级菜单不存在')
    if (!menuId) return
    let current: SysMenu | null = parent
    while (current) {
      if (current.id === menuId) throw new BadRequestException('不能选择当前菜单的子级作为父级')
      if (!current.parentMenuId || current.parentMenuId === -1) break
      current = await this.em.findOne(SysMenu, { id: current.parentMenuId })
      if (!current || String(current.delFlag) !== '0') current = null
    }
  }

  async deleteAdminMenu(id: number) {
    const menu = await this.getAdminMenu(id)
    const hasChildren = (await this.em.find(SysMenu, { parentMenuId: id })).some(
      (child) => String(child.delFlag) === '0'
    )
    if (hasChildren) throw new BadRequestException('该菜单下还有子菜单，无法删除')
    menu.delFlag = 1
    menu.deleteTime = new Date()
    await this.em.flush()
    return null
  }
}
