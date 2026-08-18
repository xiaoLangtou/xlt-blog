declare namespace Api {
  namespace Blog {
    type ArticleStatus = 'draft' | 'published'
    type CommentStatus = 'pending' | 'approved' | 'rejected'

    interface PageQuery {
      page?: number
      pageSize?: number
    }

    interface Paginated<T> {
      items: T[]
      total: number
      page: number
      pageSize: number
    }

    interface Category {
      id: number
      name: string
      slug: string
      description: string | null
      sort: number
      articleCount?: number
    }

    interface Tag {
      id: number
      name: string
      slug: string
      color: string | null
      icon: string | null
      articleCount?: number
    }

    interface Column {
      id: number
      name: string
      slug: string
      description: string | null
      cover: string | null
      status: ArticleStatus
      sort: number
      articleCount?: number
      createdAt: string
      updatedAt: string
    }

    interface ColumnArticleItem {
      id: number
      title: string
      sort: number
    }

    interface ColumnDetail extends Column {
      articles: ColumnArticleItem[]
    }

    type CodeTheme = 'github' | 'atom'

    type ContentFormat = 'markdown' | 'html' | 'domternal'

    interface Article {
      id: number
      title: string
      slug: string
      summary: string | null
      cover: string | null
      status: ArticleStatus
      views: number
      category: Category | null
      tags: Tag[]
      publishedAt: string | null
      createdAt: string
      updatedAt: string
    }

    interface ArticleDetail extends Article {
      content: string
      contentFormat: ContentFormat
      codeTheme: CodeTheme
    }

    interface ArticleQuery extends PageQuery {
      keyword?: string
      status?: ArticleStatus
    }

    interface TagQuery extends PageQuery {
      keyword?: string
    }

    interface ColumnQuery extends PageQuery {
      keyword?: string
      status?: ArticleStatus
    }

    interface SaveArticle {
      title: string
      slug: string
      summary?: string
      content: string
      contentFormat?: ContentFormat
      codeTheme?: CodeTheme
      cover?: string
      status?: ArticleStatus
      categoryId?: number
      tagIds?: number[]
    }

    interface SaveCategory {
      name: string
      slug: string
      description?: string
      sort?: number
    }

    interface SaveTag {
      name: string
      slug: string
      color?: string | null
      icon?: string | null
    }

    interface SaveColumn {
      name: string
      description?: string | null
      cover?: string | null
      status?: ArticleStatus
      sort?: number
    }

    interface Comment {
      id: number
      nickname: string
      email: string | null
      content: string
      status: CommentStatus
      parentId: number | null
      articleId: number
      articleTitle?: string
      createdAt: string
      children?: Comment[]
    }

    interface CommentQuery extends PageQuery {
      status?: CommentStatus
      keyword?: string
      articleId?: number
      order?: 'asc' | 'desc'
    }

    interface Attachment {
      id: number
      filename: string
      url: string
      mimeType: string
      size: number
      createdAt: string
    }

    type AttachmentCategory = 'image' | 'video' | 'audio' | 'doc' | 'archive' | 'other'

    interface AttachmentQuery extends PageQuery {
      keyword?: string
      category?: AttachmentCategory | 'all'
      sort?: 'date' | 'name' | 'size'
    }

    interface AttachmentStats {
      total: number
      totalSize: number
      todayCount: number
      imageRatio: number
      categoryCounts: Record<AttachmentCategory, number>
    }

    interface Page {
      id: number
      title: string
      slug: string
      content: string
      status: ArticleStatus
      createdAt: string
      updatedAt: string
    }

    interface SavePage {
      title: string
      slug: string
      content: string
      status?: ArticleStatus
    }

    interface FriendLink {
      id: number
      name: string
      url: string
      logo: string | null
      description: string | null
      sort: number
    }

    interface SaveFriendLink {
      name: string
      url: string
      logo?: string
      description?: string
      sort?: number
    }

    interface SiteSettings {
      themeColor: string
      menus: Array<{ label: string; url: string; sort: number }>
    }

    interface UploadResult {
      url: string
    }
  }
}
