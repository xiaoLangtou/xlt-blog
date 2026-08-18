/**
 * Query Key 工厂
 *
 * 统一管理 TanStack Query 的 queryKey，便于缓存失效与类型推导。
 *
 * @module utils/query/keys
 */

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    captcha: () => [...queryKeys.auth.all, 'captcha'] as const,
    userInfo: () => [...queryKeys.auth.all, 'userInfo'] as const
  },
  menu: {
    all: ['menu'] as const,
    list: (params: { userId?: number | string; mode: string }) =>
      [...queryKeys.menu.all, 'list', params] as const
  },
  system: {
    all: ['system'] as const,
    users: (params?: Api.User.UserSearchParams) =>
      [...queryKeys.system.all, 'users', params] as const,
    roles: (params?: Api.Role.RoleSearchParams) =>
      [...queryKeys.system.all, 'roles', params] as const,
    menus: () => [...queryKeys.system.all, 'menus'] as const,
    depts: (params?: Api.Dept.DeptSearchParams) =>
      [...queryKeys.system.all, 'depts', params] as const,
    dicts: () => [...queryKeys.system.all, 'dicts'] as const
  },
  dept: {
    all: ['dept'] as const,
    list: (params?: Api.Dept.DeptSearchParams) => [...queryKeys.dept.all, 'list', params] as const,
    tree: () => [...queryKeys.dept.all, 'tree'] as const,
    detail: (id: number | string) => [...queryKeys.dept.all, 'detail', id] as const
  },
  post: {
    all: ['post'] as const,
    list: (params?: Api.Post.PostSearchParams) => [...queryKeys.post.all, 'list', params] as const,
    detail: (id: number | string) => [...queryKeys.post.all, 'detail', id] as const
  },
  apiManage: {
    all: ['apiManage'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.apiManage.all, 'list', params] as const,
    groups: () => [...queryKeys.apiManage.all, 'groups'] as const,
    detail: (id: number | string) => [...queryKeys.apiManage.all, 'detail', id] as const
  },
  logger: {
    all: ['logger'] as const,
    list: (params?: Api.Logger.LogSearchParams) =>
      [...queryKeys.logger.all, 'list', params] as const,
    detail: (id: number) => [...queryKeys.logger.all, 'detail', id] as const
  },
  cache: {
    all: ['cache'] as const,
    info: () => [...queryKeys.cache.all, 'info'] as const
  },
  blog: {
    all: ['blog'] as const,
    articles: (params?: Api.Blog.ArticleQuery) =>
      [...queryKeys.blog.all, 'articles', params] as const,
    article: (id: number) => [...queryKeys.blog.all, 'article', id] as const,
    categories: () => [...queryKeys.blog.all, 'categories'] as const,
    tags: () => [...queryKeys.blog.all, 'tags'] as const,
    comments: (params?: Api.Blog.CommentQuery) =>
      [...queryKeys.blog.all, 'comments', params] as const,
    attachments: (params?: Api.Blog.PageQuery) =>
      [...queryKeys.blog.all, 'attachments', params] as const
  }
} as const
