export * from './content/table-html'

/** 文章状态 */
export enum ArticleStatus {
  Draft = 'draft',
  Published = 'published'
}

/** 文章代码块主题 */
export enum CodeTheme {
  Github = 'github',
  Atom = 'atom'
}

/** 编辑器类型：决定 rawContent 结构与转换器选择 */
export enum EditorType {
  /** Markdown 源码 */
  MD = 'md',
  /** TipTap ProseMirror JSON */
  TIPTAP = 'tiptap',
  /** Domternal ProseMirror JSON */
  DOMTERNAL = 'domternal'
}

/**
 * 当前渲染器版本：转换器 / sanitize 白名单 / 高亮方案升级时递增，
 * 存量内容通过批量重渲染接口回刷 renderHtml。
 */
export const CURRENT_RENDERER_VERSION = 1

/** 评论状态 */
export enum CommentStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected'
}

/** 统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}

/** 分页查询参数 */
export interface PageQuery {
  page?: number
  pageSize?: number
}

/** 分页响应 */
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string | null
  createdAt: string
}

export interface CategoryDto {
  id: number
  name: string
  slug: string
  description: string | null
  sort: number
  articleCount?: number
}

export interface TagDto {
  id: number
  name: string
  slug: string
  color: string | null
  icon: string | null
  articleCount?: number
}

export interface ArticleListItemDto {
  id: number
  title: string
  slug: string
  summary: string | null
  cover: string | null
  status: ArticleStatus
  views: number
  category: CategoryDto | null
  tags: TagDto[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ArticleDetailDto extends ArticleListItemDto {
  /** 渲染后的安全 HTML（保存时由后端统一转换 + 净化生成） */
  renderHtml: string
  editorType: EditorType
  codeTheme: CodeTheme
}

export interface CommentDto {
  id: number
  nickname: string
  content: string
  status: CommentStatus
  parentId: number | null
  articleId: number
  articleTitle?: string
  createdAt: string
  children?: CommentDto[]
}

/** 归档条目：按年月分组 */
export interface ArchiveGroup {
  year: number
  month: number
  articles: Pick<ArticleListItemDto, 'id' | 'title' | 'slug' | 'publishedAt'>[]
}

/** 站点公开统计 */
export interface SiteStats {
  articleCount: number
  categoryCount: number
  tagCount: number
  totalViews: number
}

/** 后台仪表盘统计 */
export interface DashboardStats extends SiteStats {
  draftCount: number
  pendingCommentCount: number
  recentArticles: ArticleListItemDto[]
}

// ---------- 主题色 ----------

/** 预设主题色板：50~950 色阶 */
export interface ThemePalette {
  /** 色板标识，存入设置 */
  name: string
  /** 中文名 */
  label: string
  colors: Record<
    '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950',
    string
  >
}

/** 参考 art-design-pro systemMainColor 的主题色系（600 阶为原色值） */
export const THEME_COLORS: ThemePalette[] = [
  {
    name: 'dai',
    label: '黛蓝',
    colors: {
      50: '#f0f5ff',
      100: '#e0eaff',
      200: '#c2d5fb',
      300: '#97b6f5',
      400: '#6690ee',
      500: '#3e6ee8',
      600: '#2255e0',
      700: '#1b43b8',
      800: '#1a3a92',
      900: '#1a3374',
      950: '#122045'
    }
  },
  {
    name: 'zhuqing',
    label: '竹青',
    colors: {
      50: '#ecfdf7',
      100: '#d1faec',
      200: '#a7f3da',
      300: '#6ee7bf',
      400: '#34d3a0',
      500: '#10b585',
      600: '#008b6e',
      700: '#047a60',
      800: '#06614e',
      900: '#065041',
      950: '#022d26'
    }
  },
  {
    name: 'zitang',
    label: '紫棠',
    colors: {
      50: '#f4f2fc',
      100: '#ebe7fa',
      200: '#d9d2f5',
      300: '#beb0ec',
      400: '#a087e1',
      500: '#8563d5',
      600: '#6045c8',
      700: '#5636ab',
      800: '#472e8c',
      900: '#3c2973',
      950: '#251847'
    }
  },
  {
    name: 'zheshi',
    label: '赭石',
    colors: {
      50: '#fdf6ef',
      100: '#f9e9d9',
      200: '#f2d0b2',
      300: '#e9b081',
      400: '#df864e',
      500: '#d0682a',
      600: '#b85010',
      700: '#9a3f12',
      800: '#7c3316',
      900: '#652b15',
      950: '#37140a'
    }
  },
  {
    name: 'dailv',
    label: '黛绿',
    colors: {
      50: '#f0f9f5',
      100: '#dbf0e6',
      200: '#bae0d0',
      300: '#8cc9b2',
      400: '#5aab90',
      500: '#388f75',
      600: '#217a60',
      700: '#1d624e',
      800: '#1a4e40',
      900: '#164036',
      950: '#0b241e'
    }
  }
]

export const DEFAULT_THEME_COLOR = 'dai'

// ---------- 站点配置 ----------

/** 导航菜单项（单层） */
export interface MenuItemConfig {
  label: string
  url: string
  sort: number
}

/** 默认菜单：未配置时的回落 */
export const DEFAULT_MENUS: MenuItemConfig[] = [
  { label: '文章', url: '/', sort: 0 },
  { label: '归档', url: '/archive', sort: 1 },
  { label: '友链', url: '/friends', sort: 2 },
  { label: '关于', url: '/about', sort: 3 }
]

/** 站点公开配置 */
export interface SiteConfig {
  themeColor: string
  menus: MenuItemConfig[]
}

// ---------- 附件 ----------

export interface AttachmentDto {
  id: number
  filename: string
  url: string
  mimeType: string
  size: number
  createdAt: string
}

// ---------- 独立页面 ----------

export interface PageDto {
  id: number
  title: string
  slug: string
  /** 渲染后的安全 HTML */
  renderHtml: string
  editorType: EditorType
  status: ArticleStatus
  createdAt: string
  updatedAt: string
}

// ---------- 友情链接 ----------

export interface FriendLinkDto {
  id: number
  name: string
  url: string
  logo: string | null
  description: string | null
  sort: number
}
