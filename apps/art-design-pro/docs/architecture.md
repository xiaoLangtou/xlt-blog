# Xlt Admin — 项目架构文档

> 生成时间：2026-05-23

---

## 一、项目概览

**Xlt Admin** 是一个基于 Vue 3 + TypeScript 的中后台管理系统框架，提供完整的布局、权限、主题、国际化等基础能力，同时内置丰富的业务组件和页面示例。

| 维度      | 说明                                           |
| --------- | ---------------------------------------------- |
| 框架      | Vue 3.5 + TypeScript 5.6                       |
| 构建工具  | Vite 7                                         |
| UI 库     | Element Plus 2.11                              |
| 状态管理  | Pinia 3（持久化：pinia-plugin-persistedstate） |
| 路由      | Vue Router 4（Hash 模式）                      |
| HTTP      | Axios（自封装）                                |
| 样式      | SCSS + Tailwind CSS 4                          |
| 国际化    | vue-i18n 9（中文 / 英文）                      |
| 图表      | ECharts 6                                      |
| 包管理    | pnpm ≥ 8.8                                     |
| Node 版本 | ≥ 20.19                                        |

---

## 二、目录结构

```
art-design-pro/
├── index.html                  # HTML 入口
├── package.json
├── vite.config.ts              # Vite 配置
├── tsconfig.json
├── .oxlintrc.json
├── .stylelintrc.cjs
├── .oxfmtrc.json
├── commitlint.config.cjs       # Git 提交规范
├── scripts/
│   └── clean-dev.ts            # 清理脚本
├── docs/                       # 项目文档（本文件所在目录）
└── src/
    ├── main.ts                 # 应用入口
    ├── App.vue                 # 根组件
    ├── env.d.ts                # 环境变量类型声明
    ├── api/                    # 接口层
    ├── assets/                 # 静态资源
    ├── components/             # 组件库
    ├── config/                 # 全局配置
    ├── directives/             # 自定义指令
    ├── enums/                  # 枚举定义
    ├── hooks/                  # Composable 钩子
    ├── locales/                # 国际化
    ├── mock/                   # Mock 数据
    ├── plugins/                # 第三方插件封装
    ├── router/                 # 路由
    ├── store/                  # 状态管理
    ├── types/                  # TypeScript 类型定义
    ├── utils/                  # 工具函数
    └── views/                  # 页面视图
```

---

## 三、核心模块详解

### 3.1 入口 & 启动流程

`src/main.ts` 按顺序完成以下初始化：

```
createApp(App)
  → initStore(app)          // 初始化 Pinia（带持久化插件）
  → initRouter(app)         // 初始化路由 + 守卫 + 进度条
  → setupGlobDirectives(app)// 注册全局指令
  → setupErrorHandle(app)   // 全局错误捕获
  → app.use(i18n)           // 国际化
  → app.mount('#app')
```

`App.vue` 在 `onBeforeMount` 中初始化主题系统（`initializeTheme`），在 `onMounted` 中检查 Storage 兼容性并执行版本升级。

---

### 3.2 路由系统（`src/router/`）

```
router/
├── index.ts                # 创建路由实例，Hash 模式
├── routesAlias.ts          # 路由路径常量枚举
├── routes/
│   ├── staticRoutes.ts     # 静态路由（无需登录：Login / Register / 异常页 / Iframe）
│   └── asyncRoutes.ts      # 动态路由（由 routeModules 汇总）
├── modules/                # 按业务模块拆分的路由配置
│   ├── dashboard.ts        # 控制台 / 分析 / 电商
│   ├── system.ts           # 用户 / 角色 / 菜单 / 嵌套菜单
│   ├── template.ts         # 模板页
│   ├── widgets.ts          # 组件小工具
│   ├── examples.ts         # 示例页
│   ├── article.ts          # 文章管理
│   ├── result.ts           # 结果页
│   ├── exception.ts        # 异常页
│   ├── safeguard.ts        # 服务监控
│   └── help.ts             # 帮助 / 变更日志
├── guards/
│   ├── beforeEach.ts       # 前置守卫（登录验证、动态路由注册、权限校验）
│   └── afterEach.ts        # 后置守卫（进度条关闭、loading 关闭）
└── core/                   # 路由核心能力
    ├── RouteRegistry.ts    # 动态路由注册 / 注销管理
    ├── ComponentLoader.ts  # 路由组件懒加载
    ├── MenuProcessor.ts    # 菜单数据获取与处理（前端/后端模式）
    ├── RouteTransformer.ts # 菜单数据转路由对象
    ├── RouteValidator.ts   # 路由合法性校验
    ├── RoutePermissionValidator.ts # 路径权限校验
    └── IframeRouteManager.ts # iframe 内嵌路由管理
```

**路由守卫核心流程（beforeEach）：**

```
1. 未登录 → 跳转 Login（携带 redirect 参数）
2. 已登录 & 动态路由未注册
   → 获取用户信息
   → 获取菜单数据（前端枚举 or 后端接口）
   → 注册动态路由
   → 保存 iframe 路由
   → 校验 worktab 标签页有效性
   → 校验目标路径权限 → 无权限跳首页
3. 根路径 "/" → 重定向到 homePath
4. 未匹配路由 → 404
```

路由 `meta` 字段说明：

| 字段        | 类型     | 说明                  |
| ----------- | -------- | --------------------- |
| `title`     | string   | 页面标题（i18n key）  |
| `icon`      | string   | 菜单图标（Iconify）   |
| `roles`     | string[] | 可访问的角色列表      |
| `authList`  | object[] | 按钮级权限列表        |
| `keepAlive` | boolean  | 是否缓存组件          |
| `isHide`    | boolean  | 是否在菜单中隐藏      |
| `isHideTab` | boolean  | 是否在 WorkTab 中隐藏 |
| `fixedTab`  | boolean  | 是否固定在 WorkTab 中 |

---

### 3.3 状态管理（`src/store/`）

使用 Pinia，所有 store 统一通过版本化 key（`sys-v{version}-{storeId}`）持久化到 localStorage。

```
store/
├── index.ts            # Pinia 实例 + 持久化插件配置
└── modules/
    ├── setting.ts      # 系统设置（布局/主题/显示开关/样式）
    ├── menu.ts         # 菜单列表 + 动态路由移除函数
    ├── user.ts         # 用户信息 + Token + 登录状态
    ├── worktab.ts      # WorkTab 标签页列表
    └── table.ts        # 表格全局状态
```

**settingStore** 是配置中心，管理：

- 菜单类型（LEFT / TOP / TOP_LEFT / DUAL_MENU）
- 系统主题（LIGHT / DARK / AUTO）
- 菜单主题（DESIGN / LIGHT / DARK）
- 界面显示开关（面包屑、标签页、快速入口等）
- 样式配置（圆角、容器宽度、边框、页面过渡）
- 节日特效配置

---

### 3.4 组件体系（`src/components/`）

组件分两个层级：

#### `core/`（基础/框架组件）

| 分类 | 组件 | 说明 |
| --- | --- | --- |
| **banners** | `art-basic-banner`, `art-card-banner` | 页面横幅 |
| **base** | `art-logo`, `art-svg-icon`, `art-back-to-top` | 基础 UI |
| **cards** | `art-stats-card`, `art-bar-chart-card`, `art-line-chart-card`, `art-donut-chart-card`, `art-progress-card`, `art-image-card`, `art-data-list-card`, `art-timeline-list-card` | 数据卡片 |
| **charts** | `art-bar-chart`, `art-line-chart`, `art-ring-chart`, `art-k-line-chart`, `art-map-chart`, `art-radar-chart`, `art-scatter-chart`, `art-h-bar-chart`, `art-dual-bar-compare-chart` | ECharts 封装 |
| **forms** | `art-form`, `art-search-bar`, `art-wang-editor`, `art-drag-verify`, `art-excel-import`, `art-excel-export`, `art-button-more`, `art-button-table` | 表单组件 |
| **tables** | `art-table`, `art-table-header` | 表格封装 |
| **media** | `art-video-player`, `art-cutter-img` | 媒体组件 |
| **text-effect** | `art-count-to`, `art-text-scroll`, `art-festival-text-scroll` | 文字效果 |
| **others** | `art-watermark`, `art-menu-right` | 水印、右键菜单 |
| **theme** | `theme-svg` | 主题切换 SVG 动画 |
| **widget** | `art-icon-button` | 图标按钮 |
| **views** | `ArtException`, `ArtResultPage`, 登录子视图 | 通用页面视图 |
| **layouts** | 见下方 | 布局组件 |

#### 布局组件（`core/layouts/`）

| 组件                   | 说明                               |
| ---------------------- | ---------------------------------- |
| `art-header-bar`       | 顶部导航栏（含用户菜单）           |
| `art-sidebar-menu`     | 左侧菜单（含子菜单）               |
| `art-horizontal-menu`  | 顶部水平菜单                       |
| `art-mixed-menu`       | 混合菜单（顶部+侧边）              |
| `art-breadcrumb`       | 面包屑导航                         |
| `art-work-tab`         | 多标签页（WorkTab）                |
| `art-page-content`     | 页面内容容器（含 keep-alive）      |
| `art-settings-panel`   | 系统设置抽屉（含多组 composables） |
| `art-global-component` | 全局组件容器（锁屏、水印等）       |
| `art-global-search`    | 全局搜索                           |
| `art-fast-enter`       | 快速入口                           |
| `art-notification`     | 通知中心                           |
| `art-screen-lock`      | 锁屏组件                           |
| `art-chat-window`      | 聊天窗口                           |
| `art-fireworks-effect` | 节日烟花特效                       |

#### `business/`（业务组件）

| 组件             | 说明                       |
| ---------------- | -------------------------- |
| `comment-widget` | 评论组件（含 CommentItem） |

---

### 3.5 页面视图（`src/views/`）

```
views/
├── index/          # 主布局容器（sidebar + header + content）
├── auth/           # 认证页（登录 / 注册 / 忘记密码）
├── dashboard/
│   ├── console/    # 工作台仪表盘
│   ├── analysis/   # 数据分析看板
│   └── ecommerce/  # 电商数据看板
├── system/
│   ├── user/       # 用户管理
│   ├── role/       # 角色管理
│   ├── menu/       # 菜单管理
│   ├── user-center/# 个人中心
│   └── nested/     # 嵌套路由示例（3 层）
├── template/       # 通用模板（卡片/图表/日历/地图/定价/横幅/聊天）
├── widgets/        # 小工具（富文本/表格/图标/二维码/水印/拖拽等）
├── examples/
│   ├── forms/      # 表单 & 搜索栏示例
│   ├── tables/     # 表格示例
│   ├── permission/ # 权限示例（按钮权限/页面可见性/角色切换）
│   ├── socket-chat/# WebSocket 聊天示例
│   └── tabs/       # 标签页示例
├── article/        # 文章（列表/详情/发布/评论）
├── exception/      # 异常页（403 / 404 / 500）
├── result/         # 结果页（成功 / 失败）
├── safeguard/      # 服务器监控
├── change/log/     # 变更日志
└── outside/        # iframe 内嵌页容器
```

---

### 3.6 接口层（`src/api/`）

```
api/
├── auth.ts             # 认证相关（登录、获取用户信息、刷新 Token）
└── system-manage.ts    # 系统管理接口（用户 / 角色 / 菜单 CRUD）
```

底层基于 `src/utils/http/index.ts`（Axios 封装）：

- 请求拦截：自动注入 `Authorization: accessToken`
- 响应拦截：统一处理业务状态码（200 = 成功，401 = 自动登出）
- 防抖：401 错误在 3 秒内只提示一次
- 重试：服务端 5xx / 超时错误支持可配置重试次数

---

### 3.7 工具函数（`src/utils/`）

```
utils/
├── index.ts                    # 常用工具函数（getFirstMenuPath 等）
├── router.ts                   # 路由工具（页面标题设置、NProgress 配置）
├── constants/                  # 常量（links、index）
├── form/                       # 表单工具（校验器、响应式布局）
├── http/                       # HTTP 封装（见 3.6）
│   ├── index.ts
│   ├── error.ts                # HttpError 类、错误处理
│   └── status.ts               # HTTP 状态码枚举
├── navigation/                 # 导航工具
│   ├── jump.ts                 # 页面跳转
│   ├── route.ts                # 路由操作
│   └── worktab.ts              # WorkTab 标签管理
├── socket/index.ts             # WebSocket 封装
├── storage/                    # Storage 工具
│   ├── storage.ts              # 读写封装
│   ├── storage-config.ts       # 存储 Key 常量
│   ├── storage-key-manager.ts  # 版本化存储键管理
│   └── index.ts
├── sys/                        # 系统工具
│   ├── console.ts              # 控制台启动信息
│   ├── error-handle.ts         # Vue 全局错误处理
│   ├── mittBus.ts              # 事件总线（mitt）
│   ├── upgrade.ts              # 跨版本数据迁移
│   └── index.ts
├── table/                      # 表格工具（缓存、配置、工具函数）
└── ui/                         # UI 工具
    ├── animation.ts            # 主题切换过渡动画
    ├── colors.ts               # 颜色计算（亮色/暗色变体）
    ├── emojo.ts                # Emoji 工具
    ├── iconify-loader.ts       # Iconify 图标加载
    ├── loading.ts              # 全局 Loading 服务
    ├── tabs.ts                 # WorkTab 操作
    └── index.ts
```

---

### 3.8 自定义指令（`src/directives/`）

| 指令          | 文件                    | 说明                        |
| ------------- | ----------------------- | --------------------------- |
| `v-auth`      | `core/auth.ts`          | 按钮级权限（authMark 匹配） |
| `v-roles`     | `core/roles.ts`         | 角色级权限                  |
| `v-highlight` | `business/highlight.ts` | 代码高亮                    |
| `v-ripple`    | `business/ripple.ts`    | 水波纹效果                  |

---

### 3.9 Hooks（`src/hooks/core/`）

| Hook | 说明 |
| --- | --- |
| `useTheme` | 主题切换（亮/暗/自动），9 级颜色变体计算，VueUse `usePreferredDark` 响应系统偏好 |
| `useAuth` | 权限校验辅助（按钮权限、角色判断） |
| `useCommon` | 通用 store 状态快捷访问 |
| `useAppMode` | 应用模式判断 |
| `useHeaderBar` | 顶部栏状态管理 |
| `useLayoutHeight` | 布局高度计算 |
| `useTable` / `useTableHeight` / `useTableColumns` | 表格相关 |
| `useChart` | ECharts 实例管理 |
| `useFastEnter` | 快速入口管理 |
| `useCeremony` | 节日特效管理 |

---

### 3.10 全局配置（`src/config/`）

```
config/
├── index.ts            # 主配置（系统名称、主题列表、菜单布局、颜色方案）
├── setting.ts          # 系统设置默认值（SETTING_DEFAULT_CONFIG）
└── modules/
    ├── component.ts    # 组件默认配置
    ├── fastEnter.ts    # 快速入口应用列表
    ├── festival.ts     # 节日配置（日期、名称）
    └── headerBar.ts    # 顶部栏功能模块配置
```

`AppConfig` 以 `Object.freeze` 冻结，防止运行时意外修改。

---

### 3.11 枚举（`src/enums/`）

| 枚举                 | 值                                        |
| -------------------- | ----------------------------------------- |
| `MenuTypeEnum`       | `left` / `top` / `top-left` / `dual-menu` |
| `SystemThemeEnum`    | `light` / `dark` / `auto`                 |
| `MenuThemeEnum`      | `design` / `light` / `dark`               |
| `LanguageEnum`       | `zh` / `en`                               |
| `ContainerWidthEnum` | `100%` / `1200px`                         |
| `MenuWidth`          | `64px`（收起宽度）                        |

---

### 3.12 国际化（`src/locales/`）

- 框架：`vue-i18n 9`（Composition API 模式）
- 语言文件：`langs/zh.json`（简体中文）、`langs/en.json`（英文）
- 语言偏好持久化到 localStorage（`user` store），启动时自动恢复
- 全局翻译函数：`$t`（从 `src/locales/index.ts` 导出，可在 store / utils 中使用）
- Element Plus 语言通过 `ElConfigProvider` 同步切换

---

## 四、页面布局结构

```
App.vue
└── RouterView
    ├── /auth/*            # 独立全屏页（登录/注册/忘记密码）
    ├── /exception/*       # 独立全屏页（403/404/500）
    └── /outside           # 主布局（views/index/index.vue）
        ├── #app-sidebar
        │   └── ArtSidebarMenu（或 ArtHorizontalMenu / ArtMixedMenu）
        ├── #app-main
        │   ├── #app-header
        │   │   └── ArtHeaderBar
        │   │       ├── ArtBreadcrumb
        │   │       ├── ArtWorkTab
        │   │       ├── ArtFastEnter
        │   │       ├── ArtGlobalSearch
        │   │       ├── ArtNotification
        │   │       └── ArtUserMenu
        │   └── #app-content
        │       └── ArtPageContent（RouterView + keep-alive）
        └── #app-global
            └── ArtGlobalComponent
                ├── ArtSettingsPanel（设置抽屉）
                ├── ArtScreenLock（锁屏）
                ├── ArtWatermark（水印）
                └── ArtFireworksEffect（节日烟花）
```

---

## 五、主题系统

支持 3 种主题模式：

```
LIGHT  → html class = ""
DARK   → html class = "dark"
AUTO   → 监听 prefers-color-scheme 媒体查询自动切换
```

切换时：

1. 临时注入 `* { transition: none !important }` 避免闪烁
2. 修改 `<html>` class
3. 动态生成 `--el-color-primary-light-1~9` CSS 变量（亮色/暗色变体）
4. 更新 settingStore，持久化到 localStorage
5. 两帧后移除禁用样式

菜单另有独立主题（DESIGN / LIGHT / DARK），在暗色系统主题下统一使用暗色菜单。

---

## 六、权限体系

### 路由级权限

- 动态路由在首次进入时由后端（或前端枚举）返回菜单列表
- `RoutePermissionValidator` 校验当前目标路径是否在菜单树中
- 无权限路由自动跳转首页

### 角色级权限

- 路由 meta 的 `roles` 字段声明可访问角色（如 `['R_SUPER', 'R_ADMIN']`）
- `v-roles` 指令控制 DOM 元素的显示

### 按钮级权限

- 路由 meta 的 `authList` 字段声明可操作权限列表（`authMark`）
- `v-auth="'add'"` 指令控制按钮显示

---

## 七、数据流

```
用户操作
    ↓
Views（调用 API / 修改 Store）
    ↓
API 层（src/api/）
    ↓
HTTP 工具（src/utils/http/）  ←→  Axios 拦截器（Token / 错误处理）
    ↓
后端接口
    ↓
Store（Pinia）← 响应式更新 → 组件自动重渲染
```

---

## 八、构建 & 工程化

| 工具                     | 用途                                 |
| ------------------------ | ------------------------------------ |
| Vite 7                   | 开发服务器 + 生产构建                |
| vue-tsc                  | TypeScript 类型检查                  |
| unplugin-auto-import     | Vue / VueUse / Pinia 等 API 自动导入 |
| unplugin-vue-components  | 组件自动注册                         |
| unplugin-element-plus    | Element Plus 按需引入                |
| vite-plugin-compression  | gzip 压缩                            |
| rollup-plugin-visualizer | 打包分析                             |
| terser                   | 代码压缩混淆                         |
| Oxlint + Oxfmt           | 代码规范                             |
| Stylelint                | 样式规范                             |
| Husky + lint-staged      | Git Hooks 提交检查                   |
| commitizen + cz-git      | 规范化提交信息                       |
| commitlint               | 提交信息校验                         |

构建命令：

```bash
pnpm dev          # 开发模式
pnpm build        # 类型检查 + 生产构建
pnpm serve        # 预览生产包
pnpm lint:fix     # 修复 lint 问题
pnpm clean:dev    # 清理开发缓存
```

---

## 九、关键设计决策

1. **Hash 路由**：使用 `createWebHashHistory`，无需服务器配置，方便静态部署。
2. **动态路由懒注册**：路由在首次登录后动态注册，退出登录时全部移除，避免权限残留。
3. **版本化存储键**：`sys-v{version}-{storeId}` 格式，跨版本升级时自动迁移旧数据。
4. **防抖登出**：401 错误 3 秒内只触发一次登出，防止并发请求导致多次跳转。
5. **主题切换无闪烁**：切换时禁用 CSS 过渡，完成后用 `requestAnimationFrame` 恢复。
6. **前端/后端菜单双模式**：`MenuProcessor` 支持从前端枚举路由模块或从后端接口获取菜单，切换简单。
7. **按需导入 Element Plus**：通过 `unplugin-element-plus` 实现，减小打包体积。
