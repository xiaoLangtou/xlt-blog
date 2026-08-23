# 登录页改造、Markdown 导入与媒体存储配置 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为管理端交付互动登录页、可批量导入的 Markdown 文章工作流，以及支持本地、RustFS 和 S3-compatible 后端的媒体存储系统。

**Architecture:** 服务端以 `StorageDriver` 隔离本地与 S3-compatible 对象存储，并由 `StorageService` 管理加密配置、Driver 生命周期和附件迁移。Markdown 导入在 `AdminService` 中逐文件复用文章渲染和 slug 逻辑。管理端在既有博客 API、动态菜单与 Element Plus 交互模式上增量添加配置与导入界面；登录页将互动视觉封装为纯展示组件，避免触碰鉴权或路由。

**Tech Stack:** NestJS 11、MikroORM 6、MySQL、AWS SDK v3、Node `crypto`、`gray-matter`、Vue 3、Element Plus、VueUse、Tailwind/CSS。

---

## 改动文件与职责

### 服务端

- Create: `apps/server/src/storage/storage.types.ts` — 存储后端、配置、对象键和 API 输入/输出类型。
- Create: `apps/server/src/storage/storage-driver.interface.ts` — 上层使用的最小 Driver 协议。
- Create: `apps/server/src/storage/storage-crypto.service.ts` — AES-256-GCM 凭据加密、解密与脱敏。
- Create: `apps/server/src/storage/local-storage.driver.ts` — 本地磁盘写入、删除与 URL 生成。
- Create: `apps/server/src/storage/s3-compatible.driver.ts` — RustFS 和云 S3-compatible 存储的 put/delete/test/getUrl。
- Create: `apps/server/src/storage/storage.service.ts` — 配置持久化、缓存失效、Driver 选择、连接测试和附件迁移。
- Create: `apps/server/src/storage/storage.module.ts` — 导出 `StorageService` 的 Nest 模块。
- Modify: `apps/server/package.json` — 精确安装 AWS SDK 与 `gray-matter`。
- Modify: `apps/server/src/entities/attachment.entity.ts` — 增加 `storage` 与 `storageKey`。
- Create: `apps/server/src/migrations/Migration20260822000000AddAttachmentStorage.ts` — 新增字段并将存量附件标为 local。
- Modify: `apps/server/src/admin/admin.module.ts` — 导入 `StorageModule`。
- Modify: `apps/server/src/admin/admin.dto.ts` — 增加存储配置与 Markdown 导入 DTO。
- Modify: `apps/server/src/admin/admin.controller.ts` — 增加存储与导入端点；将上传改为内存文件后交给 `StorageService`。
- Modify: `apps/server/src/admin/admin.service.ts` — 注入 `StorageService`，迁移附件删除逻辑，并增加逐文件 Markdown 导入。
- Create: `apps/server/src/migrations/Migration20260822000001AddStorageMenu.ts` — 注册媒体存储配置页菜单。

### 管理端

- Modify: `apps/art-design-pro/src/types/api/blog.d.ts` — 声明导入结果、存储配置和测试/迁移结果类型。
- Modify: `apps/art-design-pro/src/api/blog.ts` — 增加 Markdown 导入与存储配置 API 封装。
- Create: `apps/art-design-pro/src/views/blog/attachments/storage.vue` — 媒体存储配置、测试、保存、迁移页面。
- Modify: `apps/art-design-pro/src/views/blog/attachments/index.vue` — 提供“存储配置”入口，保留原有附件列表和上传流程。
- Modify: `apps/art-design-pro/src/views/blog/articles/index.vue` — 增加 Markdown 导入按钮、表单、进度和结果弹窗。
- Create: `apps/art-design-pro/src/views/auth/login/LoginScene.vue` — 不含鉴权逻辑的 SVG/CSS 互动场景。
- Modify: `apps/art-design-pro/src/views/auth/login/index.vue` — 将表单焦点、密码可见性和提交状态传给 `LoginScene`。
- Modify: `apps/art-design-pro/src/views/auth/login/style.css` — 重构双栏布局、登录卡片与 reduced-motion 动画。

## Task 1: 安装依赖并建立存储类型与安全边界

**Files:**
- Modify: `apps/server/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `apps/server/src/storage/storage.types.ts`
- Create: `apps/server/src/storage/storage-driver.interface.ts`
- Create: `apps/server/src/storage/storage-crypto.service.ts`

- [ ] **Step 1: 以精确版本安装服务端依赖。**

Run from repository root:

```bash
pnpm --filter @xlt-blog/server add --save-exact @aws-sdk/client-s3 @aws-sdk/lib-storage gray-matter
```

确认 `apps/server/package.json` 与 `pnpm-lock.yaml` 记录不带 `^` 或 `~` 的三个依赖版本。不要替换或升级现有依赖。

- [ ] **Step 2: 定义存储域类型和公开配置。**

在 `apps/server/src/storage/storage.types.ts` 定义：

```ts
export const STORAGE_BACKENDS = ['local', 'rusfs', 's3'] as const
export type StorageBackend = (typeof STORAGE_BACKENDS)[number]

export interface StorageObjectInput {
  name: string
  buffer: Buffer
  mimeType: string
}

export interface PutResult {
  storage: StorageBackend
  key: string
  url: string
}

export interface LocalStorageConfig {
  publicUrlPrefix?: string
}

export interface S3CompatibleStorageConfig {
  endpoint?: string
  bucket: string
  accessKey: string
  secretKey: string
  region?: string
  pathStyle?: boolean
  publicUrlBase?: string
}

export interface StorageConfig {
  active: StorageBackend
  local: LocalStorageConfig
  rusfs: S3CompatibleStorageConfig
  s3: S3CompatibleStorageConfig & {
    provider: 'aws' | 'huawei-obs' | 'aliyun-oss' | 'tencent-cos' | 'custom'
  }
}
```

额外导出 `MaskedStorageConfig`、`StorageConnectionResult` 和 `StorageMigrationResult`。通过 `createDefaultStorageConfig()` 返回 `active: 'local'`、本地 `/uploads` 和未填远端字段的默认结构，确保首次 GET 不依赖数据库已有配置。

- [ ] **Step 3: 定义 Driver 协议。**

在 `apps/server/src/storage/storage-driver.interface.ts` 编写：

```ts
import type { PutResult, StorageObjectInput } from './storage.types'

export interface StorageDriver {
  put(file: StorageObjectInput): Promise<PutResult>
  read(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  getUrl?(key: string, options?: { expiresIn?: number }): Promise<string>
}
```

协议不暴露 Provider SDK 或配置对象，避免 `AdminController`、文章导入和附件实体与 AWS SDK 耦合。

- [ ] **Step 4: 实现凭据加密、解密和脱敏。**

`StorageCryptoService` 必须读取 `STORAGE_ENCRYPTION_KEY`，用 `Buffer.from(value, 'hex')` 校验其长度严格为 32 字节；缺失或非法时抛出 `InternalServerErrorException`，且不得打印密钥。

加密格式使用 `v1:<iv-base64url>:<tag-base64url>:<ciphertext-base64url>`，算法为 `aes-256-gcm`：

```ts
const cipher = createCipheriv('aes-256-gcm', this.key, iv)
const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
const tag = cipher.getAuthTag()
```

解密时验证四段格式、版本和认证标签；解密失败抛出可操作但不泄露底层凭据的异常。提供 `maskSecret(value)`，仅保留首尾各两个字符，中间用 `*` 表示；空值保持空值。

- [ ] **Step 5: 进行局部编译检查。**

Run:

```bash
pnpm --filter @xlt-blog/server build
```

Expected: Nest 编译成功；此阶段不存在未解析的 storage 导入或 Node crypto 类型错误。

## Task 2: 实现本地与 S3-compatible Driver 以及配置服务

**Files:**
- Create: `apps/server/src/storage/local-storage.driver.ts`
- Create: `apps/server/src/storage/s3-compatible.driver.ts`
- Create: `apps/server/src/storage/storage.service.ts`
- Create: `apps/server/src/storage/storage.module.ts`
- Modify: `apps/server/src/admin/admin.module.ts`

- [ ] **Step 1: 实现本地 Driver。**

`LocalStorageDriver` 在构造函数接收 `LocalStorageConfig`。`put()` 生成 `YYYY/MM/<uuid><lowercase-ext>`，用 `mkdir(..., { recursive: true })` 创建父目录，再用 `writeFile()` 写入 buffer。文件扩展名通过 `extname(file.name)` 取得；没有扩展名时不追加点号。

`url` 使用 `publicUrlPrefix ?? '/uploads'`，确保前缀单个尾部 `/`，并使用 `/` 连接对象键。`delete()` 仅允许相对 key，使用 `resolve()` 验证目标路径仍在 `UPLOAD_DIR` 下；`ENOENT` 静默忽略，其他 I/O 错误上抛。

- [ ] **Step 2: 实现统一的 S3-compatible Driver。**

`S3CompatibleDriver` 接收 `StorageBackend` 与远端配置。用下列 SDK 配置创建 `S3Client`：

```ts
new S3Client({
  endpoint: config.endpoint || undefined,
  region: config.region || 'us-east-1',
  forcePathStyle: config.pathStyle ?? backend === 'rusfs',
  credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey }
})
```

`put()` 使用 `Upload`，设置 `Bucket`、服务端生成的 `Key`、`Body: file.buffer` 和 `ContentType`。上传成功后返回 `publicUrlBase` 加 key；若未配置公共 URL，返回 endpoint/bucket 与 key 拼接的访问 URL。`delete()` 使用 `DeleteObjectCommand`，处理远端不存在对象时保持成功。`getUrl()` 在需要时复用公共 URL 生成规则；本期不支持私有桶签名 URL，以避免在未增加签名依赖时暴露不可用 API。

添加 `testConnection()`：以 `__xlt-blog-probe/<uuid>.txt` 执行 `PutObjectCommand` 后在 `finally` 中执行 `DeleteObjectCommand`。错误消息只返回错误名称与安全的 message，不回显 endpoint 中的凭据。

- [ ] **Step 3: 实现配置保存、Driver 缓存和附件迁移服务。**

`StorageService` 注入 `EntityManager`、`StorageCryptoService`。它必须：

1. 通过 Setting key `storageConfig` 读取原始 JSON；不存在时使用 `createDefaultStorageConfig()`。
2. 保存时仅加密实际传入的 AK/SK；对于掩码值或空值，保留已有已加密凭据。
3. `getMaskedConfig()` 只返回掩码 AK/SK。
4. `getActiveDriver()` 按 `active` 创建并缓存一个 Driver；配置保存后置空缓存。
5. `put()` 委托活动 Driver；`delete(backend, key)` 用附件保存的 backend 选择对应 Driver，以保证切换配置后旧附件仍可删除。
6. `testConfig()` 用当前保存的配置或请求临时配置创建未缓存 Driver，并调用探针。
7. `migrateAttachments()` 逐条读取 Attachment：跳过已经在当前 backend 的条目；从旧 Driver 读取源 buffer，再上传到活动 Driver；仅在上传成功后更新 `storage`、`storageKey` 和 `url` 并 flush；将异常转换为 `{ id, filename, error }` 记录。

源对象读取是 Driver 的内部能力。为此在 Driver 协议增加 `read(key): Promise<Buffer>`，本地使用 `readFile()`，S3 使用 `GetObjectCommand` 并将响应 body 转为字节。迁移不得从浏览器 URL 下载，也不得信任客户端路径。

- [ ] **Step 4: 注册模块。**

`StorageModule` 提供并导出 `StorageService`。`AdminModule` 的 `imports` 增加 `StorageModule`；不要在 `AppModule` 额外注册独立 Provider。

- [ ] **Step 5: 构建验证。**

Run:

```bash
pnpm --filter @xlt-blog/server build
```

Expected: 通过，且 `StorageService` 可被 `AdminModule` 注入。

## Task 3: 迁移附件字段并重构上传、删除与配置 API

**Files:**
- Modify: `apps/server/src/entities/attachment.entity.ts`
- Create: `apps/server/src/migrations/Migration20260822000000AddAttachmentStorage.ts`
- Modify: `apps/server/src/admin/admin.dto.ts`
- Modify: `apps/server/src/admin/admin.controller.ts`
- Modify: `apps/server/src/admin/admin.service.ts`

- [ ] **Step 1: 扩展附件实体和数据库迁移。**

在 `Attachment` 上增加：

```ts
@Property({ default: 'local' })
storage: StorageBackend = 'local'

@Property({ nullable: true })
storageKey: string | null = null
```

迁移 `up()` 添加 `storage varchar(16) not null default 'local'` 与 `storage_key varchar(512) null`，随后执行：

```sql
update attachments
set storage = 'local',
    storage_key = substring_index(url, '/', -1)
where storage_key is null;
```

旧附件 URL 是平铺的 `/uploads/<filename>`，因此 `substring_index(url, '/', -1)` 会回填其 basename。`down()` 删除两列即可。

- [ ] **Step 2: 增加 DTO。**

在 `admin.dto.ts` 添加 `SaveStorageConfigDto`，包含嵌套 `local`、`rusfs`、`s3` 配置和 `active`，对 `active` 使用 `@IsIn(['local', 'rusfs', 's3'])`。远端的 `endpoint`、`bucket`、AK/SK、region 与 public URL 在对应后端激活时由 `StorageService` 做跨字段校验。

添加 `TestStorageConfigDto`，其 `config?` 允许提交未保存配置；不传时测试已保存配置。添加 `MigrateStorageDto`，不接受客户端附件 URL 或对象键。

- [ ] **Step 3: 重构上传和附件删除。**

`AdminController` 移除 `diskStorage`、`randomUUID`、`existsSync` 和 `mkdirSync`。上传改为：

```ts
@Post('upload')
@UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } }))
async upload(@UploadedFile() file?: Express.Multer.File) {
  if (!file) throw new BadRequestException('未接收到文件')
  return this.adminService.uploadAttachment({
    filename: Buffer.from(file.originalname, 'latin1').toString('utf8'),
    buffer: file.buffer,
    mimeType: file.mimetype,
    size: file.size
  })
}
```

`AdminService.uploadAttachment()` 调用 `StorageService.put()`，并以 `filename`、`url`、`mimeType`、`size`、`storage`、`storageKey` 创建 Attachment，返回 `{ url }` 以保持现有前端上传契约。

`deleteAttachment()` 必须先调用 `storageService.delete(attachment.storage, attachment.storageKey)`；若 `storageKey` 为 null，则仅删除数据库记录以兼容无法推导 key 的旧数据。远端删除成功或对象不存在后，再 `removeAndFlush` 附件记录。移除原始 `unlink()`、`UPLOAD_DIR`、`basename` 和 `join` 依赖。

- [ ] **Step 4: 增加存储管理端点。**

在 Controller 添加：

```ts
@Get('storage/config') getStorageConfig()
@Put('storage/config') saveStorageConfig(@Body() dto: SaveStorageConfigDto)
@Post('storage/test') testStorage(@Body() dto: TestStorageConfigDto)
@Post('storage/migrate') migrateStorage()
```

这四个端点均委托 `StorageService`。迁移返回 `{ total, migrated, failed, failures }`，`failures` 仅包含附件 ID、文件名和安全错误文本。不要把 AK、SK、解密后的配置或 `StorageDriver` 暴露到 API 响应。

- [ ] **Step 5: 执行迁移并做本地媒体冒烟检查。**

Run:

```bash
pnpm --filter @xlt-blog/server migration:up
pnpm --filter @xlt-blog/server build
```

在已登录管理端上传一个小文本或图片文件，确认创建的附件行有 `storage='local'`、非空 `storage_key`，URL 仍可通过 `/uploads/<key>` 打开；再删除它，确认文件和记录均消失。

## Task 4: 实现服务端 Markdown 批量导入

**Files:**
- Modify: `apps/server/src/admin/admin.dto.ts`
- Modify: `apps/server/src/admin/admin.controller.ts`
- Modify: `apps/server/src/admin/admin.service.ts`

- [ ] **Step 1: 定义导入默认值 DTO。**

新增 `ImportArticlesDto`：`defaultCategoryId?` 由 `@Type(() => Number)` 和 `@IsInt()` 校验；`defaultTagIds?` 是整数数组；`defaultStatus?` 使用 `@IsEnum(ArticleStatus)`。不要把标题、slug 和正文放入请求 DTO，它们只从上传文件解析。

- [ ] **Step 2: 暴露 50 文件、每个 5 MiB 的导入端点。**

在 `AdminController` 文章区域增加：

```ts
@Post('articles/import')
@UseInterceptors(
  FilesInterceptor('files', 50, {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      const extension = extname(file.originalname).toLowerCase()
      callback(extension === '.md' || extension === '.markdown' ? null : new BadRequestException('仅支持 Markdown 文件'), extension === '.md' || extension === '.markdown')
    }
  })
)
importArticles(@UploadedFiles() files: Express.Multer.File[], @Body() defaults: ImportArticlesDto) {
  return this.adminService.importArticles(files ?? [], defaults)
}
```

补全 `FilesInterceptor`、`UploadedFiles`、`memoryStorage` 的导入。空文件数组直接返回 `{ results: [], total: 0, success: 0, failed: 0 }`，不抛 500。

- [ ] **Step 3: 在 `AdminService` 实现确定性的解析辅助函数。**

使用 `gray-matter`，并以 `Buffer.from(file.originalname, 'latin1').toString('utf8')` 取得显示文件名。为每个文件实现如下顺序：

1. `matter(file.buffer.toString('utf8'))` 获取 `data` 与 `content`。
2. `title` 取非空 `data.title`，否则匹配正文首个 `/^#\s+(.+)$/m`，再否则取文件名去扩展名。
3. slug 取 `data.slug`，否则按照已有 `generateColumnSlug()` 中的字符归一化规则由 title 生成；对于重复值，从基础值开始调用 `ensureSlugUnique()`，按 `-2`、`-3` 递增至可用。
4. `rawContent` 为 `content` 原样；`editorType` 为 `EditorType.MD`；`codeTheme` 只接受 `github` 或 `atom`，否则 `CodeTheme.Github`。
5. `status` 仅接受 `draft` 或 `published`，否则 `defaults.defaultStatus ?? ArticleStatus.Draft`。
6. frontmatter 的 `category` 与 `tags` 以名称精确查询；未命中分类设 null，未命中标签忽略。若未提供 frontmatter 值，再使用默认分类/标签。
7. 通过 `renderContentHtml(EditorType.MD, rawContent, codeTheme)` 生成 `renderHtml`，设置 `rendererVersion`、`cover`、`summary`、`publishedAt` 并保存。

`publishedAt` 只在 frontmatter 日期可构造成有效 `Date` 时写入。若 `status` 为 published 且没有有效发布时间，则沿用现有文章创建规则写入当前时间。

- [ ] **Step 4: 保证逐文件隔离并返回完整结果。**

`importArticles()` 依次处理文件，并在每轮 `try/catch` 内执行 `this.em.persistAndFlush(article)`。处理成功时追加 `{ filename, status: 'success', articleId: article.id, title: article.title }`；任何解析、slug、分类或渲染失败时追加 `{ filename, status: 'failed', error: safeErrorMessage(error) }`，然后继续下一个文件。

该方法不得启动包裹整批的事务，也不得在一个失败时清除已 flush 的文章。

- [ ] **Step 5: 构建并执行导入手工验收。**

Run:

```bash
pnpm --filter @xlt-blog/server build
```

在管理端上传一个批次：有效 frontmatter 文件、只有 H1 的文件、无标题文件、重复 slug 文件、无效 YAML 文件及一个超过 5 MiB 的文件。预期前四项分别产生文章（重复 slug 自动追加后缀），失败项只显示失败原因，成功文章保留在列表中且 `editorType='md'`。

## Task 5: 实现管理端 API 类型、存储页面和导航入口

**Files:**
- Modify: `apps/art-design-pro/src/types/api/blog.d.ts`
- Modify: `apps/art-design-pro/src/api/blog.ts`
- Create: `apps/art-design-pro/src/views/blog/attachments/storage.vue`
- Modify: `apps/art-design-pro/src/views/blog/attachments/index.vue`
- Create: `apps/server/src/migrations/Migration20260822000001AddStorageMenu.ts`

- [ ] **Step 1: 扩充博客 API 类型。**

在 `Api.Blog` 声明：

```ts
type StorageBackend = 'local' | 'rusfs' | 's3'

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
  local: { publicUrlPrefix?: string }
  rusfs: StorageRemoteConfig
  s3: StorageRemoteConfig & {
    provider: 'aws' | 'huawei-obs' | 'aliyun-oss' | 'tencent-cos' | 'custom'
  }
}

interface ImportArticleResult { filename: string; status: 'success' | 'failed'; articleId?: number; title?: string; error?: string }
interface ImportArticlesResult { results: ImportArticleResult[]; total: number; success: number; failed: number }
interface StorageTestResult { ok: boolean; error?: string }
interface StorageMigrationResult { total: number; migrated: number; failed: number; failures: Array<{ id: number; filename: string; error: string }> }
```

`StorageConfig` 的 `accessKey` 与 `secretKey` 类型仍为 string，但前端必须将服务端脱敏值视作“未修改”，不能重新提交为真实凭据。

- [ ] **Step 2: 添加 API 封装。**

在 `blogApi` 增加：

```ts
importArticles(files: File[], defaults: Api.Blog.ImportArticleDefaults, onProgress?: (percent: number) => void)
getStorageConfig()
updateStorageConfig(params: Api.Blog.StorageConfig)
testStorageConfig(params?: Api.Blog.StorageConfig)
migrateStorage()
```

`importArticles()` 创建 `FormData`，对每个文件执行 `data.append('files', file)`，并仅追加已选默认值。它必须传入 `onUploadProgress`，用于弹窗进度条。不要更改现有单文件 `upload()` API。

- [ ] **Step 3: 新建媒体存储配置页。**

`storage.vue` 使用 `ElForm`、`ElRadioGroup`、`ElCard`、`ElProgress` 和 `ElDialog`，实现：

1. 初次加载调用 `getStorageConfig()`，将 `active`、本地、RustFS、S3 字段映射到可编辑 reactive form。
2. 三张可选后端卡片：本地磁盘、RustFS、云对象存储。主色使用 `#0F6E56`，活动卡片有清晰边框和图标状态。
3. local 展示 public URL prefix；RustFS 展示 endpoint、bucket、region、AK、SK、path-style、public URL；S3 展示 provider、endpoint、region、bucket、AK、SK、path-style、public URL。
4. 脱敏 AK/SK 仅在用户显式修改相应输入框后包含在保存请求中；未修改则提交空字符串，由服务端保留原值。
5. “测试连接”调用 `testStorageConfig()`，展示成功或错误；“保存配置”调用 `updateStorageConfig()` 后重新加载脱敏配置。
6. “迁移现有附件”使用 `ElMessageBox.confirm`，确认后显示进度状态和服务端返回的成功/失败汇总。该 API 当前为同步调用，页面不得伪造百分比进度。

- [ ] **Step 4: 从媒体库提供存储配置入口。**

在 `attachments/index.vue` 的 `ArtTableHeader` 左侧，“上传文件”按钮之后增加：

```vue
<ElButton @click="router.push('/blog-system/storage')">
  <ArtSvgIcon icon="ri:hard-drive-3-line" />存储配置
</ElButton>
```

初始化 `const router = useRouter()`。不要改动媒体列表、附件上传、预览或删除逻辑。

- [ ] **Step 5: 通过迁移创建动态菜单。**

新增菜单迁移，将“媒体存储”插入 `/blog-system` 下：路径 `/blog-system/storage`，组件 `/blog/attachments/storage`，图标 `ri:hard-drive-3-line`，权限 `blog:storage:update`，菜单类型 `1`，可见 `1`。使用 `insert ... select ... where not exists`，与 `Migration20260813UseSysMenu.ts` 保持幂等风格。

`down()` 仅删除 `/blog-system/storage` 这条菜单。应用迁移后重新登录，使动态菜单与 RouteRegistry 获取新路由。

- [ ] **Step 6: 管理端构建与页面冒烟检查。**

Run:

```bash
pnpm --dir apps/art-design-pro build
```

Expected: Vite production build 成功。重新登录后，通过“博客系统 → 媒体存储”进入配置页，切换三类卡片不会丢失表单状态；从媒体库按钮也能打开同一路由。

## Task 6: 实现文章导入弹窗

**Files:**
- Modify: `apps/art-design-pro/src/views/blog/articles/index.vue`

- [ ] **Step 1: 添加导入状态、默认值与选项加载。**

在 `articles/index.vue` 增加 `importDialogVisible`、`importing`、`importProgress`、`selectedFiles`、`importResult` 与默认值 reactive form。页面打开弹窗时调用 `blogApi.listCategories()` 和 `blogApi.listAllTags()`；数据只用于 Element Plus 分类和标签选择器。

选择器默认状态为 `draft`，分类和标签可以为空。用 `ElUpload` 的 `auto-upload="false"`、`multiple`、`drag` 和 `accept=".md,.markdown,text/markdown"` 收集文件；`before-upload` 拒绝超过 5 MiB 或错误扩展名，并以 `ElMessage.error` 报错。

- [ ] **Step 2: 增加工具栏按钮和三段式弹窗。**

在“新建文章”按钮旁增加：

```vue
<ElButton @click="openImportDialog">
  <ArtSvgIcon icon="ri:file-upload-line" />导入文章
</ElButton>
```

弹窗必须含三个明确区块：文件拖拽及待导入列表；默认分类/标签/状态；开始导入后的 `ElProgress` 与结果表。文件列表显示名称、大小和选择状态；结果表显示 filename、成功标题或失败原因。

- [ ] **Step 3: 执行上传并刷新列表。**

`submitImport()` 在无文件时提示后返回；否则设置 `importing = true`，调用 `blogApi.importArticles(files, defaults, setProgress)`。请求成功后保留结果表、使用 `ElMessage` 显示 `成功 X 篇，失败 Y 篇`，并将 `params.page = 1` 后调用 `refetch()`。请求级错误应保留已选文件以允许重试；文件级错误只显示在服务端结果表。

关闭对话框仅在不上传时清空文件、进度和结果。上传中禁用关闭、默认表单和再次提交，防止同一批文件重复落库。

- [ ] **Step 4: 构建与交互验收。**

Run:

```bash
pnpm --dir apps/art-design-pro build
```

在管理端选择两篇有效 Markdown 和一篇错误文件，检查进度、逐行结果、成功/失败汇总和文章列表刷新。重新打开弹窗时确认旧结果与旧文件已经清理。

## Task 7: 实现互动登录视觉且隔离鉴权逻辑

**Files:**
- Create: `apps/art-design-pro/src/views/auth/login/LoginScene.vue`
- Modify: `apps/art-design-pro/src/views/auth/login/index.vue`
- Modify: `apps/art-design-pro/src/views/auth/login/style.css`

- [ ] **Step 1: 创建纯展示 LoginScene 组件。**

`LoginScene.vue` 接受三个只读 props：

```ts
withDefaults(defineProps<{
  focusedField?: 'username' | 'password' | null
  passwordVisible?: boolean
  loading?: boolean
}>(), { focusedField: null, passwordVisible: false, loading: false })
```

组件用 SVG 与 CSS 绘制抽象角色、柔和的渐变圆形背景和品牌信息。根节点根据 props 添加 `is-username-focused`、`is-password-focused`、`is-password-visible`、`is-loading` 类：密码聚焦时角色遮眼，密码可见时解除遮眼。组件不得 import `router`、store、`fetchLogin`、token 或 API。

在组件 CSS 增加：

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 2: 连接表单 UI 状态，而不改变认证流程。**

在登录页增加 `focusedField` 与 `passwordVisible` refs。用户名输入绑定 `@focus`/`@blur` 更新用户名状态；密码输入绑定同样事件；使用受控的 `:type="passwordVisible ? 'text' : 'password'"` 和 input 的 suffix button 切换可见性，替换 `show-password`。

将现有 `<LoginLeftView />` 替换为：

```vue
<LoginScene
  :focused-field="focusedField"
  :password-visible="passwordVisible"
  :loading="loading"
/>
```

保留 `handleSubmit` 的请求、`clearSession()`、token 设置、通知与 `router.push()` 的所有现有代码。不要将延迟、异步动画或 watcher 加入登录成功跳转路径。

- [ ] **Step 3: 改造登录样式。**

`style.css` 定义宽屏双栏、透明/半透明登录卡片、输入框聚焦环、提交态与窄屏单栏。保留现有的表单最大宽度、国际化文本、键盘 Enter 提交及 Element Plus 校验信息。

移动端隐藏或大幅精简 `LoginScene`，但不隐藏 Logo、标题、输入框和按钮。避免绝对定位遮挡表单或 `AuthTopBar`。所有颜色通过 Element Plus 主题变量或局部 CSS custom properties 引用，不硬编码系统主色。

- [ ] **Step 4: 进行登录回归验证。**

Run:

```bash
pnpm --dir apps/art-design-pro build
```

在浏览器依次验证：空表单校验、错误凭据提示、密码显隐、账号/密码聚焦的场景变化、成功登录进入首页、重新登录后菜单可切换、窄屏布局和 reduced-motion。页面视觉变化不得改变 token、路由或菜单加载行为。

## Task 8: 完整回归与交付检查

**Files:**
- No source changes expected.

- [ ] **Step 1: 检查工作区差异。**

Run:

```bash
git diff --check
git status --short
```

Expected: `git diff --check` 无空白错误。核对差异只包含本计划的源文件、迁移、依赖锁文件和已批准文档；不得覆盖用户既有的 `apps/server/src/admin/admin.service.ts` 改动，而应将本次变更与它们合并。

- [ ] **Step 2: 执行最终构建。**

Run:

```bash
pnpm --filter @xlt-blog/server build && pnpm --dir apps/art-design-pro build
```

Expected: 两个构建均退出码 0。若管理端全量 `type-check` 仍报已知基线错误，记录其数量与本次改动无关，不将其误报为通过。

- [ ] **Step 3: 执行最终人工场景回归。**

按顺序检查：本地上传/删除；RustFS 测试连接、上传、删除；存量附件迁移并确认旧 URL 更新；多文件 Markdown 部分成功导入；登录成功、退出并重新登录、菜单切换；存储配置页路由和媒体库入口。记录无法在本地验证的 RustFS 真实凭据场景，并说明需要部署环境复核。

- [ ] **Step 4: 准备交付摘要，不创建提交。**

汇总新增 API、迁移文件、配置环境变量、验证结果和任何无法验证项。除非用户明确要求，保持工作区未提交状态，不运行 `git commit`、不推送远端。

## 计划自检

- **规格覆盖：** Task 1–3 覆盖本地/RustFS/S3 Driver、AES-GCM、配置 API、附件字段迁移、上传/删除和迁移；Task 4 与 Task 6 覆盖 frontmatter、独立失败、渲染、导入 API 与 UX；Task 5 覆盖存储配置页面和动态菜单；Task 7 覆盖互动登录页且隔离登录逻辑；Task 8 覆盖构建和端到端人工验收。
- **占位项：** 计划没有 `TODO`、`TBD` 或未指定文件路径的实现步骤。
- **类型一致性：** `StorageBackend`、`StorageConfig`、`StorageDriver`、`ImportArticlesResult` 和 `/blog-system/storage` 路径在所有任务中采用同一名称。
- **范围控制：** 不包含关联 assets 目录自动导入、富文本反向转换、独立 RustFS SDK 或未经请求的自动化测试套件。
