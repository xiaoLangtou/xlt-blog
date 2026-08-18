import { EntityManager, raw } from '@mikro-orm/mysql'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import {
  ArticleStatus,
  CodeTheme,
  CommentStatus,
  ContentFormat,
  DashboardStats,
  DEFAULT_MENUS,
  DEFAULT_THEME_COLOR,
  MenuItemConfig,
  normalizeArticleContent,
  SiteConfig,
  THEME_COLORS
} from '@xlt-blog/shared'
import { unlink } from 'node:fs/promises'
import { basename, join } from 'node:path'
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
  SaveAdminMenuDto,
  SaveArticleDto,
  SaveCategoryDto,
  SaveColumnDto,
  SaveFriendLinkDto,
  SavePageDto,
  SaveSettingsDto,
  SaveTagDto,
  SetColumnArticlesDto
} from './admin.dto'

const UPLOAD_DIR = join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads')

@Injectable()
export class AdminService {
  constructor(private readonly em: EntityManager) {}

  // ---------- 文章 ----------

  async listArticles(query: AdminArticleQueryDto) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 10, 100)
    const where: Record<string, unknown> = {}
    if (query.status) where.status = query.status
    if (query.keyword) where.title = { $like: `%${query.keyword}%` }

    const [items, total] = await this.em.findAndCount(Article, where, {
      populate: ['category', 'tags'],
      exclude: ['content'],
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

  private async applyArticleDto(article: Article, dto: SaveArticleDto) {
    article.title = dto.title
    article.slug = dto.slug
    article.summary = dto.summary ?? null
    article.contentFormat = dto.contentFormat ?? article.contentFormat ?? ContentFormat.Html
    try {
      article.content = normalizeArticleContent(dto.content, article.contentFormat)
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : '文章内容格式无效')
    }
    article.codeTheme = dto.codeTheme ?? article.codeTheme ?? CodeTheme.Github
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

  async createAttachment(data: { filename: string; url: string; mimeType: string; size: number }) {
    const attachment = this.em.create(Attachment, { ...data, createdAt: new Date() })
    await this.em.persistAndFlush(attachment)
    return attachment
  }

  async deleteAttachment(id: number) {
    const attachment = await this.em.findOneOrFail(Attachment, { id })
    await this.em.removeAndFlush(attachment)
    // 同步删除磁盘文件，文件不存在时忽略
    await unlink(join(UPLOAD_DIR, basename(attachment.url))).catch(() => {})
    return null
  }

  // ---------- 独立页面 ----------

  listPages() {
    return this.em.find(Page, {}, { exclude: ['content'], orderBy: { createdAt: 'DESC' } })
  }

  async getPage(id: number) {
    const page = await this.em.findOne(Page, { id })
    if (!page) throw new NotFoundException('页面不存在')
    return page
  }

  async createPage(dto: SavePageDto) {
    await this.ensurePageSlugUnique(dto.slug)
    const contentFormat = dto.contentFormat ?? ContentFormat.Html
    const page = this.em.create(Page, {
      title: dto.title,
      slug: dto.slug,
      contentFormat,
      content: this.normalizeContent(dto.content, contentFormat),
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
    page.contentFormat = dto.contentFormat ?? page.contentFormat ?? ContentFormat.Html
    page.content = this.normalizeContent(dto.content, page.contentFormat)
    page.status = dto.status ?? page.status
    await this.em.flush()
    return page
  }

  private normalizeContent(content: string, format: ContentFormat) {
    try {
      return normalizeArticleContent(content, format)
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
        exclude: ['content'],
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
      .map((menu) => ({
        id: Number(menu.id),
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
          // The supplied sys_menu data uses 0 for navigation-visible rows and 1 for hidden rows.
          isHide: menu.visible === '1',
          isKeepAlive: menu.keepAlive === '1',
          isIframe: menu.isIframe === '1',
          iframeUrl: menu.iframeUrl ?? undefined
        },
        children: this.buildMenuTree(menus, menu.id)
      }))
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
