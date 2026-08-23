# 登录页改造、Markdown 导入与媒体存储配置设计

## 目标

本次工作包含三个相互关联但可独立使用的能力：改造管理端登录页的视觉和反馈体验；批量导入 Markdown 文章；为媒体库配置本地磁盘、RustFS 或其他 S3 兼容对象存储。

媒体存储为上传与附件删除提供统一抽象。Markdown 导入复用现有文章渲染管线，并将每个文件作为独立处理单元。登录页仅调整表现与交互反馈，不改变现有登录、会话恢复或路由跳转逻辑。

## 范围与非目标

本次实现支持 `.md` 与 `.markdown` 文件，支持 YAML frontmatter，并且每篇成功导入的文章均保存为 Markdown 编辑器类型和对应的 `renderHtml`。导入失败的文件不会回滚其他文件。

本次不解析非 Markdown 文件，也不执行富文本 HTML 到 Markdown 的反向转换。图片链接默认保持原样；导入同名 `assets/` 目录、上传关联资源并改写链接属于后续增强。

存储配置支持本地磁盘、RustFS 与 S3-compatible 对象存储。RustFS 已确认原生兼容 S3 API，因此不引入 RustFS 专属传输协议或 SDK。

## 存储架构

### 驱动边界

服务端新增 `StorageDriver` 接口，负责对象写入、删除及可选的 URL 获取。接口的上层不关心文件位于本地磁盘还是对象存储。

```ts
export type StorageBackend = 'local' | 'rusfs' | 's3'

export interface PutResult {
  url: string
  key: string
  storage: StorageBackend
}

export interface StorageDriver {
  put(file: { name: string; buffer: Buffer; mimeType: string }): Promise<PutResult>
  delete(key: string): Promise<void>
  getUrl?(key: string, options?: { expiresIn?: number }): Promise<string>
}
```

`LocalStorageDriver` 使用既有 `UPLOAD_DIR` 与 `/uploads` 静态服务。`S3CompatibleDriver` 使用 AWS S3 SDK，并由配置决定 RustFS、AWS S3、华为 OBS、阿里云 OSS、腾讯云 COS 或自定义 S3 服务。RustFS 默认启用 path-style，但该选项可以在配置页中修改。

所有后端使用统一对象键：`${yyyy}/${mm}/${uuid}${ext}`。该规则避免文件名冲突，并允许对象存储按日期前缀管理。

### 服务与配置

`StorageService` 读取 `settings` 表中的 `storageConfig`，按当前 `active` 后端懒加载 Driver 实例。保存配置后，服务必须使已有 Driver 缓存失效，确保新请求立即使用新配置。

配置中的 `accessKey` 与 `secretKey` 使用 AES-256-GCM 加密后保存。加密主密钥读取 `STORAGE_ENCRYPTION_KEY`，其值必须为 32 字节的十六进制字符串。读取配置的 API 返回脱敏凭据，且保存脱敏值时不得覆盖数据库中已有的真实凭据。

```ts
interface StorageConfig {
  active: StorageBackend
  local: { publicUrlPrefix?: string }
  rusfs: {
    endpoint: string
    bucket: string
    accessKey: string
    secretKey: string
    region?: string
    pathStyle?: boolean
    publicUrlBase?: string
  }
  s3: {
    provider: 'aws' | 'huawei-obs' | 'aliyun-oss' | 'tencent-cos' | 'custom'
    endpoint?: string
    region: string
    bucket: string
    accessKey: string
    secretKey: string
    pathStyle?: boolean
    publicUrlBase?: string
  }
}
```

### 附件兼容与迁移

`attachments` 表增加 `storage` 和 `storageKey` 字段。迁移将存量附件标为 `local`，并以现有 URL 的 basename 回填 `storageKey`，保留旧数据可访问性。

上传端点改用内存上传，再由 `StorageService.put()` 写入当前后端。附件删除先请求相应 Driver 删除对象；对象不存在时 Driver 静默处理，然后删除数据库记录。

存储管理 API 如下：

- `GET /admin/storage/config`：返回脱敏后的配置。
- `PUT /admin/storage/config`：保存加密配置并刷新 Driver 缓存。
- `POST /admin/storage/test`：写入并删除探针对象，返回连接结果。
- `POST /admin/storage/migrate`：逐条读取现有附件，迁移到当前后端，并返回 `total`、`migrated` 与 `failed`。

迁移操作跳过已经位于目标后端的附件。每条附件独立处理，失败只记录该附件，不回滚已迁移项目。

## Markdown 批量导入

### API 与验证

新增 `POST /admin/articles/import`，接收 `multipart/form-data` 的 `files` 字段，并限制最多 50 个文件。服务端使用 `FilesInterceptor('files', 50)`、`memoryStorage`、`.md` / `.markdown` 后缀过滤和每文件 5 MiB 限制。文件名延续既有上传接口的 latin1 到 UTF-8 解码规则。

请求可携带 `defaultCategoryId`、`defaultTagIds` 与 `defaultStatus`。响应始终返回各文件的独立结果与总计：

```ts
interface ImportResult {
  results: Array<{
    filename: string
    status: 'success' | 'failed'
    articleId?: number
    title?: string
    error?: string
  }>
  total: number
  success: number
  failed: number
}
```

### 解析与写入规则

服务使用 `gray-matter` 解析首部 YAML frontmatter。`title` 依次从 frontmatter、正文的首个 H1 和去除扩展名后的文件名获得。`slug` 优先使用 frontmatter；否则按既有 `generateColumnSlug` 规则由标题生成，并复用 `ensureSlugUnique` 追加 `-2`、`-3` 等后缀。

正文去掉 frontmatter 后原样保存为 `rawContent`，`editorType` 固定为 `EditorType.MD`。服务使用现有 `renderContentHtml(EditorType.MD, rawContent, codeTheme)` 生成 `renderHtml`。`status` 使用 frontmatter 值，缺省时使用请求的 `defaultStatus`，并最终默认 `draft`。

前端提供的默认分类和标签为后备值。frontmatter 中的分类、标签名称仅与现有数据按 `name` 匹配：未命中分类保持为空，未命中标签跳过。`cover`、`summary`、`publishedAt` 和 `codeTheme` 在格式有效时写入文章。

每个文件均在独立的 `try/catch` 中解析、保存和 flush。某个文件失败不会影响其他文件的结果。

### 管理端体验

文章列表在“新建文章”旁增加“导入文章”。弹窗支持多文件拖拽或选择、默认分类/标签/状态选择、上传进度与逐文件结果表。完成后刷新文章列表。

一期不修改 Markdown 中的图片 URL。后续“导入关联资源”可复用 `StorageService.put()` 上传文件并改写文章内容。

## 登录页体验

登录页保留当前 Element Plus 表单、校验、记住状态、会话写入与登录后导航逻辑。视觉改造严格限制在展示组件与页面样式，避免影响已经存在的菜单和动态路由流程。

页面在宽屏使用双栏布局：左侧展示品牌、欢迎信息与轻量背景场景，右侧展示聚焦的登录卡片。窄屏收敛为单栏登录界面。

页面使用 CSS 与 SVG 构建抽象的互动角色和渐变背景。账号字段获得焦点时，角色表现为关注输入；密码字段获得焦点时，角色表现为遮眼；显示密码时恢复可见状态。动画必须响应 `prefers-reduced-motion`，并且加载、校验与错误状态保持清晰可见。

互动视觉组件仅接收焦点、密码显示状态与加载状态。组件不得读取或修改登录 API、token、store 或路由逻辑。

## 媒体存储配置页面

媒体存储配置作为独立页面放在媒体库相邻的管理入口中。页面沿用媒体库原型的深绿主色 `#0F6E56`、存储类型卡片和分层操作布局。

页面允许选择本地磁盘、本地 RustFS 或云对象存储。不同类型动态展示对应参数；AK/SK 使用密码输入框。本地配置提供公共 URL 前缀；RustFS 提供 endpoint、bucket、region、AK/SK、path-style 与公共 URL；云对象存储额外提供 provider 选择。

“测试连接”在保存前验证配置，并显示可操作的错误信息。“保存配置”持久化并失效 Driver 缓存。“迁移现有附件”先明确显示待迁移数量并要求二次确认，完成后展示成功和失败汇总，并刷新媒体库数据。

## 错误处理与安全

输入不合法、frontmatter 无法解析、存储认证失败、桶不存在或网络异常必须转化为可识别的 API 错误信息。凭据不得在配置读取接口、日志或前端状态中以明文暴露。

上传与迁移不得依赖客户端提供的对象键。服务端始终生成对象键并在写入成功后更新附件记录。删除时即使远端对象已经不存在，也应保持删除数据库附件记录的既有幂等语义。

## 验证策略

实现后将进行以下验证：

1. 运行服务端与管理端现有可用的构建、类型检查和相关测试命令。
2. 验证本地后端上传、访问、删除及存量附件字段回填。
3. 以 S3-compatible 的 RustFS 配置执行测试连接；如部署环境可用，执行对象上传与删除冒烟验证。
4. 导入包含有效 frontmatter、缺省标题、重复 slug、无效 YAML 和超限文件的 Markdown 批次，确认单文件失败不会回滚其他文章。
5. 验证登录表单校验、失败提示、成功跳转、窄屏布局和 reduced-motion 行为。

## 依赖与部署

服务端新增精确版本的 `@aws-sdk/client-s3`、`@aws-sdk/lib-storage` 和 `gray-matter`。Node 内置 `crypto` 负责凭据加密，不增加额外加密依赖。

部署环境必须提供 `STORAGE_ENCRYPTION_KEY`。如果使用本地 RustFS，可在服务编排中新增其容器及连接参数；使用云对象存储时无需新增容器。
