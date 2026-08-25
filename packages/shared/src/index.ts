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

/** 公开专栏摘要 */
export interface ColumnDto {
  id: number
  name: string
  slug: string
  description: string | null
  cover: string | null
  status: ArticleStatus
  sort: number
  createdAt: string
  updatedAt: string
}

/** 专栏中按编排顺序展示的文章 */
export interface ColumnArticleDto {
  id: number
  title: string
  slug: string
  summary: string | null
  cover: string | null
  views: number
  publishedAt: string | null
}

export interface ColumnDetailDto extends ColumnDto {
  articles: ColumnArticleDto[]
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
  { label: '专栏', url: '/columns', sort: 2 },
  { label: '友链', url: '/friends', sort: 3 },
  { label: '关于', url: '/about', sort: 4 }
]

/** 站点公开配置 */
export interface SiteConfig {
  themeColor: string
  menus: MenuItemConfig[]
}

// ---------- 个人简历 ----------

export interface ResumeProfileDto {
  name: string
  headline: string
  summary: string
  experience: string
  education: string
  availability: string
  location: string
}

export interface ResumeDesiredPositionDto {
  position: string
  industry: string
  salary: string
}

export interface ResumeExperienceDto {
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

export interface ResumeProjectDto {
  id: string
  name: string
  role: string
  start: string
  end: string
  description: string
  stack: string[]
  highlights: string[]
}

export interface ResumeEducationDto {
  id: string
  school: string
  degree: string
  major: string
  start: string
  end: string
  description: string
}

/** 公开与后台共用的单份个人简历 */
export interface ResumeDto {
  profile: ResumeProfileDto
  desiredPosition: ResumeDesiredPositionDto
  skills: string[]
  experiences: ResumeExperienceDto[]
  projects: ResumeProjectDto[]
  education: ResumeEducationDto[]
}

/** 未保存时使用的简历初始内容，可通过后台“个人简历”页面覆盖。 */
export const DEFAULT_RESUME: ResumeDto = {
  profile: {
    name: '魏鹏程',
    headline: '前端开发工程师',
    summary: '专注于 Web 应用架构、工程化与多端交付，具备前后端协作、团队协作和项目推进经验。',
    experience: '7 年经验',
    education: '本科',
    availability: '在职，考虑机会',
    location: '福建'
  },
  desiredPosition: {
    position: 'Node.js / 前端开发工程师',
    industry: '行业不限',
    salary: '12–15K'
  },
  skills: ['HTML5', 'CSS', 'JavaScript', 'Vue 2', 'Vue 3', 'Pinia', 'Qiankun', 'UniApp', 'Node.js', 'NestJS', 'MySQL', 'Git'],
  experiences: [
    {
      id: 'guoke',
      company: '福建国科信息科技有限公司',
      title: '前端开发工程师',
      department: '软件研发中心',
      start: '2022.05',
      end: '至今',
      current: true,
      skills: ['Vue', 'HTML5', 'CSS', 'JavaScript'],
      highlights: [
        '主导 qiankun 微前端架构落地，抽离通用模板，支撑 5+ 子应用快速集成。',
        '搭建团队工程化体系，集成 ESLint、Prettier、Husky 等规范工具链。',
        '统筹前端任务、工时评估与跨职能协作，保障核心业务模块高质量交付。'
      ],
      responsibilities: [
        '负责前端架构设计与技术选型，保障项目的可扩展性和可维护性。',
        '沉淀组件库、工具库和开发规范，提升团队研发效能。',
        '参与生产部署与运维保障，快速定位和修复线上问题。'
      ]
    },
    {
      id: 'offcn',
      company: '北京中公教育科技有限公司福建分公司',
      title: 'Web 前端开发工程师',
      department: '网推部',
      start: '2020.03',
      end: '至今',
      current: true,
      skills: ['Vue', 'HTML5', 'JavaScript', 'CSS', 'UniApp'],
      highlights: ['负责小程序、后台管理系统与接口开发，参与需求研讨、交付和文档编写。'],
      responsibilities: ['完成业务功能的前后端开发与维护，支持小程序和管理端持续迭代。']
    },
    {
      id: 'weijian',
      company: '福建微建网络科技有限公司',
      title: 'PHP 开发工程师',
      department: '研发',
      start: '2019.12',
      end: '2020.03',
      current: false,
      skills: ['HTML', 'PHP', '微信小程序'],
      highlights: ['完成 PC 页面与微信小程序的开发、调试和维护。'],
      responsibilities: ['根据开发任务交付页面与功能模块。']
    }
  ],
  projects: [
    {
      id: 'huli-bike',
      name: '湖里城市大脑一期：共享单车',
      role: '前端开发工程师',
      start: '2023.01',
      end: '至今',
      description: '融合 AI 视频识别与大数据分析，实现单车违规停放识别、企业考核、区域热力分析与移动执法。',
      stack: ['Vue 3', 'Pinia', 'Element Plus', 'ECharts', 'ArcGIS API', 'UniApp'],
      highlights: ['搭建 PC 管理端与移动执法端架构，制定开发规范。', '实现 GIS 可视化、违规趋势和区域分析等核心模块。', '通过代码分割、资源压缩与 CDN 加速将首屏优化至 2 秒内。']
    },
    {
      id: 'huli-portal',
      name: '湖里城市大脑一期：统一门户',
      role: '前端开发工程师',
      start: '2023.01',
      end: '至今',
      description: '构建统一身份认证、权限管理、数据互通和业务系统集成的区级数字化治理门户。',
      stack: ['Vue 2', 'Vuex', 'Element UI', 'ArcGIS API for JavaScript'],
      highlights: ['负责前端架构与 UI 标准，协调三人前端团队交付。', '实现统一门户、数据看板与 GIS 地图能力。', '完成主流浏览器兼容与自动化构建部署流程。']
    },
    {
      id: 'talent-platform',
      name: '国网数字化人才培育评价平台',
      role: '前端工程师',
      start: '2022.05',
      end: '至今',
      description: '提供线上学习、线下培训关联和业绩评价查询的一站式数字化人才服务。',
      stack: ['Vue 3', 'Vuex', 'Qiankun', 'Element UI', 'UniApp'],
      highlights: ['独立完成学习中心、评价体系等 5+ 核心模块。', '搭建 CI/CD 发布流程，提升部署效率。', '承担需求拆解、现场部署与团队资源协调。']
    }
  ],
  education: [
    {
      id: 'uestc',
      school: '电子科技大学',
      degree: '本科 · 非全日制',
      major: '软件工程',
      start: '2017',
      end: '2021',
      description: '软件工程专业学习。'
    },
    {
      id: 'hnyh',
      school: '湖南石油化工职业技术学院',
      degree: '大专',
      major: '石油化工生产技术',
      start: '2014',
      end: '2017',
      description: ''
    }
  ]
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
