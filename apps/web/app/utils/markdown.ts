import { CodeTheme, extractTableFragments, restoreTableFragments } from '@xlt-blog/shared'
import MarkdownIt from 'markdown-it'
import { createHighlighter, type Highlighter, type BundledTheme } from 'shiki'

const minImageWidth = 120
const maxImageWidth = 1600
const codeThemes: Record<CodeTheme, { light: BundledTheme; dark: BundledTheme }> = {
  github: { light: 'github-light', dark: 'github-dark' },
  atom: { light: 'one-light', dark: 'one-dark-pro' }
}

let highlighterPromise: Promise<Highlighter> | null = null

function normalizeCodeTheme(codeTheme: CodeTheme | undefined): CodeTheme {
  return codeTheme === CodeTheme.Atom ? CodeTheme.Atom : CodeTheme.Github
}

function getHighlighter() {
  highlighterPromise ??= createHighlighter({
    themes: ['github-light', 'github-dark', 'one-light', 'one-dark-pro'],
    langs: [
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
  })
  return highlighterPromise
}

function applyImageWidth(md: MarkdownIt) {
  const defaultImageRenderer =
    md.renderer.rules.image ??
    ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options))

  md.renderer.rules.image = (tokens, index, options, env, self) => {
    const token = tokens[index]
    if (!token) return defaultImageRenderer(tokens, index, options, env, self)
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

// ---------- Markdown 格式：markdown-it + Shiki 渲染 ----------
const rendererPromises = new Map<CodeTheme, Promise<MarkdownIt>>()

function getMarkdownRenderer(codeTheme: CodeTheme): Promise<MarkdownIt> {
  const theme = normalizeCodeTheme(codeTheme)
  let rendererPromise = rendererPromises.get(theme)
  if (!rendererPromise) {
    rendererPromise = getHighlighter().then((highlighter) => {
      const loaded = new Set(highlighter.getLoadedLanguages())
      const renderer = new MarkdownIt({
        html: true,
        linkify: true,
        highlight(code, lang) {
          const language = loaded.has(lang) ? lang : 'text'
          return highlighter.codeToHtml(code, { lang: language, themes: codeThemes[theme] })
        }
      })
      applyImageWidth(renderer)
      return renderer
    })
    rendererPromises.set(theme, rendererPromise)
  }
  return rendererPromise
}

// ---------- HTML 格式：仅对 <pre><code> 做 Shiki 渲染期高亮 ----------
function decodeEntities(input: string): string {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/g, "'")
    .replace(/&amp;/g, '&')
}

const codeBlockPattern = /<pre>\s*<code(?:\s+class="language-([\w-]+)")?\s*>([\s\S]*?)<\/code>\s*<\/pre>/gi

async function highlightHtmlCodeBlocks(content: string, codeTheme: CodeTheme): Promise<string> {
  const theme = normalizeCodeTheme(codeTheme)
  const matches = [...content.matchAll(codeBlockPattern)]
  if (!matches.length) return content
  const highlighter = await getHighlighter()
  const loaded = new Set(highlighter.getLoadedLanguages())
  let result = ''
  let cursor = 0
  for (const match of matches) {
    const [full, lang, escaped] = match
    const start = match.index ?? 0
    result += content.slice(cursor, start)
    const language = lang && loaded.has(lang) ? lang : 'text'
    result += highlighter.codeToHtml(decodeEntities(escaped ?? ''), {
      lang: language,
      themes: codeThemes[theme]
    })
    cursor = start + full.length
  }
  result += content.slice(cursor)
  return result
}

/**
 * 按正文格式渲染：
 * - markdown：markdown-it(html:true) + 增强表格 extract/restore + Shiki 高亮。
 * - html：正文已是写入时净化的安全 HTML，仅对代码块做 Shiki 渲染期高亮。
 */
export async function renderMarkdown(
  content: string,
  codeTheme: CodeTheme = CodeTheme.Github,
  format: 'markdown' | 'html' = 'html'
): Promise<string> {
  if (!content) return ''
  if (format === 'markdown') {
    const md = await getMarkdownRenderer(codeTheme)
    const { markdown, fragments } = extractTableFragments(content)
    return restoreTableFragments(md.render(markdown), fragments)
  }
  return highlightHtmlCodeBlocks(content, codeTheme)
}
