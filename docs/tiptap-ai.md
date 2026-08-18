# TipTap 自研 AI 接入

本文说明如何在管理后台文章编辑器中接入自研 AI，而不使用 Tiptap Cloud / `@tiptap-pro/extension-ai`。

服务端已提供登录保护的 `POST /api/admin/ai`。前端工具栏尚未接线，按第 5 节接入即可。

## 1. 为什么不走官方 Pro

官方 [Basic AI Generation](https://tiptap.dev/docs/ai/basic/overview) 需要：

- Tiptap Cloud 订阅
- 私有 npm（`@tiptap-pro/extension-ai`）
- JWT（`aud: "AI"` + `AI:Generation`），不能把模型密钥放到浏览器

本项目编辑器是开源 TipTap 3 + `tiptap-markdown`，正文存 Markdown。博客场景只需要润色、扩写、摘要、校对、续写。自研后端可以：

- 密钥只放在 `apps/server`
- 接任意 OpenAI 兼容网关（OpenAI、火山方舟、DeepSeek）
- 不依赖 Tiptap 私有包和 Cloud 计费

官方扩展提供的是命令、流式插入、接受/拒绝装饰。这些 UI 自己做即可。

## 2. 架构

```
BlogTipTapEditor / editor.vue
        │  POST /api/admin/ai
        │  Authorization: Bearer <token>
        ▼
AdminController.completeAi
        │
        ▼
AiService.complete
        │  POST {AI_BASE_URL}/chat/completions
        │  Authorization: Bearer {AI_API_KEY}
        ▼
OpenAI 兼容模型
        │
        ▼
{ code: 0, data: { text }, message: "ok" }
```

约束：

- 管理接口走 `/api/admin/*`，不是公开的 `/api/articles`。
- 类级 `@XltCheckLogin()` 保护，未登录返回 401。
- 前端 axios 会解包 `{ code, data, message }`，业务代码只拿 `data`。
- 默认 axios 超时 15 秒，AI 请求必须单独把 timeout 调到 120 秒。
- 当前接口是一次性 completion，不是 SSE。流式见第 7 节。

## 3. 环境变量

在 `apps/server/.env` 中配置，不要写进 Vite 环境变量。

```bash
# OpenAI 兼容，如火山方舟 / DeepSeek
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `AI_API_KEY` | 是 | 模型网关密钥。未配置时接口返回 503「未配置 AI_API_KEY」 |
| `AI_BASE_URL` | 否 | 默认 `https://api.openai.com/v1`。不要带末尾 `/` |
| `AI_MODEL` | 否 | 默认 `gpt-4o-mini` |

火山方舟示例：

```bash
AI_API_KEY=your-ark-api-key
AI_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
AI_MODEL=ep-xxxxxxxx
```

DeepSeek 示例：

```bash
AI_API_KEY=your-deepseek-key
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

改完 `.env` 后重启 `apps/server`。

## 4. API 契约

### `POST /admin/ai`

需要登录。路径相对于全局前缀 `/api`，完整地址是 `/api/admin/ai`。

请求体：

```ts
interface AiCompleteRequest {
  action:
    | 'rephrase'
    | 'expand'
    | 'shorten'
    | 'continue'
    | 'summarize'
    | 'grammar'
    | 'translate'
    | 'prompt'
  text: string
  instruction?: string
}
```

| 字段 | 规则 | 说明 |
| --- | --- | --- |
| `action` | 必填，枚举见上 | 决定 system prompt |
| `text` | 必填，最长 20000 | 选区 Markdown；无选区时传全文 |
| `instruction` | 可选，最长 2000 | `action === 'prompt'` 时必填 |

成功响应的 `data`：

```ts
interface AiCompleteResult {
  text: string
}
```

`text` 是模型直接输出，约定为 Markdown，不含解释性前后缀。

动作与写入策略：

| `action` | 用途 | 建议写入方式 |
| --- | --- | --- |
| `rephrase` | 润色 | 替换选区；无选区则替换全文 |
| `expand` | 扩写 | 同上 |
| `shorten` | 缩短 | 同上 |
| `continue` | 续写 1–3 段 | 插入光标后，不替换 |
| `summarize` | ≤120 字摘要 | 回填文章 `summary`，不改正文 |
| `grammar` | 校对 | 替换选区或全文 |
| `translate` | 中英互译 | 替换选区或全文 |
| `prompt` | 自定义指令 | 替换选区或全文 |

错误：

| HTTP | `message` | 原因 |
| --- | --- | --- |
| 400 | 校验失败文案 | `action` 非法、`text` 为空、超长 |
| 400 | 自定义指令不能为空 | `action` 为 `prompt` 且未传 `instruction` |
| 401 | 未登录 | 缺少或无效 Bearer token |
| 503 | 未配置 AI_API_KEY | 服务端未配密钥 |
| 502 | 无法连接 AI 服务 | 网关不可达 |
| 502 | AI 服务请求失败 (`status`) | 网关返回非 2xx |
| 502 | AI 未返回内容 | 响应里没有 `choices[0].message.content` |

## 5. 前端接入

### 5.1 类型

在 `apps/art-design-pro/src/types/api/blog.d.ts` 的 `Api.Blog` 中增加：

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

### 5.2 API 客户端

在 `apps/art-design-pro/src/api/blog.ts` 增加方法。必须覆盖默认 15 秒超时：

```ts
completeAi(params: Api.Blog.AiCompleteRequest) {
  return request.post<Api.Blog.AiCompleteResult>({
    url: '/admin/ai',
    params,
    timeout: 120000,
    showErrorMessage: true
  })
}
```

现有 `request.post` 会把 `params` 当作 JSON body，并自动带上 `Authorization`。

### 5.3 TipTap 工具栏

改 `apps/art-design-pro/src/components/blog/BlogTipTapEditor.vue`。

选区与全文：

```ts
function getSelectedMarkdown() {
  const { from, to } = editor.state.selection
  if (from === to) return getMarkdown()
  return editor.state.doc.textBetween(from, to, '\n\n')
}
```

有选区时 `textBetween` 只拿纯文本。若要保留加粗、列表等结构，可改用 `editor.storage.markdown.serializer.serialize(editor.state.doc.cut(from, to))`（以当前 `tiptap-markdown` 实际 API 为准）。第一版用纯文本即可。

调用与写回：

```ts
const aiLoading = ref(false)

async function runAi(action: Api.Blog.AiAction, instruction?: string) {
  const { from, to } = editor.state.selection
  const hasSelection = from !== to
  const text = hasSelection
    ? editor.state.doc.textBetween(from, to, '\n\n')
    : getMarkdown()
  if (!text.trim()) {
    ElMessage.warning('请先输入或选中正文')
    return
  }

  aiLoading.value = true
  try {
    const { text: result } = await blogApi.completeAi({ action, text, instruction })
    if (action === 'continue') {
      editor.chain().focus().insertContent(result).run()
      return
    }
    if (hasSelection) {
      editor.chain().focus().insertContentAt({ from, to }, result).run()
      return
    }
    editor.commands.setContent(result)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'AI 请求失败')
  } finally {
    aiLoading.value = false
  }
}
```

`summarize` 不要在编辑器组件里改正文。向父组件抛事件，由 `editor.vue` 写入 `form.summary`：

```ts
const emit = defineEmits<{
  summarize: [text: string]
}>()

// runAi 中：
if (action === 'summarize') {
  emit('summarize', result)
  return
}
```

```vue
<BlogTipTapEditor
  v-if="editorMode === 'rich'"
  v-model="form.content"
  @summarize="form.summary = $event"
/>
```

工具栏建议放在图片按钮旁，用 `ElDropdown`：

- 润色 → `rephrase`
- 扩写 → `expand`
- 缩短 → `shorten`
- 续写 → `continue`
- 校对 → `grammar`
- 翻译 → `translate`
- 生成摘要 → `summarize`
- 自定义… → `ElMessageBox.prompt` 后走 `prompt`

加载中禁用下拉，避免重复提交。

### 5.4 Markdown 模式

`BlogMarkdownEditor` 也可以调同一个 `blogApi.completeAi`。选区用 textarea 的 `selectionStart` / `selectionEnd`；无选区传全文。摘要同样回填 `form.summary`。

## 6. 实现落点

| 文件 | 状态 | 职责 |
| --- | --- | --- |
| `apps/server/src/admin/ai.dto.ts` | 已完成 | 请求校验 |
| `apps/server/src/admin/ai.service.ts` | 已完成 | 调 OpenAI 兼容网关 |
| `apps/server/src/admin/admin.controller.ts` | 已完成 | `POST admin/ai` |
| `apps/server/src/admin/admin.module.ts` | 已完成 | 注册 `AiService` |
| `apps/server/.env.example` | 已完成 | 环境变量模板 |
| `apps/server/.env` | 未改 | 填入真实 `AI_API_KEY` |
| `apps/art-design-pro/src/types/api/blog.d.ts` | 待做 | 前端类型 |
| `apps/art-design-pro/src/api/blog.ts` | 待做 | `completeAi` |
| `apps/art-design-pro/src/components/blog/BlogTipTapEditor.vue` | 待做 | 工具栏 |
| `apps/art-design-pro/src/views/blog/articles/editor.vue` | 待做 | 摘要回填 |
| `apps/art-design-pro/src/components/blog/BlogMarkdownEditor.vue` | 可选 | Markdown 模式 |

不要把密钥提交进仓库。`.env` 保持本地。

## 7. TanStack AI 调研

对照官方文档：[Overview](https://tanstack.com/ai/latest/docs/getting-started/overview)、[Server Quick Start](https://tanstack.com/ai/latest/docs/getting-started/quick-start-server)、[Vue Quick Start](https://tanstack.com/ai/latest/docs/getting-started/quick-start-vue)、[OpenAI-Compatible](https://tanstack.com/ai/latest/docs/adapters/openai-compatible)。

### 它是什么

TanStack AI 是类型安全的 LLM SDK，不是 TipTap 插件。核心是：

- `@tanstack/ai`：`chat()`、`summarize()`、`toolDefinition()`、SSE 封装
- `@tanstack/ai-openai`：官方 OpenAI，以及 `openaiCompatible({ baseURL, apiKey, models })`
- `@tanstack/ai-vue`：`useChat` + `fetchServerSentEvents`，面向聊天 UI
- adapter：OpenAI、Anthropic、Gemini、OpenRouter、Ollama、BytePlus 等

默认输出是 **AG-UI SSE 流**（`toServerSentEventsResponse`），不是 `{ text }` JSON。一次性文本要用 `streamToText(chat(...))`。

火山方舟没有一等 adapter，走兼容层即可：

```ts
import { chat, streamToText } from '@tanstack/ai'
import { openaiCompatible } from '@tanstack/ai-openai/compatible'

const ark = openaiCompatible({
  name: 'ark',
  baseURL: process.env.AI_BASE_URL!,
  apiKey: process.env.AI_API_KEY!,
  models: [process.env.AI_MODEL!]
})

const text = await streamToText(
  chat({
    adapter: ark(process.env.AI_MODEL!),
    systemPrompts: ['你是中文技术博客编辑。只输出结果正文。'],
    messages: [{ role: 'user', content: dto.text }]
  })
)
```

### 和当前方案比

| | 现有 `AiService` + fetch | TanStack AI |
| --- | --- | --- |
| 依赖 | 无新增 | `@tanstack/ai` + `@tanstack/ai-openai`，聊天再加 `@tanstack/ai-vue` |
| 当前需求 | 一次改写，返回 `{ text }` | 也能做，但要绕过默认 SSE |
| 流式聊天 | 要自己写 SSE、绕过 `TransformInterceptor` | 自带 SSE + `useChat` |
| Tool / Agent | 没有 | `toolDefinition().server()`，模型自己调 |
| TipTap 写回 | 自己 `insertContent` | 不管编辑器，只给消息流 |
| 成熟度 | 代码面小 | 新库，API 还在变（`modelOptions` 迁移） |

`useChat` 管的是 `messages[]`，不是选区替换。工具栏「润色选中段落」仍然要自己调 `blogApi.completeAi` 再写回 TipTap。TanStack 替不掉这一层。

Nest 也没有官方示例。文档给的是 Express：`toServerSentEventsResponse` 再 `res.writeHead` + `pump`。接进来必须跳过全局 JSON interceptor。

### 结论

**第一期不要引 TanStack AI。** 现有 `POST /admin/ai` 已经覆盖润色、扩写、摘要、校对。多两个包解决不了选区写回，还会和 `{ code, data }` 响应格式打架。

值得换成 TanStack 的时机：

1. 编辑器旁要做多轮 AI 对话（`useChat`）
2. 要流式打字机，且愿意单独做 SSE 出口
3. 模型要调工具（查文章、插图、改摘要）

到那时只换 `AiService` 内部实现，对外仍保持 `POST /admin/ai` → `{ text }`。聊天另开 `POST /admin/ai/chat` 走 SSE。

## 8. 流式（后续）

当前 completion 足够支撑工具栏。若要打字机效果，需要另开 `POST /admin/ai/stream`，并注意：

1. 全局 `TransformInterceptor` 会把返回值包成 JSON，SSE 必须绕过它，直接写 Express `Response`。
2. 前端不要走 `request.post`。用 `fetch` + `Authorization` + `ReadableStream`。
3. 模型流式输出 Markdown 时，边收边 `insertContent` 容易把半截语法插坏。更稳的做法是先插入占位，结束后一次性 `setContent` / `insertContentAt`。
4. 若届时引入 TanStack AI，优先用 `toServerSentEventsResponse` + `@tanstack/ai-vue` 的 `useChat`，不要再手写一套 SSE 协议。

## 9. 本地验收

1. 在 `apps/server/.env` 填好 `AI_API_KEY`，必要时改 `AI_BASE_URL`、`AI_MODEL`。
2. 重启 server。
3. 登录管理后台，用已登录 token 调用：

```bash
curl -s http://localhost:3000/api/admin/ai \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"action":"summarize","text":"这是一篇关于 NestJS 的草稿。"}'
```

期望：

```json
{ "code": 0, "data": { "text": "……" }, "message": "ok" }
```

未登录应返回 401。未配密钥应返回 503。
