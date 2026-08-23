# 管理端界面收敛 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将媒体存储、登录与 Markdown 导入收敛为系统优先视觉，并阻止已完成导入批次被重复提交。

**Architecture:** 保持现有 API、认证副作用与存储安全状态分离不变。媒体页仅替换局部布局和主题令牌；登录将复杂的角色展示替换为轻量品牌场景；导入弹窗引入显式批次阶段以锁定完成批次。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript、Element Plus、项目 CSS 变量、TanStack Vue Query。

---

## 文件职责

- `apps/art-design-pro/src/views/blog/attachments/storage.vue`：存储页的系统化布局、选择/保存/测试/激活/迁移状态。
- `apps/art-design-pro/src/views/blog/attachments/StorageConfigFields.vue`：动态存储字段及按后端的最小校验提示。
- `apps/art-design-pro/src/views/auth/login/index.vue`：保留认证流程的 Element Plus 登录表单与品牌数据传递。
- `apps/art-design-pro/src/views/auth/login/LoginScene.vue`：只负责低对比品牌场景和焦点状态展示。
- `apps/art-design-pro/src/views/auth/login/style.css`：系统主题令牌下的双栏和移动端登录布局。
- `apps/art-design-pro/src/views/blog/articles/index.vue`：导入批次阶段、50 文件限制、步骤条和完成锁定。

### Task 1: 使媒体存储配置回归系统页面视觉

**Files:**
- Modify: `apps/art-design-pro/src/views/blog/attachments/storage.vue`
- Modify: `apps/art-design-pro/src/views/blog/attachments/StorageConfigFields.vue`

- [ ] **Step 1: 收敛页面结构和局部样式。**

保留 `ElCard`、`ElRadioGroup`、`ElCollapse` 和现有三种后端数据。将页面宽度、卡片边框、文字层级、按钮间距及移动端断点统一使用 `--art-main-bg-color`、`--default-box-color`、`--default-border`、`--theme-color` 与 Element Plus 文本令牌。删除存储页专用的大面积选中阴影和过度的卡片高度；选择态仅保留主题色边框、浅色背景与图标色。

- [ ] **Step 2: 保持存储状态边界。**

保留以下行为：

```ts
function buildConfig(active = form.active): Api.Blog.StorageConfigInput {
  return { active, local: { ...form.local }, rusfs: /* 保留脱敏凭据规则 */, s3: /* 保留脱敏凭据规则 */ }
}

async function save(activate = false) {
  const backend = selectedBackend.value
  await blogApi.updateStorageConfig(buildConfig(activate ? backend : form.active))
}
```

普通“保存配置”不得改变 `form.active`；“设为当前存储”继续显式调用 `save(true)`；测试继续使用当前编辑的未保存草稿。列表模式展开后必须直接渲染 `StorageConfigFields`、保存、测试和激活按钮。

- [ ] **Step 3: 放宽 S3 标准服务的 endpoint 约束。**

在 `validateSelectedConfig()` 中保留 RustFS 对 `endpoint`、`bucket`、`accessKey`、`secretKey` 的校验。S3 始终校验 `bucket`、`accessKey`、`secretKey`，仅当 `form.s3.provider === 'custom'` 时校验 `endpoint`。在字段组件中将 S3 endpoint 的 `required` 视觉标记限制为 `custom`。

- [ ] **Step 4: 保持迁移目标和显示目标一致。**

迁移面板只在 `form.active !== 'local'` 时显示。确认文案必须使用 `activeMeta.value?.shortTitle`，不得使用 `selectedBackend`。不增加无法由现有 API 支持的“待迁移数量”伪数据。

### Task 2: 将登录页收敛为低对比品牌场景

**Files:**
- Modify: `apps/art-design-pro/src/views/auth/login/index.vue`
- Modify: `apps/art-design-pro/src/views/auth/login/LoginScene.vue`
- Modify: `apps/art-design-pro/src/views/auth/login/style.css`

- [ ] **Step 1: 保持认证控制层不变。**

不得修改 `fetchLogin`、`userStore.clearSession()`、token/userInfo/login status 写入、成功通知或 `router.push(redirect || '/')`。继续以 `ElCard`、`ElForm`、`ElFormItem`、`ElInput`、`ElButton` 渲染表单，密码显隐按钮保持为 Element Plus `ElButton link`。

- [ ] **Step 2: 将系统名称传入展示场景。**

在登录容器中传递：

```vue
<LoginScene
  :system-name="systemName"
  :focused-field="focusedField"
  :password-visible="passwordVisible"
  :password-length="formData.password.length"
  :loading="loading"
/>
```

场景组件新增可选 `systemName` prop，并使用它替代硬编码品牌名。

- [ ] **Step 3: 替换多角色大场景。**

`LoginScene.vue` 删除四个角色、鼠标跟随、网格、发光层和高饱和多色块。改为“品牌标识 + 欢迎文案 + 两个主题色低对比圆形/线条装饰”。仅保留 `focusedField`、`passwordVisible`、`passwordLength`、`loading` 对文案或小状态标记的轻量反馈；所有颜色从 `--theme-color`、`--el-color-primary-*`、`--default-box-color` 和 `color-mix()` 派生。

- [ ] **Step 4: 精简页面样式。**

在 `style.css` 中维持宽屏双栏、窄屏单栏。表单卡片使用系统边框和半径，去除不必要的输入框深度覆盖、复杂动画和大字体；把视觉焦点放在 Element Plus 表单本身。保留 `prefers-reduced-motion`。

### Task 3: 将 Markdown 导入变成不可重复提交的步骤批次

**Files:**
- Modify: `apps/art-design-pro/src/views/blog/articles/index.vue`

- [ ] **Step 1: 定义批次阶段与派生状态。**

在导入状态附近新增：

```ts
type ImportPhase = 'editing' | 'submitting' | 'completed'
const importPhase = ref<ImportPhase>('editing')
const importLocked = computed(() => importPhase.value !== 'editing')
```

`resetImportDialog()` 将阶段恢复为 `editing`；关闭弹窗后才清空文件、默认值、进度与结果。

- [ ] **Step 2: 在选择与提交前强制限制 50 文件。**

为 `ElUpload` 添加 `:limit="50"` 与 `:on-exceed="handleImportExceed"`。实现：

```ts
function handleImportExceed() {
  ElMessage.warning('一次最多导入 50 个 Markdown 文件')
}
```

在 `submitImport()` 的文件解析后添加 `if (files.length > 50)` 检查，防止用户通过非 UI 路径绕过限制。

- [ ] **Step 3: 将提交函数变成单批次状态机。**

函数开头拒绝非编辑阶段：

```ts
if (importPhase.value !== 'editing') return
```

请求开始时设置 `importPhase.value = 'submitting'`；请求成功或接口返回逐文件部分失败结果后，设置 `importPhase.value = 'completed'` 并保留结果表。网络层抛出异常时恢复 `editing`，让用户可修正后重试。`importing` 继续只表示请求进行中。

- [ ] **Step 4: 将现有三块提示改为 Element Plus 步骤条。**

使用：

```vue
<ElSteps :active="importPhase === 'editing' ? 0 : importPhase === 'submitting' ? 2 : 3" finish-status="success" align-center>
  <ElStep title="选择文件" :description="`${selectedFiles.length} 个待导入`" />
  <ElStep title="设置默认值" description="分类、标签与状态" />
  <ElStep title="确认结果" :description="importPhase === 'completed' ? '本批次已完成' : '逐文件处理结果'" />
</ElSteps>
```

所有颜色使用系统令牌和 Element Plus 默认步骤样式，不硬编码原型绿色。

- [ ] **Step 5: 锁定完成批次并显式关闭。**

在 `submitting` 和 `completed` 阶段禁用文件选择、删除、默认值控件和“开始导入”。footer 按阶段显示：编辑态“取消 + 开始导入”，提交态仅显示加载状态，完成态仅显示“完成并关闭”。“完成并关闭”调用 `closeImportDialog()`，由 `@closed` 的 `resetImportDialog()` 创建下一个批次。

- [ ] **Step 6: 保留结果、进度和刷新行为。**

继续显示 `importResult.results`、成功/失败汇总和上传进度。请求返回后继续执行：

```ts
params.page = 1
refetch()
```

不自动关闭结果弹窗，确保用户可以核对每个文件的结果。

### Task 4: 验证

**Files:**
- Verify only: 上述六个 Vue/CSS 文件。

- [ ] **Step 1: 定向类型检查。**

运行：

```bash
pnpm --dir apps/art-design-pro type-check 2>&1 | grep -E 'src/views/(blog/attachments/(storage|StorageConfigFields)|auth/login/(LoginScene|index)|blog/articles/index)' || true
```

预期：本次六个文件没有错误输出；项目已有的无关 type-check 错误不作为本次失败。

- [ ] **Step 2: 生产构建。**

运行：

```bash
pnpm --dir apps/art-design-pro build
```

预期：退出码 0；既有动态导入和大 chunk 警告可保留。

- [ ] **Step 3: 补丁格式和完成态静态核验。**

运行：

```bash
git diff --check
grep -n "importPhase\|完成并关闭\|开始导入" apps/art-design-pro/src/views/blog/articles/index.vue
```

预期：`git diff --check` 无输出；导入模板在完成态只有“完成并关闭”，提交函数在非 `editing` 阶段直接返回。
