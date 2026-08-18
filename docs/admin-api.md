# 栖迟博客后台 API 文档

> **用途**：本文件记录 Nest 服务端与 `apps/art-design-pro` 管理控制台之间的博客后台 API 契约。
>
> **重要说明**：这不是后端 OpenAPI 定义。HTTP 路径、方法、请求体和响应字段应以后端 DTO、控制器与正式 OpenAPI（如提供）为准。

## 1. 服务约定

| 项目 | 约定 |
| --- | --- |
| 默认 API 前缀 | `/api` |
| 管理控制台 | `apps/art-design-pro` |
| 开发代理目标 | `VITE_API_PROXY_URL`；本地为 `http://localhost:3000` |
| 鉴权 | 控制台会话中保存 Token，并添加 `Authorization: Bearer <token>` |
| 业务响应包 | `{ code: number, data: T, message: string }` |
| 前端解包方式 | 前端只返回并消费 `response.data.data` |
| HTTP 错误处理 | 优先显示 `error.response.data.message`，再回退浏览器/网络错误文本 |

以下接口路径均相对于 API 前缀。例如默认开发环境的登录地址是 `/api/auth/login`。

## 2. 会话与认证

### 控制台会话

Art Design Pro 使用 Pinia 持久化登录状态和访问令牌。退出时会调用服务端退出接口，并清空本地会话。

### 用户对象

```ts
interface User {
  id: number
  username: string
  nickname: string
  avatar: string | null
  createdAt: string
}
```

| 方法 | 路径 | 请求体 / 参数 | 前端使用的 `data` | 调用位置 |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/login` | `{ username: string, password: string }` | `{ token: string, user: User }` | 登录表单、用户 Store |
| `POST` | `/auth/logout` | 无 | 无 | 用户 Store 退出流程 |
| `GET` | `/auth/me` | 无 | `User` | 路由权限初始化 |
| `PUT` | `/auth/profile` | `{ nickname: string, avatar: string \| null }` | `User` | 用户资料功能预留 |
| `PUT` | `/auth/password` | `{ oldPassword: string, newPassword: string }` | 无 | 修改密码功能 |

## 3. 通用数据模型

### 分页

```ts
interface Pagination<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
```

列表接口由调用页面传递 `page`、`pageSize` 及筛选条件。旧前端不会校验服务端回传的 `page` 和 `pageSize`，但会使用 `items`、`total`。

### 分类与标签

```ts
interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  sort: number
}

interface Tag {
  id: number
  name: string
  slug: string
}
```

### 文章

```ts
interface Article {
  id: number
  title: string
  slug: string
  summary: string | null
  content?: string
  cover: string | null
  status: 'draft' | 'published'
  views: number
  category: Category | null
  tags: Tag[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}
```

### 其他资源

```ts
interface Comment {
  id: number
  nickname: string
  email: string | null
  content: string
  status: 'pending' | 'approved'
  parentId: number | null
  articleId: number
  articleTitle: string
  createdAt: string
}

interface Attachment {
  id: number
  filename: string
  url: string
  mimeType: string
  size: number
  createdAt: string
}

interface Page {
  id: number
  title: string
  slug: string
  content?: string
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

interface FriendLink {
  id: number
  name: string
  url: string
  logo: string | null
  description: string | null
  sort: number
}
```

## 4. 管理接口

### 4.1 仪表盘

```ts
interface Dashboard {
  articleCount: number
  draftCount: number
  categoryCount: number
  tagCount: number
  pendingCommentCount: number
  totalViews: number
  recentArticles: Article[]
}
```

| 方法 | 路径 | 请求 | `data` | 调用页面 |
| --- | --- | --- | --- | --- |
| `GET` | `/admin/dashboard` | 无 | `Dashboard` | 后台首页 |

### 4.2 文章

| 方法 | 路径 | 请求 | `data` | 调用页面 / 用途 |
| --- | --- | --- | --- | --- |
| `GET` | `/admin/articles` | Query：`page`、`pageSize`、可选 `keyword`、可选 `status` | `Pagination<Article>` | 文章列表 |
| `GET` | `/admin/articles/:id` | 路径参数 `id` | `Article`（编辑时需要 `content`） | 文章编辑 |
| `POST` | `/admin/articles` | 文章表单：`title`、`slug`、`summary`、`content`、`cover`、`status`、`categoryId`、`tagIds` | `Article` | 新建文章 |
| `PUT` | `/admin/articles/:id` | 同新建文章表单 | `Article` | 编辑文章 |
| `PUT` | `/admin/articles/:id/publish` | 无 | `Article` | 发布文章 |
| `PUT` | `/admin/articles/:id/unpublish` | 无 | `Article` | 转为草稿 |
| `DELETE` | `/admin/articles/:id` | 无 | 无 | 删除文章 |

旧前端在保存前要求 `title` 和 `content` 非空；`slug` 为空时由前端基于标题生成。`categoryId` 可省略，`tagIds` 是数字数组。

### 4.3 分类

| 方法 | 路径 | 请求体 | `data` | 调用页面 |
| --- | --- | --- | --- | --- |
| `GET` | `/admin/categories` | 无 | `Category[]` | 分类管理、文章编辑 |
| `POST` | `/admin/categories` | `Partial<Category>`；旧表单提供 `name`、`slug`、`description`、`sort` | `Category` | 新增分类 |
| `PUT` | `/admin/categories/:id` | 同新增分类 | `Category` | 编辑分类 |
| `DELETE` | `/admin/categories/:id` | 无 | 无 | 删除分类 |

旧前端要求 `name` 与 `slug` 非空。

### 4.4 标签

| 方法 | 路径 | 请求体 | `data` | 调用页面 |
| --- | --- | --- | --- | --- |
| `GET` | `/admin/tags` | 无 | `Tag[]` | 标签管理、文章编辑 |
| `POST` | `/admin/tags` | `Partial<Tag>`；旧表单提供 `name`、`slug` | `Tag` | 新增标签 |
| `PUT` | `/admin/tags/:id` | 同新增标签 | `Tag` | 编辑标签 |
| `DELETE` | `/admin/tags/:id` | 无 | 无 | 删除标签 |

旧前端要求 `name` 与 `slug` 非空。

### 4.5 评论

| 方法 | 路径 | 请求 | `data` | 调用页面 / 用途 |
| --- | --- | --- | --- | --- |
| `GET` | `/admin/comments` | Query：`page`、`pageSize`、可选 `status`（`pending` 或 `approved`） | `Pagination<Comment>` | 评论管理 |
| `PUT` | `/admin/comments/:id/approve` | 无 | `Comment` | 通过评论 |
| `PUT` | `/admin/comments/:id/reject` | 无 | `Comment` | 撤回审核（旧 UI 文案） |
| `DELETE` | `/admin/comments/:id` | 无 | 无 | 删除评论 |

### 4.6 附件与上传

| 方法 | 路径 | 请求 | `data` | 调用页面 / 用途 |
| --- | --- | --- | --- | --- |
| `GET` | `/admin/attachments` | Query：`page`、`pageSize` | `Pagination<Attachment>` | 媒体库 |
| `POST` | `/admin/upload` | `multipart/form-data`，字段名为 `file` | `{ url: string }` | 图片上传 |
| `DELETE` | `/admin/attachments/:id` | 无 | 无 | 删除附件 |

旧 UI 只允许选择 `image/*`，但客户端不会进一步验证 MIME 类型或尺寸限制；这些限制应由服务端明确实施。

### 4.7 独立页面

| 方法 | 路径 | 请求体 / 参数 | `data` | 调用页面 |
| --- | --- | --- | --- | --- |
| `GET` | `/admin/pages` | 无 | `Page[]` | 独立页面列表 |
| `GET` | `/admin/pages/:id` | 路径参数 `id` | `Page`（编辑时需要 `content`） | 独立页面编辑 |
| `POST` | `/admin/pages` | `Partial<Page>`；旧表单提供 `title`、`slug`、`content`、`status` | `Page` | 新增页面 |
| `PUT` | `/admin/pages/:id` | 同新增页面 | `Page` | 编辑页面 |
| `DELETE` | `/admin/pages/:id` | 无 | 无 | 删除页面 |

旧前端要求 `title`、`slug`、`content` 非空，`status` 是 `draft` 或 `published`。

### 4.8 友情链接

| 方法 | 路径 | 请求体 | `data` | 调用页面 |
| --- | --- | --- | --- | --- |
| `GET` | `/admin/links` | 无 | `FriendLink[]` | 友情链接 |
| `POST` | `/admin/links` | `Partial<FriendLink>`；旧表单提供 `name`、`url`、`logo`、`description`、`sort` | `FriendLink` | 新增友链 |
| `PUT` | `/admin/links/:id` | 同新增友链 | `FriendLink` | 编辑友链 |
| `DELETE` | `/admin/links/:id` | 无 | 无 | 删除友链 |

旧前端要求 `name` 与 `url` 非空。

### 4.9 AI

```ts
type AiAction =
  | 'rephrase'
  | 'expand'
  | 'shorten'
  | 'continue'
  | 'summarize'
  | 'grammar'
  | 'translate'
  | 'prompt'

interface AiCompleteRequest {
  action: AiAction
  text: string
  instruction?: string
}

interface AiCompleteResult {
  text: string
}
```

| 方法 | 路径 | 请求 | `data` | 调用页面 / 用途 |
| --- | --- | --- | --- | --- |
| `POST` | `/admin/ai` | `AiCompleteRequest`；`text` 最长 20000；`action` 为 `prompt` 时 `instruction` 必填 | `{ text: string }` | 文章编辑器 AI 命令 |

密钥只配置在服务端 `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL`。前端 axios 超时需单独设为 120 秒。完整接入步骤见 [tiptap-ai.md](./tiptap-ai.md)。

### 4.10 站点设置

```ts
interface SiteSettings {
  themeColor: string
  menus: Array<{
    label: string
    url: string
    sort: number
  }>
}
```

| 方法 | 路径 | 请求体 | `data` | 调用页面 |
| --- | --- | --- | --- | --- |
| `GET` | `/admin/settings` | 无 | `SiteSettings` | 站点设置 |
| `PUT` | `/admin/settings` | `SiteSettings` | `SiteSettings` | 保存站点设置 |

旧 UI 的主题色候选值为 `blue`、`green`、`purple`、`orange`、`red`。保存导航时会将 `sort` 转为数字。

## 5. 页面—接口对应总览

| 页面 | 接口 |
| --- | --- |
| 登录 | `POST /auth/login` |
| 退出 / 会话恢复 | `POST /auth/logout`、`GET /auth/me` |
| 修改密码 | `PUT /auth/password` |
| 仪表盘 | `GET /admin/dashboard` |
| 文章列表 | `GET /admin/articles`、`PUT /admin/articles/:id/(un)publish`、`DELETE /admin/articles/:id` |
| 文章编辑 | `GET /admin/articles/:id`、`POST/PUT /admin/articles`、`GET /admin/categories`、`GET /admin/tags`、`POST /admin/ai` |
| 分类管理 | `/admin/categories` CRUD |
| 标签管理 | `/admin/tags` CRUD |
| 评论管理 | `GET /admin/comments`、`PUT /admin/comments/:id/(approve|reject)`、`DELETE /admin/comments/:id` |
| 媒体库 | `GET /admin/attachments`、`POST /admin/upload`、`DELETE /admin/attachments/:id` |
| 独立页面 | `/admin/pages` CRUD |
| 友情链接 | `/admin/links` CRUD |
| 站点设置 | `GET/PUT /admin/settings` |

## 6. 后续重新接入前必须确认的事项

1. 后端是否在 `code` 非成功时仍以 HTTP 2xx 返回；旧前端会直接取 `data`，未依据 `code` 显式拒绝。
2. 各创建/更新接口的字段必填性、最大长度、唯一性规则与错误码。
3. 分页接口支持的全部筛选字段、排序字段、最大 `pageSize`。
4. 上传文件大小、允许 MIME 类型、对象存储 URL 是否为永久公开地址。
5. Token 的有效期、刷新机制、过期响应的状态码，以及是否需要 CSRF 防护。
6. `reject` 评论接口的真实语义（旧 UI 显示为“撤回审核”）。
7. 生产环境的 API 域名、反向代理路径与跨域策略。
