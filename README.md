# 栖迟 · xlt-blog

一个基于 **pnpm monorepo** 的个人博客系统。刊名取自《诗经·陈风·衡门》——「衡门之下，可以栖迟」，取意为简陋的居所亦可安然栖息。

项目由三端组成：

| 端 | 技术栈 | 目录 | 用途 |
| --- | --- | --- | --- |
| 前台 | Nuxt 4 + Nuxt UI（SSR） | `apps/web` | 面向读者的博客站点 |
| 后台 | Vue 3 + Vite + Element Plus / Tailwind | `apps/art-design-pro` | 写作与内容管理工作台 |
| 服务端 | NestJS 11 + MikroORM + MySQL | `apps/server` | 统一 REST API |

---

## 目录

1. [技术栈](#技术栈)
2. [仓库结构](#仓库结构)
3. [架构与数据流](#架构与数据流)
4. [数据模型](#数据模型)
5. [API 概览](#api-概览)
6. [快速开始](#快速开始)
7. [环境变量](#环境变量)
8. [常用命令](#常用命令)
9. [文档索引](#文档索引)

---

## 技术栈

### 服务端 `apps/server`

- [NestJS](https://nestjs.com/) 11 — 模块化后端框架
- [MikroORM](https://mikro-orm.io/) 6 — TypeScript ORM（MySQL 驱动），含 Migrations 与 Seeders
- [@xlt-token/nestjs](https://www.npmjs.com/package/@xlt-token/nestjs) — 令牌鉴权（白名单模式，管理接口用 `@XltCheckLogin()` 标注）
- `bcryptjs` 密码哈希、`class-validator` / `class-transformer` 请求校验、`multer` 文件上传

### 前台 `apps/web`

- [Nuxt](https://nuxt.com/) 4（SSR / SEO 友好，正文在服务端完成 Markdown 渲染）
- [Nuxt UI](https://ui.nuxt.com/) 4 — 组件库
- [@nuxtjs/sitemap](https://nuxt.com/modules/sitemap) — 站点地图
- [markdown-it](https://github.com/markdown-it/markdown-it) + [Shiki](https://shiki.style/) — Markdown 渲染与代码高亮
- [@vueuse/motion](https://motion.vueuse.org/) — 入场动画

### 后台 `apps/art-design-pro`

- Vue 3 + Vite + TypeScript，基于 **fantastic-admin** 后台模板二次开发
- [Element Plus](https://element-plus.org/) + Tailwind CSS（双 UI 体系并存）
- [Pinia](https://pinia.vuejs.org/) + pinia-plugin-persistedstate（会话持久化）
- [TanStack Vue Query](https://tanstack.com/query/latest/docs/framework/vue/overview)（`@tanstack/vue-query`）— 服务端状态管理
- [TipTap 3](https://tiptap.dev/) + `tiptap-markdown` — 富文本编辑器（正文存 Markdown）
- md-editor-v3 / wangEditor — Markdown 与富文本编辑的辅助组件
- ECharts 6、XGPlayer、xlsx 等

### 工程化

- **pnpm** 11 + workspaces（`apps/*`、`packages/*`），catalog 统一依赖版本
- UnoCSS + Tailwind（根配置 `uno.config.ts` 供 `@fantastic-admin/*` 包使用）
- TypeScript（严格模式）、oxlint / oxfmt / stylelint（后台）、Nest CLI（服务端）
- Docker Compose 提供 MySQL 8.4

---

## 仓库结构

```
xlt-blog/
├── apps/
│   ├── server/              # NestJS 服务端（@xlt-blog/server）
│   ├── web/                 # Nuxt 前台（@xlt-blog/web）
│   └── art-design-pro/      # 管理后台（art-design-pro，fantastic-admin 模板）
├── packages/
│   ├── shared/              # @xlt-blog/shared —— 前后端共享的类型、枚举、常量（tsdown 打包）
│   ├── components/          # @fantastic-admin/components —— 后台通用组件
│   ├── composables/         # @fantastic-admin/composables —— 后台组合式函数
│   ├── settings/            # @fantastic-admin/settings —— 后台设置定义与合并
│   ├── themes/              # @fantastic-admin/themes —— 浅/深色主题 CSS 变量
│   ├── types/               # @fantastic-admin/types —— 后台类型声明
│   ├── hotkeys/             # @fantastic-admin/hotkeys —— 快捷键
│   ├── copyright/           # @fantastic-admin/copyright —— 构建产物版权 banner
│   └── iconify-tools/       # @fantastic-admin/iconify-tools —— iconify 图标收集 CLI
├── docs/
│   ├── admin-api.md         # 后台 API 契约文档
│   └── tiptap-ai.md         # TipTap 自研 AI 接入说明
├── scripts/
│   └── cli.ts               # 交互式 dev/build/serve 脚本选择器
├── 原型/                     # 仪表盘设计原型（HTML）
├── blog-admin-prototype.html # 后台原型单文件
├── docker-compose.yml        # MySQL 8.4
├── uno.config.ts             # UnoCSS 配置（shadcn 风格主题）
└── package.json              # 根脚本
```

---

## 架构与数据流

```
┌──────────────┐        ┌──────────────┐
│  apps/web     │ 直连   │ apps/server   │
│  Nuxt (SSR)   ├───────▶│  NestJS       │
└──────────────┘  /api  └──────┬───────┘
                               │ MikroORM
┌──────────────┐               ▼
│ art-design-pro│  /api  ┌──────────────┐
│  Vue 管理后台  ├───────▶│   MySQL 8.4   │
└──────────────┘        └──────────────┘
        │
        └───── @xlt-blog/shared（类型/枚举/常量，三端共享）
```

- **统一响应**：服务端通过 `TransformInterceptor` 将所有成功响应包装为 `{ code: 0, data, message: 'ok' }`；`GlobalExceptionFilter` 将异常包装为 `{ code: HTTP状态码, data: null, message }`。
- **全局前缀**：所有接口挂在 `/api` 下（`app.setGlobalPrefix('api')`）。
- **鉴权**：白名单模式（`defaultCheck: false`）——前台公开接口默认放行，后台 `AdminController` 类级 `@XltCheckLogin()` 要求 `Authorization: Bearer <token>`。
- **跨域**：服务端已开启 CORS（`origin: true, credentials: true`），前台直连后端。
- **图片上传**：前台通过 Nuxt `routeRules` 将 `/uploads/**` 代理到后端，保证统一相对路径。
- **SSR**：前台在服务端渲染阶段即完成取数与 Markdown 高亮，查看网页源码可见正文（SEO 友好）。

### 模块划分（服务端）

| 模块 | 文件 | 职责 |
| --- | --- | --- |
| `BlogModule` | `src/blog/*` | 前台公开接口：文章、分类、标签、归档、评论、站点配置/统计、友链、独立页面 |
| `AuthModule` | `src/auth/*` | 登录 / 退出 / 当前用户 / 修改资料 / 修改密码 |
| `AdminModule` | `src/admin/*` | 后台管理：仪表盘、文章、分类、标签、评论、设置、附件、页面、友链、菜单、AI、上传 |
| 公共 | `src/common/*` | 全局异常过滤器、响应包装拦截器 |

---

## 数据模型

实体位于 `apps/server/src/entities/`，由 MikroORM 映射到 MySQL 表：

| 实体 | 表名 | 说明 |
| --- | --- | --- |
| `User` | `users` | 管理员账号（`password` 为 bcrypt hash，`hidden` 不对外返回） |
| `Article` | `articles` | 文章（Markdown 原文，`draft/published` 状态，关联分类/标签，浏览计数） |
| `Category` | `categories` | 分类（唯一 `name`/`slug`，排序） |
| `Tag` | `tags` | 标签（唯一 `name`/`slug`，与文章多对多） |
| `Comment` | `comments` | 评论（`pending/approved`，支持一层父评论回复） |
| `Page` | `pages` | 独立页面（关于/友链等常设页面） |
| `FriendLink` | `friend_links` | 友情链接 |
| `Attachment` | `attachments` | 上传的图片附件记录 |
| `Setting` | `settings` | 键值站点配置（`themeColor`、`menus`，JSON 值） |
| `AdminMenu` | `admin_menus` | 后台菜单（历史结构，已迁移至 `SysMenu`） |
| `SysMenu` | `sys_menu` | 后台动态菜单（树形，供 art-design-pro 动态路由使用） |

共享的 DTO / 枚举 / 常量定义在 `packages/shared/src/index.ts`（`ArticleStatus`、`CommentStatus`、`ApiResponse`、分页结构、主题色板 `THEME_COLORS`、`DEFAULT_MENUS` 等）。

---

## API 概览

> 完整契约见 [`docs/admin-api.md`](docs/admin-api.md)，此处仅列关键端点。所有路径均相对 `/api` 前缀。

### 前台公开接口（`BlogController`）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/articles` | 文章列表（分页 + `category`/`tag`/`keyword` 过滤） |
| GET | `/articles/:slug` | 文章详情（自增浏览量） |
| GET | `/articles/:slug/comments` | 文章已审核评论 |
| POST | `/articles/:slug/comments` | 提交评论（默认待审核） |
| GET | `/categories` | 分类列表（含文章数） |
| GET | `/tags` | 标签列表（含文章数） |
| GET | `/archive` | 按年月归档 |
| GET | `/site/stats` | 站点统计（文章/分类/标签/总浏览量） |
| GET | `/site/config` | 站点配置（主题色 + 菜单） |
| GET | `/links` | 友情链接 |
| GET | `/pages/:slug` | 独立页面 |

### 认证接口（`AuthController`）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/auth/login` | 登录，返回 `{ token, user }` |
| POST | `/auth/logout` | 退出（需登录） |
| GET | `/auth/me` | 当前用户（需登录） |
| PUT | `/auth/profile` | 更新昵称/头像（需登录） |
| PUT | `/auth/password` | 修改密码（需登录，改后强制下线） |

### 后台管理接口（`AdminController`，全部需登录）

仪表盘、文章（含发布/转草稿）、分类、标签、评论（审核）、站点设置、附件、独立页面、友情链接、后台菜单的完整 CRUD，以及：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/admin/ai` | AI 文本处理（润色/扩写/摘要/校对/翻译/续写/自定义） |
| POST | `/admin/upload` | 图片上传（`multipart/form-data`，字段 `file`，限 5MB） |

---

## 快速开始

### 前置要求

- Node.js `^22.22.2 || ^24.15.0 || >=26.0.0`
- pnpm `11.10.0`（`packageManager` 已声明，可 `corepack enable`）
- Docker（用于启动 MySQL）

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动数据库

```bash
pnpm db:up        # 等价于 docker compose up -d mysql
```

MySQL 默认监听宿主机 `3307` 端口，库名 `xlt_blog`，账号 `xlt_blog/xlt_blog`（见 `docker-compose.yml`）。

### 3. 配置服务端环境变量

```bash
cp apps/server/.env.example apps/server/.env
# 按需修改 DB_*、ADMIN_*、AI_* 等
```

### 4. 初始化数据

```bash
pnpm db:migrate   # 执行 MikroORM 迁移（开发环境启动时也会自动执行 pending 迁移）
pnpm db:seed      # 写入默认管理员、示例文章、默认站点设置
```

默认管理员：`admin` / `admin123`（可通过 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 覆盖）。

### 5. 启动各端

```bash
pnpm dev:server    # 服务端   http://localhost:3000/api
pnpm dev:web       # 前台     http://localhost:3001
pnpm dev:console   # 管理后台（art-design-pro，vite --open）
```

或一次性并行启动所有应用：

```bash
pnpm dev
```

---

## 环境变量

`apps/server/.env`（模板见 `.env.example`）：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 服务端口 |
| `DB_HOST` / `DB_PORT` | `127.0.0.1` / `3307` | MySQL 连接 |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | `xlt_blog` / `xlt_blog` / `xlt_blog` | 数据库凭据 |
| `UPLOAD_DIR` | `uploads` | 上传目录（相对 `apps/server` 运行目录） |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `admin` / `admin123` | 初始管理员（仅 seeder 使用） |
| `AI_API_KEY` | （空） | OpenAI 兼容网关密钥 |
| `AI_BASE_URL` | `https://api.openai.com/v1` | AI 网关地址（支持火山方舟 / DeepSeek） |
| `AI_MODEL` | `gpt-4o-mini` | 模型名 |

---

## 常用命令

根 `package.json` 脚本：

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 并行启动所有 `apps/*` 的 dev |
| `pnpm dev:server` | 启动服务端（NestJS watch） |
| `pnpm dev:web` | 启动前台（Nuxt，端口 3001） |
| `pnpm dev:console` / `pnpm dev:admin` | 启动管理后台 |
| `pnpm build` | 构建所有 packages 与 apps |
| `pnpm build:console` | 构建管理后台 |
| `pnpm lint:console` | 后台 oxlint 检查 |
| `pnpm db:up` / `db:migrate` / `db:seed` | 数据库启停与初始化 |

`scripts/cli.ts` 提供交互式脚本选择器：

```bash
pnpm cli -- --mode=dev      # 交互选择要启动的 app
pnpm cli -- --mode=build
```

---

## 文档索引

- [`docs/admin-api.md`](docs/admin-api.md) — 后台 API 契约与页面—接口对应
- [`docs/tiptap-ai.md`](docs/tiptap-ai.md) — TipTap 自研 AI（润色/摘要/校对）接入说明
- `原型/仪表盘.html`、`blog-admin-prototype.html` — 后台界面设计原型

---

## 设计风格

前台整体取「书籍装帧」意象：黛蓝主色板 + 朱砂点缀、宋体标题、双线书框、目录点线、竖排刊头与朱砂小印（`seal`），并带纸张噪点肌理与明暗主题切换。主题色由后台站点设置动态下发，前台在 SSR 阶段注入 CSS 变量，实现首屏无闪烁换肤。
