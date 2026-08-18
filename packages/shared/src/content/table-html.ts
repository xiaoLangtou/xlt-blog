import sanitizeHtml from 'sanitize-html'

const marker = 'data-blog-table="1"'
const tablePattern = /<table\b[^>]*data-blog-table=["']1["'][^>]*>[\s\S]*?<\/table>/gi
const fencedCodePattern = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g
const backgrounds = new Set(['neutral', 'red', 'amber', 'green', 'blue', 'purple'])
const alignments = new Set(['left', 'center', 'right'])
const fitModes = new Set(['content', 'container'])

export interface TableFragmentExtraction {
  markdown: string
  fragments: Map<string, string>
}

function boundedInteger(value: string | undefined, min: number, max: number) {
  const number = Number(value)
  return Number.isInteger(number) && number >= min && number <= max ? String(number) : undefined
}

function safeUrl(value: string) {
  try {
    const url = new URL(value, 'https://table.local')
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? value : undefined
  } catch {
    return undefined
  }
}

export function sanitizeTableHtml(html: string): string {
  const sanitized = sanitizeHtml(html, {
    allowedTags: [
      'table',
      'colgroup',
      'col',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      's',
      'del',
      'u',
      'code',
      'a'
    ],
    allowedAttributes: {
      table: ['data-blog-table', 'data-fit'],
      col: ['data-width'],
      th: ['colspan', 'rowspan', 'data-align', 'data-background', 'data-colwidth'],
      td: ['colspan', 'rowspan', 'data-align', 'data-background', 'data-colwidth'],
      a: ['href', 'title', 'target', 'rel']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    exclusiveFilter(frame) {
      return frame.tag === 'table' && frame.attribs['data-blog-table'] !== '1'
    },
    transformTags: {
      table: (_tag, attrs) => ({
        tagName: 'table',
        attribs: {
          'data-blog-table': '1',
          ...(fitModes.has(attrs['data-fit']) ? { 'data-fit': attrs['data-fit'] } : {})
        }
      }),
      col: (_tag, attrs) => ({
        tagName: 'col',
        attribs: boundedInteger(attrs['data-width'], 40, 1600)
          ? { 'data-width': boundedInteger(attrs['data-width'], 40, 1600)! }
          : {}
      }),
      th: (_tag, attrs) => ({ tagName: 'th', attribs: normalizeCellAttributes(attrs) }),
      td: (_tag, attrs) => ({ tagName: 'td', attribs: normalizeCellAttributes(attrs) }),
      a: (_tag, attrs) => {
        const href = attrs.href ? safeUrl(attrs.href) : undefined
        const target = attrs.target === '_blank' ? '_blank' : undefined
        return {
          tagName: 'a',
          attribs: {
            ...(href ? { href } : {}),
            ...(attrs.title ? { title: attrs.title.slice(0, 300) } : {}),
            ...(target ? { target, rel: 'noopener noreferrer' } : {})
          }
        }
      }
    }
  }).trim()

  const roots = sanitized.match(/<table\b/g)?.length ?? 0
  if (roots !== 1 || !sanitized.startsWith(`<table ${marker}`) || !sanitized.endsWith('</table>')) {
    throw new Error('表格 HTML 结构无效')
  }
  if (sanitized.length > 200_000) throw new Error('表格内容过大')
  const cells = sanitized.match(/<(?:th|td)\b/g)?.length ?? 0
  if (cells > 800) throw new Error('表格单元格数量超过限制')
  return sanitized
}

function normalizeCellAttributes(attrs: Record<string, string>) {
  const colspan = boundedInteger(attrs.colspan, 1, 32)
  const rowspan = boundedInteger(attrs.rowspan, 1, 100)
  const align = alignments.has(attrs['data-align']) ? attrs['data-align'] : undefined
  const background = backgrounds.has(attrs['data-background'])
    ? attrs['data-background']
    : undefined
  const colwidth = attrs['data-colwidth']
    ?.split(',')
    .map((value) => boundedInteger(value, 40, 1600))
    .filter(Boolean)
    .join(',')
  return {
    ...(colspan && colspan !== '1' ? { colspan } : {}),
    ...(rowspan && rowspan !== '1' ? { rowspan } : {}),
    ...(align ? { 'data-align': align } : {}),
    ...(background ? { 'data-background': background } : {}),
    ...(colwidth ? { 'data-colwidth': colwidth } : {})
  }
}

export function extractTableFragments(content: string): TableFragmentExtraction {
  const protectedRanges = [...content.matchAll(fencedCodePattern)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length
  }))
  const fragments = new Map<string, string>()
  let sequence = 0
  const markdown = content.replace(tablePattern, (table, offset: number) => {
    if (protectedRanges.some((range) => offset >= range.start && offset < range.end)) return table
    const token = `BLOGTABLETOKEN${sequence++}END`
    fragments.set(token, sanitizeTableHtml(table))
    return `\n\n${token}\n\n`
  })
  return { markdown, fragments }
}

export function restoreTableFragments(rendered: string, fragments: Map<string, string>) {
  let result = rendered
  for (const [token, table] of fragments) {
    result = result.replace(new RegExp(`<p>${token}<\\/p>|${token}`, 'g'), table)
  }
  return result
}

export function normalizeArticleContent(
  content: string,
  format: 'markdown' | 'html' = 'html'
): string {
  return format === 'markdown'
    ? normalizeMarkdownContent(content)
    : normalizeHtmlContent(content)
}

function normalizeHtmlContent(content: string): string {
  // 富文本正文为安全 HTML：先抽取并严格校验增强表格，再对其余 HTML 走富白名单净化，最后还原表格。
  const { markdown, fragments } = extractTableFragments(content)
  const safe = sanitizeArticleHtml(markdown)
  return restoreTableFragments(safe, fragments).replace(/\n{3,}/g, '\n\n').trim()
}

function normalizeMarkdownContent(content: string): string {
  // Markdown 正文：保留 Markdown 结构；保护代码块/行内代码，抽取增强表格严格校验，
  // 其余仅按「内联安全 HTML 白名单」净化（放行下划线/高亮/换行等 Markdown 无法表达的内联标签）。
  const codeStore = new Map<string, string>()
  let codeSeq = 0
  const codeProtected = content.replace(fencedCodePattern, (match) => {
    const token = `BLOGCODETOKEN${codeSeq++}END`
    codeStore.set(token, match)
    return token
  })
  const { markdown, fragments } = extractTableFragments(codeProtected)
  const safe = sanitizeInlineHtml(markdown)
  let result = restoreTableFragments(safe, fragments)
  for (const [token, code] of codeStore) {
    result = result.replace(token, () => code)
  }
  return result.replace(/\n{3,}/g, '\n\n').trim()
}

const inlineHtmlTags = ['br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'mark', 'sub', 'sup', 'code', 'a']

export function sanitizeInlineHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: inlineHtmlTags,
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      mark: ['data-color', 'style']
    },
    allowedStyles: {
      mark: { 'background-color': colorPattern, color: colorPattern }
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard',
    transformTags: {
      a: (_tag, attrs) => {
        const href = attrs.href ? safeUrl(attrs.href) : undefined
        const target = attrs.target === '_blank' ? '_blank' : undefined
        return {
          tagName: 'a',
          attribs: {
            ...(href ? { href } : {}),
            ...(attrs.title ? { title: attrs.title.slice(0, 300) } : {}),
            ...(target ? { target, rel: 'noopener noreferrer' } : {})
          }
        }
      }
    }
  })
}

const articleHtmlTags = [
  'p',
  'br',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'mark',
  'sub',
  'sup',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'span',
  'div',
  'label',
  'input',
  'table',
  'colgroup',
  'col',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td'
]

const colorPattern = [/^#(?:[0-9a-f]{3,8})$/i, /^rgba?\([\d\s.,%/]+\)$/i]
const languageClassPattern = /^language-[\w-]+$/

function safeImageSrc(value: string) {
  try {
    // 允许站内相对路径（如 /uploads/...）与 http(s) 绝对地址；禁止 data:/javascript: 等。
    if (value.startsWith('/')) return value
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? value : undefined
  } catch {
    return undefined
  }
}

export function sanitizeArticleHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: articleHtmlTags,
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width'],
      code: ['class'],
      ol: ['start'],
      ul: ['data-type'],
      li: ['data-checked', 'data-type'],
      input: ['type', 'checked', 'disabled'],
      mark: ['data-color', 'style'],
      table: ['data-blog-table', 'data-fit'],
      col: ['data-width', 'style'],
      th: ['colspan', 'rowspan', 'data-align', 'data-background', 'data-colwidth', 'style'],
      td: ['colspan', 'rowspan', 'data-align', 'data-background', 'data-colwidth', 'style']
    },
    allowedStyles: {
      mark: { 'background-color': colorPattern, color: colorPattern },
      col: { width: [/^\d+px$/] }
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard',
    transformTags: {
      a: (_tag, attrs) => {
        const href = attrs.href ? safeUrl(attrs.href) : undefined
        const target = attrs.target === '_blank' ? '_blank' : undefined
        return {
          tagName: 'a',
          attribs: {
            ...(href ? { href } : {}),
            ...(attrs.title ? { title: attrs.title.slice(0, 300) } : {}),
            ...(target ? { target, rel: 'noopener noreferrer' } : {})
          }
        }
      },
      img: (_tag, attrs) => {
        const src = attrs.src ? safeImageSrc(attrs.src) : undefined
        const width = boundedInteger(attrs.width, 40, 1600)
        return {
          tagName: 'img',
          attribs: {
            ...(src ? { src } : {}),
            ...(attrs.alt ? { alt: attrs.alt.slice(0, 300) } : {}),
            ...(width ? { width } : {})
          }
        }
      },
      code: (_tag, attrs) => {
        const language = languageClassPattern.test(attrs.class ?? '') ? attrs.class : undefined
        return { tagName: 'code', attribs: language ? { class: language } : {} }
      },
      input: (_tag, attrs) => ({
        // 任务列表复选框：渲染态一律只读，仅保留勾选状态。
        tagName: 'input',
        attribs: {
          type: 'checkbox',
          disabled: 'disabled',
          ...(attrs.checked !== undefined ? { checked: 'checked' } : {})
        }
      }),
      // 所有表格统一标记为增强表格（含 Markdown/粘贴来源），前台走一致的渲染与滚动包裹。
      table: (_tag, attrs) => ({
        tagName: 'table',
        attribs: {
          'data-blog-table': '1',
          ...(fitModes.has(attrs['data-fit']) ? { 'data-fit': attrs['data-fit'] } : {})
        }
      }),
      th: (_tag, attrs) => ({ tagName: 'th', attribs: articleCellAttributes(attrs) }),
      td: (_tag, attrs) => ({ tagName: 'td', attribs: articleCellAttributes(attrs) })
    }
  }).trim()
}

// 单元格属性：复用增强表格规范化，并额外把 Markdown 表格的 style text-align 映射为 data-align。
function articleCellAttributes(attrs: Record<string, string>) {
  const base = normalizeCellAttributes(attrs) as Record<string, string>
  if (!base['data-align']) {
    const match = /text-align:\s*(left|center|right)/i.exec(attrs.style ?? '')
    if (match) base['data-align'] = match[1].toLowerCase()
  }
  return base
}
