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

    /** 编辑器类型（与后端 EditorType 枚举一致）：决定 rawContent 结构与服务端转换器 */
    type EditorType = 'md' | 'tiptap' | 'domternal'

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
      /** 原始内容：md = Markdown 文本；tiptap / domternal = ProseMirror JSON 字符串 */
      rawContent: string
      /** 服务端统一转换 + 净化后的安全 HTML（前台展示用） */
      renderHtml: string
      editorType: EditorType
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
      rawContent: string
      editorType?: EditorType
      codeTheme?: CodeTheme
      cover?: string
      status?: ArticleStatus
      categoryId?: number
      tagIds?: number[]
    }

    interface ImportArticleDefaults {
      defaultCategoryId?: number
      defaultTagIds?: number[]
      defaultStatus?: ArticleStatus
    }

    interface ImportArticleResult {
      filename: string
      status: 'success' | 'failed'
      articleId?: number
      title?: string
      error?: string
    }

    interface ImportArticlesResult {
      results: ImportArticleResult[]
      total: number
      success: number
      failed: number
    }

    /** 内容预览：与保存共用服务端渲染管线，保证预览与发布一致 */
    interface PreviewContentParams {
      editorType: EditorType
      rawContent: string
      codeTheme?: CodeTheme
    }

    interface PreviewContentResult {
      html: string
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
      /** 原始内容（页面固定 Markdown） */
      rawContent: string
      editorType: EditorType
      status: ArticleStatus
      createdAt: string
      updatedAt: string
    }

    interface SavePage {
      title: string
      slug: string
      rawContent: string
      /** 页面编辑器固定为 Markdown，可不传 */
      editorType?: EditorType
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

    interface ResumeProfile {
      name: string
      headline: string
      summary: string
      experience: string
      education: string
      availability: string
      location: string
    }

    interface ResumeDesiredPosition {
      position: string
      industry: string
      salary: string
    }

    interface ResumeExperience {
      id: string
      company: string
      title: string
      department: string
      start: string
      end: string
      current: boolean
      skills: string[]
      highlights: string[]
      responsibilities: string[]
    }

    interface ResumeProject {
      id: string
      name: string
      role: string
      start: string
      end: string
      description: string
      stack: string[]
      highlights: string[]
    }

    interface ResumeEducation {
      id: string
      school: string
      degree: string
      major: string
      start: string
      end: string
      description: string
    }

    interface Resume {
      profile: ResumeProfile
      desiredPosition: ResumeDesiredPosition
      skills: string[]
      experiences: ResumeExperience[]
      projects: ResumeProject[]
      education: ResumeEducation[]
    }

    type StorageBackend = 'local' | 'rusfs' | 's3'
    type StorageS3Provider = 'aws' | 'huawei-obs' | 'aliyun-oss' | 'tencent-cos' | 'custom'

    interface StorageRemoteConfig {
      endpoint?: string
      bucket: string
      accessKey: string
      secretKey: string
      region?: string
      pathStyle?: boolean
      publicUrlBase?: string
    }

    interface StorageConfig {
      active: StorageBackend
      local: {
        publicUrlPrefix?: string
      }
      rusfs: StorageRemoteConfig
      s3: StorageRemoteConfig & {
        provider: StorageS3Provider
      }
    }

    type StorageConfigInput = Partial<StorageConfig>

    interface StorageTestResult {
      success: boolean
      message: string
    }

    interface StorageMigrationResult {
      total: number
      migrated: number
      failed: number
      failures: Array<{
        id: number
        filename: string
        error: string
      }>
    }

    interface UploadResult {
      url: string
    }
  }
}
