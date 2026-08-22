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

/**
 * 渲染净化：对转换器输出的语义 HTML 做白名单净化（增强表格先抽取严格校验，净化后还原）。
 * 仅用于生成 renderHtml；rawContent 原样存储，不做任何改写。
 */
export function sanitizeRenderHtml(html: string): string {
  const { markdown: body, fragments } = extractTableFragments(html)
  const safe = sanitizeArticleHtml(body)
  return restoreTableFragments(safe, fragments).replace(/\n{3,}/g, '\n\n').trim()
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
  'td',
  'details',
  'summary',
  'figure',
  'figcaption'
]

const colorPattern = [/^#(?:[0-9a-f]{3,8})$/i, /^rgba?\([\d\s.,%/]+\)$/i]
const languageClassPattern = /^language-[\w-]+$/
/** 颜色属性值：hex / rgba / 命名色 token（Domternal Notion 色板等） */
const colorTokenPatterns = [...colorPattern, /^[a-z][a-z0-9-]{0,31}$/i]
/** 块级对齐值（含 TextAlign 支持的 justify） */
const blockAlignments = new Set(['left', 'center', 'right', 'justify'])
/** 字号（Domternal FontSize）：仅数值 + 安全单位 */
const fontSizePatterns = [/^\d{1,3}(\.\d+)?(px|em|rem|%)$/]
/** 字体族（Domternal FontFamily）：字体名列表，禁止括号 / 冒号等可构造注入的字符 */
const fontFamilyPatterns = [/^[\w\u4e00-\u9fa5 ,."'@-]+$/u]
/** 行高（Domternal LineHeight）：0.5–4 的纯数字 */
const lineHeightPatterns = [/^(?:[0-4](\.\d+)?)$/]

function isValidLineHeight(value: string | undefined): boolean {
  const parsed = Number(value)
  return Boolean(value) && Number.isFinite(parsed) && parsed >= 0.5 && parsed <= 4
}

function pickColorAttr(value: string | undefined): string | undefined {
  return value && colorTokenPatterns.some((pattern) => pattern.test(value)) ? value : undefined
}

/** 块级颜色属性（Domternal BlockColor：data-bg-color / data-text-color） */
function blockColorAttributes(attrs: Record<string, string>) {
  const bgColor = pickColorAttr(attrs['data-bg-color'])
  const textColor = pickColorAttr(attrs['data-text-color'])
  return {
    ...(bgColor ? { 'data-bg-color': bgColor } : {}),
    ...(textColor ? { 'data-text-color': textColor } : {})
  }
}

/** 块级属性归一：text-align 行内样式转语义 data-align，颜色属性保留，行高校验后保留，缩进保留 */
function blockAttributes(attrs: Record<string, string>) {
  const styleAlign = /text-align:\s*(left|center|right|justify)/i.exec(attrs.style ?? '')
  const align = blockAlignments.has(attrs['data-align'] ?? '')
    ? attrs['data-align']
    : styleAlign?.[1].toLowerCase()
  const lineHeight = /line-height:\s*([0-4](?:\.\d+)?)(?![\d.])/i.exec(attrs.style ?? '')?.[1]
  const paddingLeft = /padding-left:\s*(\d{1,3}px)/i.exec(attrs.style ?? '')?.[1]

  const styleEntries: string[] = []
  if (lineHeight && isValidLineHeight(lineHeight)) {
    styleEntries.push(`line-height: ${lineHeight}`)
  }
  if (paddingLeft) {
    styleEntries.push(`padding-left: ${paddingLeft}`)
  }

  return {
    ...blockColorAttributes(attrs),
    ...(align ? { 'data-align': align } : {}),
    ...(attrs['data-indent'] ? { 'data-indent': attrs['data-indent'] } : {}),
    ...(attrs['data-line-height'] ? { 'data-line-height': attrs['data-line-height'] } : {}),
    ...(styleEntries.length > 0 ? { style: styleEntries.join('; ') } : {})
  }
}

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
      ol: ['start', 'data-bg-color', 'data-text-color', 'data-indent', 'style'],
      ul: ['data-type', 'data-bg-color', 'data-text-color', 'data-indent', 'style'],
      li: ['data-checked', 'data-type', 'data-bg-color', 'data-text-color', 'style'],
      input: ['type', 'checked', 'disabled'],
      mark: ['data-color', 'data-bg-color', 'style'],
      span: ['data-text-color', 'data-font-size', 'data-font-family', 'data-line-height', 'style'],
      p: ['data-align', 'data-bg-color', 'data-text-color', 'data-line-height', 'data-indent', 'style'],
      h1: ['data-align', 'data-bg-color', 'data-text-color', 'data-line-height', 'style'],
      h2: ['data-align', 'data-bg-color', 'data-text-color', 'data-line-height', 'style'],
      h3: ['data-align', 'data-bg-color', 'data-text-color', 'data-line-height', 'style'],
      h4: ['data-align', 'data-bg-color', 'data-text-color', 'data-line-height', 'style'],
      h5: ['data-align', 'data-bg-color', 'data-text-color', 'data-line-height', 'style'],
      h6: ['data-align', 'data-bg-color', 'data-text-color', 'data-line-height', 'style'],
      blockquote: ['data-align', 'data-bg-color', 'data-text-color', 'style'],
      pre: ['data-bg-color', 'data-text-color', 'data-language', 'class'],
      table: ['data-blog-table', 'data-fit', 'data-bg-color', 'data-text-color'],
      col: ['data-width', 'style'],
      th: [
        'colspan',
        'rowspan',
        'data-align',
        'data-background',
        'data-colwidth',
        'data-bg-color',
        'data-text-color',
        'style'
      ],
      td: [
        'colspan',
        'rowspan',
        'data-align',
        'data-background',
        'data-colwidth',
        'data-bg-color',
        'data-text-color',
        'style'
      ],
      div: ['data-type', 'data-bg-color', 'data-text-color', 'class', 'style'],
      figure: ['class', 'style'],
      figcaption: ['class', 'style']
    },
    allowedStyles: {
      mark: { 'background-color': colorPattern, color: colorPattern },
      span: {
        color: colorPattern,
        'font-size': fontSizePatterns,
        'font-family': fontFamilyPatterns,
        'line-height': lineHeightPatterns
      },
      col: { width: [/^\d+px$/] },
      p: { 'line-height': lineHeightPatterns, 'padding-left': [/^\d{1,3}px$/] },
      h1: { 'line-height': lineHeightPatterns },
      h2: { 'line-height': lineHeightPatterns },
      h3: { 'line-height': lineHeightPatterns },
      h4: { 'line-height': lineHeightPatterns },
      h5: { 'line-height': lineHeightPatterns },
      h6: { 'line-height': lineHeightPatterns },
      ol: { 'padding-left': [/^\d{1,3}px$/] },
      ul: { 'padding-left': [/^\d{1,3}px$/] },
      li: { 'padding-left': [/^\d{1,3}px$/] },
      blockquote: { 'padding-left': [/^\d{1,3}px$/], 'border-left': [/^[\d.]+px solid .+$/] },
      div: { 'text-align': [/^(left|center|right|justify)$/] },
      figure: { 'margin': [/^[\d.]+(?:px|em|rem)(?:\s+[\d.]+(?:px|em|rem))*$/] },
      figcaption: { 'text-align': [/^(left|center|right)$/] }
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
      pre: (_tag, attrs) => {
        const language = languageClassPattern.test(attrs.class ?? '') ? attrs.class : undefined
        return {
          tagName: 'pre',
          attribs: {
            ...blockColorAttributes(attrs),
            ...(language ? { class: language } : {}),
            ...(attrs['data-language'] ? { 'data-language': attrs['data-language'] } : {})
          }
        }
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
      // 块级段落/标题/引用：text-align 行内样式归一为 data-align，保留块级颜色属性。
      p: blockTransform,
      h1: blockTransform,
      h2: blockTransform,
      h3: blockTransform,
      h4: blockTransform,
      h5: blockTransform,
      h6: blockTransform,
      blockquote: blockTransform,
      ol: listTransform,
      ul: listTransform,
      li: listItemTransform,
      span: spanTransform,
      div: divTransform,
      figure: figureTransform,
      figcaption: figcaptionTransform,
      // 所有表格统一标记为增强表格（含 Markdown/粘贴来源），前台走一致的渲染与滚动包裹。
      table: (_tag, attrs) => ({
        tagName: 'table',
        attribs: {
          'data-blog-table': '1',
          ...(fitModes.has(attrs['data-fit']) ? { 'data-fit': attrs['data-fit'] } : {}),
          ...blockColorAttributes(attrs)
        }
      }),
      th: (_tag, attrs) => ({ tagName: 'th', attribs: articleCellAttributes(attrs) }),
      td: (_tag, attrs) => ({ tagName: 'td', attribs: articleCellAttributes(attrs) })
    }
  }).trim()
}

/** sanitize-html transformTags 用：保留块级语义属性（对齐 + 颜色），剥离其余（含 style）。 */
function blockTransform(tag: string, attrs: Record<string, string>) {
  return { tagName: tag, attribs: blockAttributes(attrs) }
}

/** 列表变换：保留缩进和颜色 */
function listTransform(tag: string, attrs: Record<string, string>) {
  const paddingLeft = /padding-left:\s*(\d{1,3}px)/i.exec(attrs.style ?? '')?.[1]
  return {
    tagName: tag,
    attribs: {
      ...blockColorAttributes(attrs),
      ...(attrs['data-type'] ? { 'data-type': attrs['data-type'] } : {}),
      ...(attrs['data-indent'] ? { 'data-indent': attrs['data-indent'] } : {}),
      ...(attrs.start ? { start: attrs.start } : {}),
      ...(paddingLeft ? { style: `padding-left: ${paddingLeft}` } : {})
    }
  }
}

/** 列表项变换：保留任务状态、缩进和颜色 */
function listItemTransform(_tag: string, attrs: Record<string, string>) {
  const paddingLeft = /padding-left:\s*(\d{1,3}px)/i.exec(attrs.style ?? '')?.[1]
  return {
    tagName: 'li',
    attribs: {
      ...blockColorAttributes(attrs),
      ...(attrs['data-checked'] !== undefined ? { 'data-checked': attrs['data-checked'] } : {}),
      ...(attrs['data-type'] ? { 'data-type': attrs['data-type'] } : {}),
      ...(paddingLeft ? { style: `padding-left: ${paddingLeft}` } : {})
    }
  }
}

/** span 变换：保留文本颜色和字体样式 */
function spanTransform(_tag: string, attrs: Record<string, string>) {
  const styleEntries: string[] = []
  const colorMatch = /color:\s*([^;]+)/i.exec(attrs.style ?? '')
  const fontSizeMatch = /font-size:\s*([^;]+)/i.exec(attrs.style ?? '')
  const fontFamilyMatch = /font-family:\s*([^;]+)/i.exec(attrs.style ?? '')
  const lineHeightMatch = /line-height:\s*([^;]+)/i.exec(attrs.style ?? '')

  if (colorMatch && colorTokenPatterns.some((p) => p.test(colorMatch[1].trim()))) {
    styleEntries.push(`color: ${colorMatch[1].trim()}`)
  }
  if (fontSizeMatch && fontSizePatterns.some((p) => p.test(fontSizeMatch[1].trim()))) {
    styleEntries.push(`font-size: ${fontSizeMatch[1].trim()}`)
  }
  if (fontFamilyMatch && fontFamilyPatterns.some((p) => p.test(fontFamilyMatch[1].trim()))) {
    styleEntries.push(`font-family: ${fontFamilyMatch[1].trim()}`)
  }
  if (lineHeightMatch && isValidLineHeight(lineHeightMatch[1].trim())) {
    styleEntries.push(`line-height: ${lineHeightMatch[1].trim()}`)
  }

  return {
    tagName: 'span',
    attribs: {
      ...(attrs['data-text-color'] ? { 'data-text-color': attrs['data-text-color'] } : {}),
      ...(attrs['data-font-size'] ? { 'data-font-size': attrs['data-font-size'] } : {}),
      ...(attrs['data-font-family'] ? { 'data-font-family': attrs['data-font-family'] } : {}),
      ...(attrs['data-line-height'] ? { 'data-line-height': attrs['data-line-height'] } : {}),
      ...(styleEntries.length > 0 ? { style: styleEntries.join('; ') } : {})
    }
  }
}

/** div 变换：保留 data-type 和基本样式 */
function divTransform(_tag: string, attrs: Record<string, string>) {
  const alignMatch = /text-align:\s*(left|center|right|justify)/i.exec(attrs.style ?? '')
  return {
    tagName: 'div',
    attribs: {
      ...blockColorAttributes(attrs),
      ...(attrs['data-type'] ? { 'data-type': attrs['data-type'] } : {}),
      ...(attrs.class ? { class: attrs.class } : {}),
      ...(alignMatch ? { style: `text-align: ${alignMatch[1]}` } : {})
    }
  }
}

/** figure 变换 */
function figureTransform(_tag: string, attrs: Record<string, string>) {
  const marginMatch = /margin:\s*([^;]+)/i.exec(attrs.style ?? '')
  return {
    tagName: 'figure',
    attribs: {
      ...(attrs.class ? { class: attrs.class } : {}),
      ...(marginMatch ? { style: `margin: ${marginMatch[1].trim()}` } : {})
    }
  }
}

/** figcaption 变换 */
function figcaptionTransform(_tag: string, attrs: Record<string, string>) {
  const alignMatch = /text-align:\s*(left|center|right)/i.exec(attrs.style ?? '')
  return {
    tagName: 'figcaption',
    attribs: {
      ...(attrs.class ? { class: attrs.class } : {}),
      ...(alignMatch ? { style: `text-align: ${alignMatch[1]}` } : {})
    }
  }
}


// 单元格属性：复用增强表格规范化，并额外把 Markdown 表格的 style text-align 映射为 data-align。
function articleCellAttributes(attrs: Record<string, string>) {
  const base = normalizeCellAttributes(attrs) as Record<string, string>
  if (!base['data-align']) {
    const match = /text-align:\s*(left|center|right)/i.exec(attrs.style ?? '')
    if (match) base['data-align'] = match[1].toLowerCase()
  }
  return { ...base, ...blockColorAttributes(attrs) }
}
