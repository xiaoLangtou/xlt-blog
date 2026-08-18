<script setup lang="ts">
  import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
  import { Editor, EditorContent, VueNodeViewRenderer } from '@tiptap/vue-3'
  import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
  import { FindAndReplace } from '@tiptap/extension-find-and-replace'
  import Highlight from '@tiptap/extension-highlight'
  import Image from '@tiptap/extension-image'
  import Link from '@tiptap/extension-link'
  import Placeholder from '@tiptap/extension-placeholder'
  import StarterKit from '@tiptap/starter-kit'
  import TaskItem from '@tiptap/extension-task-item'
  import TaskList from '@tiptap/extension-task-list'
  import TextAlign from '@tiptap/extension-text-align'
  import { TableKit } from '@tiptap/extension-table'
  import Underline from '@tiptap/extension-underline'
  import { common, createLowlight } from 'lowlight'
  import { blogApi } from '@/api/blog'
  import './tiptap/blog-tiptap-editor.scss'
  import CodeBlockNodeView from './CodeBlockNodeView.vue'
  import BlogEditorSearchReplace from './tiptap/BlogEditorSearchReplace.vue'
  import BlogEditorToolbar from './tiptap/BlogEditorToolbar.vue'
  import MediaLibraryPicker from './MediaLibraryPicker.vue'
  import { BlogTable, BlogTableCell, BlogTableHeader } from './tiptap/table/table-extensions'

  const model = defineModel<string>({ default: '' })
  const codeTheme = defineModel<Api.Blog.CodeTheme>('codeTheme', { default: 'github' })
  const imageInput = useTemplateRef<HTMLInputElement>('imageInput')
  const searchOpen = ref(false)
  const mediaPickerVisible = ref(false)
  const lowlight = createLowlight(common)
  const supportedImageTypes = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ])
  const minImageWidth = 120
  const maxImageWidth = 1600

  const CodeBlockWithLanguageSelector = CodeBlockLowlight.extend({
    addNodeView() {
      return VueNodeViewRenderer(CodeBlockNodeView)
    }
  })

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

  const ResizableImage = Image.extend({
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
    },
    addStorage() {
      return {
        markdown: {
          serialize(state: { write: (content: string) => void }, node: ProseMirrorNode) {
            const { src = '', alt = '', title } = node.attrs
            const width = normalizeImageWidth(node.attrs.width)
            const imageTitle = width ? `width=${width}` : title
            state.write(imageTitle ? `![${alt}](${src} "${imageTitle}")` : `![${alt}](${src})`)
          }
        }
      }
    }
  }).configure({
    inline: false,
    resize: {
      enabled: true,
      directions: ['bottom-right'],
      minWidth: minImageWidth,
      minHeight: 1,
      alwaysPreserveAspectRatio: true
    }
  })

  function getHtml() {
    return editor.getHTML()
  }

  const editor = new Editor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] }, codeBlock: false }),
      CodeBlockWithLanguageSelector.configure({ lowlight }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({ table: false, tableCell: false, tableHeader: false }),
      BlogTable,
      BlogTableCell,
      BlogTableHeader,
      FindAndReplace.configure({ searchDebounceMs: 100, injectCSS: false }),
      Underline,
      Highlight.configure({ multicolor: true }),
      ResizableImage,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Placeholder.configure({ placeholder: '开始写作，使用工具栏组织内容。' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: model.value,
    editorProps: {
      handlePaste: (_view, event) => {
        const files = imageFiles(event.clipboardData?.files)
        if (!files.length) return false
        void insertUploadedImages(files)
        return true
      },
      handleDrop: (view, event) => {
        const files = imageFiles(event.dataTransfer?.files)
        if (!files.length) return false
        const position = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        void insertUploadedImages(files, position)
        return true
      }
    },
    onUpdate: () => {
      model.value = getHtml()
    }
  })

  watch(model, (value) => {
    if (value !== getHtml()) editor.commands.setContent(value || '', { emitUpdate: false })
  })

  function imageFiles(files: FileList | null | undefined) {
    return Array.from(files ?? []).filter((file) => supportedImageTypes.has(file.type))
  }

  async function insertUploadedImages(files: File[], position?: number) {
    if (!files.length) return
    try {
      const uploads = await Promise.all(files.map((file) => blogApi.upload(file)))
      const images = uploads.map(({ url }) => ({ type: 'image', attrs: { src: url } }))
      if (position === undefined) editor.chain().focus().insertContent(images).run()
      else editor.chain().focus().insertContentAt(position, images).run()
    } catch {
      ElMessage.error('图片上传失败，请检查文件格式和大小')
    }
  }

  function insertImage(url: string) {
    editor
      .chain()
      .focus()
      .insertContent({ type: 'image', attrs: { src: url } })
      .run()
  }

  async function uploadImage(event: Event) {
    const input = event.target as HTMLInputElement
    const files = imageFiles(input.files)
    try {
      if (!files.length && input.files?.length)
        ElMessage.error('请选择 PNG、JPG、GIF、WebP 或 SVG 图片')
      await insertUploadedImages(files)
    } finally {
      input.value = ''
    }
  }

  onBeforeUnmount(() => editor.destroy())
</script>

<template>
  <div class="rich-editor" :class="`code-theme-${codeTheme}`">
    <BlogEditorToolbar
      :editor="editor"
      @image="imageInput?.click()"
      @media="mediaPickerVisible = true"
      @search="searchOpen = !searchOpen"
    />
    <BlogEditorSearchReplace v-model:open="searchOpen" :editor="editor" />
    <EditorContent :editor="editor" class="content" />
    <input
      ref="imageInput"
      class="hidden"
      type="file"
      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
      @change="uploadImage"
    />
    <MediaLibraryPicker v-model:visible="mediaPickerVisible" @select="insertImage" />
  </div>
</template>

<style scoped>
  .rich-editor {
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    color: var(--art-gray-900);
    background: var(--default-box-color);
  }

  .toolbar {
    display: flex;
    flex-wrap: nowrap;
    gap: 2px;
    align-items: center;
    min-height: 40px;
    padding: 4px 12px;
    overflow-x: auto;
    background: var(--default-bg-color);
    border-bottom: 1px solid var(--default-border);
  }

  .toolbar :deep(.el-button) {
    width: 30px;
    height: 30px;
    padding: 0;
    color: var(--art-gray-700);
    border-radius: 5px;
  }

  .toolbar :deep(.el-button .art-svg-icon) {
    color: inherit;
  }

  .toolbar :deep(.el-button:hover) {
    color: var(--art-gray-900);
    background: var(--art-hover-color);
  }

  .toolbar :deep(.el-button--primary) {
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 10%, transparent);
  }

  .toolbar :deep(.el-button.is-disabled),
  .toolbar :deep(.el-button:disabled) {
    color: var(--art-gray-500);
  }

  .divider {
    width: 1px;
    height: 18px;
    margin: 0 5px;
    background: var(--default-border);
  }

  .content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .content :deep(.tiptap) {
    max-width: 780px;
    min-height: 100%;
    padding: 34px 32px 96px;
    margin: 0 auto;
    font-size: 15px;
    line-height: 1.85;
    outline: none;
  }

  .content :deep(.tiptap p) {
    margin: 0 0 1.1em;
  }

  .content :deep(.tiptap h1),
  .content :deep(.tiptap h2),
  .content :deep(.tiptap h3),
  .content :deep(.tiptap h4) {
    margin: 1.45em 0 0.55em;
    line-height: 1.35;
    color: var(--art-gray-900);
  }

  .content :deep(.tiptap h1) {
    font-size: 1.9em;
  }

  .content :deep(.tiptap h2) {
    font-size: 1.55em;
  }

  .content :deep(.tiptap h3) {
    font-size: 1.25em;
  }

  .content :deep(.tiptap ul),
  .content :deep(.tiptap ol) {
    padding-left: 1.45em;
    margin: 0 0 1.1em;
  }

  .content :deep(.tiptap blockquote) {
    padding-left: 1em;
    margin: 1.35em 0;
    color: var(--art-gray-700);
    border-left: 3px solid var(--theme-color);
  }

  .content :deep(.tiptap a) {
    color: var(--theme-color);
    text-decoration: underline;
  }

  .content :deep(.tiptap p.is-editor-empty:first-child::before) {
    float: left;
    height: 0;
    color: var(--art-gray-500);
    pointer-events: none;
    content: attr(data-placeholder);
  }

  .content :deep(.tiptap img) {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 1.5em auto;
    border-radius: 6px;
  }

  .content :deep(.tiptap .ProseMirror-selectednode) {
    outline: 2px solid var(--theme-color);
    outline-offset: 3px;
  }

  .content :deep(.tiptap [data-resize-wrapper]) {
    max-width: 100%;
  }

  .content :deep(.tiptap [data-resize-handle='bottom-right']) {
    right: -7px;
    bottom: -7px;
    width: 12px;
    height: 12px;
    cursor: nwse-resize;
    background: var(--theme-color);
    border: 2px solid var(--default-box-color);
    border-radius: 2px;
  }

  .content :deep(.tiptap pre) {
    padding: 16px;
    overflow: auto;
    color: var(--code-fg);
    background: var(--code-bg);
    border: 1px solid var(--code-toolbar-border);
    border-radius: 6px;
  }

  .content :deep(.tiptap pre.code-block) {
    position: relative;
    box-sizing: border-box;
    min-height: 0;
    padding: 0;
    overflow: visible;
  }

  .content :deep(.tiptap pre.code-block .code-block__language-label),
  .content :deep(.tiptap pre.code-block .code-block__actions) {
    position: absolute;
    top: 9px;
    right: 10px;
    z-index: 2;
  }

  .content :deep(.tiptap pre.code-block .code-block__language-label) {
    padding: 3px 7px;
    font-size: 11px;
    line-height: 18px;
    color: var(--code-muted);
    pointer-events: none;
    background: var(--code-toolbar-hover);
    border-radius: 5px;
    transition:
      opacity 0.14s ease,
      visibility 0.14s ease;
  }

  .content :deep(.tiptap pre.code-block .code-block__actions) {
    display: flex;
    gap: 2px;
    padding: 3px;
    color: var(--code-fg);
    pointer-events: none;
    visibility: hidden;
    background: var(--code-toolbar-bg);
    border: 1px solid var(--code-toolbar-border);
    border-radius: 8px;
    box-shadow: 0 6px 18px rgb(0 0 0 / 22%);
    opacity: 0;
    transition:
      opacity 0.14s ease,
      visibility 0.14s ease,
      transform 0.14s ease;
    transform: translateY(-2px);
  }

  .content :deep(.tiptap pre.code-block:hover .code-block__language-label),
  .content :deep(.tiptap pre.code-block:focus-within .code-block__language-label),
  .content :deep(.tiptap pre.code-block.code-block--menu-open .code-block__language-label) {
    visibility: hidden;
    opacity: 0;
  }

  .content :deep(.tiptap pre.code-block:hover .code-block__actions),
  .content :deep(.tiptap pre.code-block:focus-within .code-block__actions),
  .content :deep(.tiptap pre.code-block.code-block--menu-open .code-block__actions) {
    pointer-events: auto;
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
  }

  .content :deep(.tiptap pre.code-block .code-block__action) {
    display: inline-flex;
    gap: 5px;
    align-items: center;
    justify-content: center;
    height: 27px;
    padding: 0 7px;
    font: inherit;
    font-size: 12px;
    color: inherit;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 5px;
    transition:
      color 0.12s ease,
      background-color 0.12s ease;
  }

  .content :deep(.tiptap pre.code-block .code-block__action:hover),
  .content :deep(.tiptap pre.code-block .code-block__action:focus-visible) {
    color: var(--code-fg);
    background: var(--code-toolbar-hover);
    outline: none;
  }

  .content :deep(.tiptap pre.code-block .code-block__action:focus-visible) {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--theme-color) 70%, white);
  }

  .content :deep(.tiptap pre.code-block .code-block__action:disabled) {
    color: color-mix(in srgb, var(--code-muted) 52%, transparent);
    cursor: not-allowed;
    background: transparent;
  }

  .content :deep(.tiptap pre.code-block .code-block__language) {
    justify-content: space-between;
    min-width: 86px;
    max-width: 126px;
    padding-left: 9px;
  }

  .content :deep(.tiptap pre.code-block .code-block__language > span) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .content :deep(.tiptap pre.code-block .code-block__icon-action) {
    width: 27px;
    padding: 0;
  }

  .content :deep(.tiptap pre.code-block .code-block__action .art-svg-icon) {
    width: 15px;
    height: 15px;
    color: inherit;
  }

  .content :deep(.tiptap pre.code-block > code) {
    display: block;
    min-height: 1.85em;
    max-height: 440px;
    padding: 20px 16px 16px;
    overflow: auto;
  }

  .content :deep(.tiptap code) {
    padding: 2px 4px;
    background: var(--art-gray-200);
    border-radius: 3px;
  }

  .content :deep(.tiptap pre code) {
    padding: 0;
    color: inherit;
    background: transparent;
  }

  .content :deep(.tiptap ul[data-type='taskList']) {
    padding-left: 0;
    list-style: none;
  }

  .content :deep(.tiptap .tableWrapper) {
    margin: 1.35em 0;
    overflow-x: auto;
  }

  .content :deep(.tiptap table) {
    width: 100%;
    min-width: 520px;
    table-layout: fixed;
    border-collapse: collapse;
  }

  .content :deep(.tiptap th),
  .content :deep(.tiptap td) {
    position: relative;
    min-width: 100px;
    padding: 9px 11px;
    vertical-align: top;
    border: 1px solid var(--default-border);
  }

  .content :deep(.tiptap th) {
    font-weight: 600;
    text-align: left;
    background: var(--default-bg-color);
  }

  .content :deep(.tiptap td > p),
  .content :deep(.tiptap th > p) {
    margin: 0;
  }

  .content :deep(.tiptap table[data-fit='content']) {
    width: max-content;
  }

  .content :deep(.tiptap th[data-align='center']),
  .content :deep(.tiptap td[data-align='center']) {
    text-align: center;
  }

  .content :deep(.tiptap th[data-align='right']),
  .content :deep(.tiptap td[data-align='right']) {
    text-align: right;
  }

  .content :deep(.tiptap th[data-background='neutral']),
  .content :deep(.tiptap td[data-background='neutral']) {
    background: color-mix(in srgb, var(--art-gray-500) 15%, var(--default-box-color));
  }

  .content :deep(.tiptap th[data-background='amber']),
  .content :deep(.tiptap td[data-background='amber']) {
    background: color-mix(in srgb, #f59e0b 18%, var(--default-box-color));
  }

  .content :deep(.tiptap th[data-background='blue']),
  .content :deep(.tiptap td[data-background='blue']) {
    background: color-mix(in srgb, #3b82f6 16%, var(--default-box-color));
  }

  .content :deep(.tiptap .column-resize-handle) {
    position: absolute;
    top: 0;
    right: -2px;
    bottom: 0;
    z-index: 3;
    width: 4px;
    pointer-events: none;
    background: var(--theme-color);
  }

  .content :deep(.tiptap.resize-cursor) {
    cursor: col-resize;
  }

  .content :deep(.tiptap .selectedCell::after) {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    content: '';
    background: color-mix(in srgb, var(--theme-color) 14%, transparent);
  }

  @media (hover: none) {
    .content :deep(.tiptap pre.code-block .code-block__language-label) {
      visibility: hidden;
      opacity: 0;
    }

    .content :deep(.tiptap pre.code-block .code-block__actions) {
      pointer-events: auto;
      visibility: visible;
      opacity: 1;
      transform: none;
    }
  }

  @media (width <= 640px) {
    .rich-editor {
      min-height: 500px;
    }

    .content :deep(.tiptap pre.code-block .code-block__language) {
      min-width: 82px;
    }

    .content :deep(.tiptap pre.code-block .code-block__actions) {
      top: 8px;
      right: 8px;
    }

    .content :deep(.tiptap pre.code-block > code) {
      padding: 43px 14px 14px;
    }

    .content :deep(.tiptap) {
      padding: 26px 20px 72px;
    }
  }
</style>
