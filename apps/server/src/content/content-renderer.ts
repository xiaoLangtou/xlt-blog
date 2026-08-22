/**
 * 内容渲染器：rawContent → 语义 HTML → 白名单净化 → Shiki 双主题高亮。
 *
 * 这是全站唯一的渲染管线（方案第四节「转换器 Adapter」+ 第五节 sanitize + 第六节统一渲染）：
 * - 文章 / 页面保存时生成 renderHtml
 * - 后台预览接口实时渲染（与保存共用同一份代码，保证所见即所得）
 * - 批量重渲染接口回刷存量内容
 *
 * 注意：rawContent 永远原样存储，本模块只产出 renderHtml。
 */
import {
  CodeTheme,
  EditorType,
  extractTableFragments,
  restoreTableFragments,
  sanitizeRenderHtml
} from '@xlt-blog/shared'
import { createTiptapSchemaExtensions, createSharedLowlight } from '@xlt-blog/shared/tiptap'
import { getSchema, type Extensions } from '@tiptap/core'
import { DOMSerializer, Node as ProseMirrorNode } from '@tiptap/pm/model'
import {
  BlockColor,
  FontFamily,
  FontSize,
  Highlight as DomternalHighlight,
  LineHeight,
  ListIndent,
  StarterKit as DomternalStarterKit,
  Subscript,
  Superscript,
  TextAlign as DomternalTextAlign,
  TextColor,
  TextStyle,
  UniqueID,
  generateHTML as generateDomternalHTML
} from '@domternal/core'
import { CodeBlockLowlight as DomternalCodeBlockLowlight } from '@domternal/extension-code-block-lowlight'
import { Details as DomternalDetails } from '@domternal/extension-details'
import { Image as DomternalImage } from '@domternal/extension-image'
import { Table as DomternalTable } from '@domternal/extension-table'
import type { JSONContent } from '@domternal/core'
import MarkdownIt from 'markdown-it'
import { parseHTML } from 'linkedom'
import type { Highlighter } from 'shiki'

// ---------- Markdown 转换（与前台原渲染配置保持一致：html + linkify，不加 breaks） ----------

const minImageWidth = 120
const maxImageWidth = 1600

const markdown = new MarkdownIt({ html: true, linkify: true })

{
  // Markdown 图片 width 约定：![alt](url "width=640") → width 属性（与富文本编辑器行为一致）
  const defaultImageRenderer =
    markdown.renderer.rules.image ??
    ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options))
  markdown.renderer.rules.image = (tokens, index, options, env, self) => {
    const token = tokens[index]
    const titleIndex = token.attrIndex('title')
    const title = titleIndex >= 0 ? token.attrs?.[titleIndex]?.[1] : null
    const match = title ? /^width=(\d+)$/.exec(String(title).trim()) : null
    const width = match ? Number(match[1]) : null
    if (width && width >= minImageWidth && width <= maxImageWidth) {
      token.attrSet('width', String(width))
      token.attrSet('title', '')
    }
    return defaultImageRenderer(tokens, index, options, env, self)
  }
}

function renderMarkdownToHtml(raw: string): string {
  // 增强 HTML 表格先抽出（保护其不被 markdown-it 改写），渲染后原样还原；
  // 表格本身随后在 sanitizeRenderHtml 里统一走严格校验与归一。
  const { markdown: body, fragments } = extractTableFragments(raw)
  return restoreTableFragments(markdown.render(body), fragments)
}

// ---------- TipTap / Domternal JSON → HTML（schema 与前端编辑器严格一致） ----------

let tiptapExtensions: Extensions | null = null

function getTiptapExtensions(): Extensions {
  // 扩展是纯 schema 配置对象，无编辑器状态，缓存复用即可
  tiptapExtensions ??= createTiptapSchemaExtensions()
  return tiptapExtensions
}

// ---------- Node 端 DOM：TipTap 的 DOMSerializer 需要显式传入 document ----------

let serverDocument: Document | null = null

function getServerDocument(): Document {
  // 与 @domternal/core 的 Node 策略一致：linkedom 提供离屏 document
  serverDocument ??= parseHTML('<!DOCTYPE html><html><body></body></html>').document
  return serverDocument
}

/**
 * ProseMirror JSON → HTML（服务端版 generateHTML）。
 * @tiptap/core 的 generateHTML 内部直接读全局 window.document（Node 下不存在），
 * 这里手动组 schema 并把 linkedom document 显式传给 DOMSerializer。
 */
function generateTiptapHTML(json: JSONContent, extensions: Extensions): string {
  const schema = getSchema(extensions)
  const doc = ProseMirrorNode.fromJSON(schema, json)
  const fragment = DOMSerializer.fromSchema(schema).serializeFragment(doc.content, {
    document: getServerDocument()
  })
  const wrapper = getServerDocument().createElement('div')
  wrapper.appendChild(fragment)
  return wrapper.innerHTML
}

let domternalExtensions: unknown[] | null = null

function getDomternalExtensions() {
  // 与 BlogDomternalEditor 的 schema 级扩展一一对应（UI/行为类扩展不影响序列化，不需要）
  domternalExtensions ??= [
    DomternalStarterKit.configure({ codeBlock: false }),
    DomternalCodeBlockLowlight.configure({ lowlight: createSharedLowlight() }),
    DomternalImage,
    DomternalTextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    TextColor,
    FontSize,
    FontFamily,
    LineHeight,
    Subscript,
    Superscript,
    DomternalHighlight,
    DomternalTable,
    DomternalDetails,
    BlockColor,
    ListIndent,
    UniqueID
  ]
  return domternalExtensions
}

function parseJsonContent(raw: string, editorType: EditorType): JSONContent {
  try {
    return JSON.parse(raw) as JSONContent
  } catch {
    throw new Error(`${editorType} 原始内容不是合法 JSON`)
  }
}

// ---------- Shiki 双主题代码高亮（净化之后的最终加工，产物可信） ----------

const shikiThemes: Record<CodeTheme, { light: string; dark: string }> = {
  [CodeTheme.Github]: { light: 'github-light', dark: 'github-dark' },
  [CodeTheme.Atom]: { light: 'one-light', dark: 'one-dark-pro' }
}

const shikiLangs = [
  'js',
  'ts',
  'jsx',
  'tsx',
  'vue',
  'html',
  'css',
  'scss',
  'json',
  'yaml',
  'bash',
  'shell',
  'python',
  'go',
  'rust',
  'java',
  'sql',
  'markdown',
  'diff',
  'docker'
]

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  // shiki 为 ESM-only，CJS 服务端用动态 import 懒加载单例
  highlighterPromise ??= import('shiki').then(({ createHighlighter }) =>
    createHighlighter({
      themes: ['github-light', 'github-dark', 'one-light', 'one-dark-pro'],
      langs: shikiLangs
    })
  )
  return highlighterPromise
}

function decodeEntities(input: string): string {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/g, "'")
    .replace(/&amp;/g, '&')
}

// 净化后的代码块形如 <pre [data-*]><code class="language-x">escaped</code></pre>
const codeBlockPattern =
  /<pre\b([^>]*)>\s*<code(?:\s+class="language-([\w-]+)")?\s*>([\s\S]*?)<\/code>\s*<\/pre>/gi

/** 提取 pre 上保留的语义颜色属性，注入到 Shiki 生成的 pre 上 */
function carryBlockColorAttrs(preAttrs: string): string {
  const attrs: string[] = []
  for (const name of ['data-bg-color', 'data-text-color']) {
    const match = new RegExp(`${name}="([^"]*)"`).exec(preAttrs)
    if (match) attrs.push(`${name}="${match[1]}"`)
  }
  return attrs.join(' ')
}

async function highlightCodeBlocks(content: string, codeTheme: CodeTheme): Promise<string> {
  const matches = [...content.matchAll(codeBlockPattern)]
  if (!matches.length) return content
  const highlighter = await getHighlighter()
  const loaded = new Set(highlighter.getLoadedLanguages())
  const themes = shikiThemes[normalizeCodeTheme(codeTheme)]
  let result = ''
  let cursor = 0
  for (const match of matches) {
    const [full, preAttrs, lang, escaped] = match
    const start = match.index ?? 0
    result += content.slice(cursor, start)
    const language = lang && loaded.has(lang) ? lang : 'text'
    const highlighted = highlighter.codeToHtml(decodeEntities(escaped ?? ''), {
      lang: language,
      themes
    })
    const extraAttrs = carryBlockColorAttrs(preAttrs ?? '')
    result += extraAttrs
      ? highlighted.replace('<pre', `<pre ${extraAttrs}`)
      : highlighted
    cursor = start + full.length
  }
  result += content.slice(cursor)
  return result
}

function normalizeCodeTheme(codeTheme: CodeTheme | undefined): CodeTheme {
  return codeTheme === CodeTheme.Atom ? CodeTheme.Atom : CodeTheme.Github
}

// ---------- 统一入口 ----------

function toSemanticHtml(editorType: EditorType, rawContent: string): string {
  switch (editorType) {
    case EditorType.MD:
      return renderMarkdownToHtml(rawContent)
    case EditorType.TIPTAP:
      return generateTiptapHTML(parseJsonContent(rawContent, editorType), getTiptapExtensions())
    case EditorType.DOMTERNAL:
      return generateDomternalHTML(
        parseJsonContent(rawContent, editorType) as never,
        getDomternalExtensions() as never
      )
    default:
      throw new Error(`不支持的编辑器类型: ${editorType}`)
  }
}

/**
 * 完整渲染管线：语义 HTML → sanitize（增强表格抽取校验 + 白名单净化）→ Shiki 高亮。
 * 预览与保存共用，保证一致。
 */
export async function renderContentHtml(
  editorType: EditorType,
  rawContent: string,
  codeTheme: CodeTheme = CodeTheme.Github
): Promise<string> {
  if (!rawContent) return ''
  const semanticHtml = toSemanticHtml(editorType, rawContent)
  const safeHtml = sanitizeRenderHtml(semanticHtml)
  return highlightCodeBlocks(safeHtml, normalizeCodeTheme(codeTheme))
}
