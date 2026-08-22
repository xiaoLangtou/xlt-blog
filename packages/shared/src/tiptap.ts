/**
 * TipTap 前后端共享的 schema 级扩展定义。
 *
 * 前端编辑器（BlogTipTapEditor）与后端转换器（generateHTML）必须使用
 * 完全一致的 schema 扩展集合，否则同一份 ProseMirror JSON 序列化出的
 * HTML 标签 / 属性会不一致。本模块即该唯一事实源：
 * - 前端：createTiptapSchemaExtensions({ codeBlock: 带 NodeView 的代码块 }) + 行为类扩展
 * - 后端：createTiptapSchemaExtensions()（默认 CodeBlockLowlight，纯 schema）
 */
import type { AnyExtension, Extensions } from '@tiptap/core'
// 注意：全部使用命名导入。
// CJS 产物中 rolldown 的 __toESM(mod, isNodeMode) 在 isNodeMode 下会把 default
// 指向整个模块对象，导致默认导入拿到错误形状（server 运行时报
// "StarterKit.configure is not a function"）；命名导入不受该互操作影响。
import { Table, TableCell, TableHeader, TableKit } from '@tiptap/extension-table'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Highlight } from '@tiptap/extension-highlight'
import { Image } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { StarterKit } from '@tiptap/starter-kit'
import { TaskItem } from '@tiptap/extension-task-item'
import { TaskList } from '@tiptap/extension-task-list'
import { TextAlign } from '@tiptap/extension-text-align'
import { Underline } from '@tiptap/extension-underline'
import { common, createLowlight, type Lowlight } from 'lowlight'

export function createSharedLowlight(): Lowlight {
  return createLowlight(common)
}

// ---------- 增强表格（BlogTable 系列：data-blog-table / data-fit / data-align / data-background） ----------

const tableBackgrounds = new Set(['neutral', 'red', 'amber', 'green', 'blue', 'purple'])
const tableAlignments = new Set(['left', 'center', 'right'])

function cellAttributes() {
  return {
    background: {
      default: null,
      parseHTML: (element: HTMLElement) => {
        const value = element.getAttribute('data-background')
        return value && tableBackgrounds.has(value) ? value : null
      },
      renderHTML: (attributes: Record<string, unknown>) =>
        attributes.background ? { 'data-background': attributes.background } : {}
    },
    align: {
      default: null,
      parseHTML: (element: HTMLElement) => {
        const value = element.getAttribute('data-align')
        return value && tableAlignments.has(value) ? value : null
      },
      renderHTML: (attributes: Record<string, unknown>) =>
        attributes.align ? { 'data-align': attributes.align } : {}
    }
  }
}

export const BlogTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fit: {
        default: 'container',
        parseHTML: (element) => element.getAttribute('data-fit') || 'container',
        renderHTML: (attributes) => ({
          'data-blog-table': '1',
          'data-fit': attributes.fit === 'content' ? 'content' : 'container'
        })
      }
    }
  }
}).configure({
  resizable: true,
  renderWrapper: false,
  handleWidth: 5,
  cellMinWidth: 90,
  lastColumnResizable: true,
  allowTableNodeSelection: true
})

export const BlogTableCell = TableCell.extend({
  addAttributes() {
    return { ...this.parent?.(), ...cellAttributes() }
  }
})

export const BlogTableHeader = TableHeader.extend({
  addAttributes() {
    return { ...this.parent?.(), ...cellAttributes() }
  }
})

// ---------- 可调宽度图片（width 属性 + Markdown title="width=N" 约定） ----------

const minImageWidth = 120
const maxImageWidth = 1600

function normalizeImageWidth(value: unknown) {
  const width = Number(value)
  return Number.isInteger(width) && width >= minImageWidth && width <= maxImageWidth
    ? width
    : null
}

function getWidthFromTitle(title: unknown) {
  const match = typeof title === 'string' ? /^width=(\d+)$/.exec(title.trim()) : null
  return normalizeImageWidth(match?.[1])
}

/**
 * 带 width 属性的 Image 扩展（未 configure）。
 * 前端额外传 resize 配置，后端只传 inline: false。
 */
export function createBlogResizableImage() {
  return Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: null,
          parseHTML: (element) =>
            normalizeImageWidth(element.getAttribute('width')) ??
            getWidthFromTitle(element.getAttribute('title')),
          renderHTML: (attributes) => {
            const width = normalizeImageWidth(attributes.width)
            return width ? { width } : {}
          }
        },
        height: {
          default: null,
          renderHTML: () => ({})
        }
      }
    }
  })
}

// ---------- 统一 schema 扩展集合 ----------

export interface TiptapSchemaExtensionsOptions {
  /**
   * 代码块扩展。前端传入带 Vue NodeView（语言选择 / 格式化 / 复制）的版本，
   * 后端省略以使用默认 CodeBlockLowlight（纯 schema，无 UI）。
   */
  codeBlock?: AnyExtension
  /**
   * 图片扩展。前端传入带 resize（拖拽调宽）配置的版本，
   * 后端省略以使用纯 schema 版本（inline: false，无 UI）。
   */
  image?: AnyExtension
}

/**
 * 类型锚点（勿删）：强制声明文件引用各扩展包的类型，
 * 使其 `declare module '@tiptap/core'` 的 Commands 增强
 * （toggleBold / setTextAlign / setLink 等链式命令）对引入方生效。
 * 仅类型层面存在，运行时无任何开销。
 */
export type TiptapSchemaExtensionModules = [
  typeof import('@tiptap/starter-kit'),
  typeof import('@tiptap/extension-code-block-lowlight'),
  typeof import('@tiptap/extension-highlight'),
  typeof import('@tiptap/extension-image'),
  typeof import('@tiptap/extension-link'),
  typeof import('@tiptap/extension-table'),
  typeof import('@tiptap/extension-task-item'),
  typeof import('@tiptap/extension-task-list'),
  typeof import('@tiptap/extension-text-align'),
  typeof import('@tiptap/extension-underline')
]

/** schema 级扩展全集：决定 ProseMirror JSON → HTML 的序列化结果，前后端共用。 */
export function createTiptapSchemaExtensions(
  options: TiptapSchemaExtensionsOptions = {}
): Extensions {
  return [
    // v3 StarterKit 已内置 link/underline，这里关闭以使用下方显式配置的版本
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      codeBlock: false,
      link: false,
      underline: false
    }),
    options.codeBlock ?? CodeBlockLowlight.configure({ lowlight: createSharedLowlight() }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TableKit.configure({ table: false, tableCell: false, tableHeader: false }),
    BlogTable,
    BlogTableCell,
    BlogTableHeader,
    Underline,
    Highlight.configure({ multicolor: true }),
    options.image ?? createBlogResizableImage().configure({ inline: false }),
    Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
    TextAlign.configure({ types: ['heading', 'paragraph'] })
  ]
}
