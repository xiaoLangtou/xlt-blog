<script setup lang="ts">
  import type { JSONContent } from '@tiptap/core'
  import { Editor, EditorContent, VueNodeViewRenderer } from '@tiptap/vue-3'
  import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
  import { FindAndReplace } from '@tiptap/extension-find-and-replace'
  import Placeholder from '@tiptap/extension-placeholder'
  import { blogApi } from '@/api/blog'
  import {
    createBlogResizableImage,
    createSharedLowlight,
    createTiptapSchemaExtensions
  } from '@xlt-blog/shared/tiptap'
  import './tiptap/blog-tiptap-editor.scss'
  import CodeBlockNodeView from './CodeBlockNodeView.vue'
  import BlogEditorSearchReplace from './tiptap/BlogEditorSearchReplace.vue'
  import BlogEditorToolbar from './tiptap/BlogEditorToolbar.vue'
  import MediaLibraryPicker from './MediaLibraryPicker.vue'

  /** v-model：ProseMirror JSON 字符串（rawContent，原样入库，后端负责转 HTML） */
  const model = defineModel<string>({ default: '' })
  /** v-model:text：纯文本（供字数统计） */
  const text = defineModel<string>('text', { default: '' })
  const codeTheme = defineModel<Api.Blog.CodeTheme>('codeTheme', { default: 'github' })
  const imageInput = useTemplateRef<HTMLInputElement>('imageInput')
  const searchOpen = ref(false)
  const mediaPickerVisible = ref(false)
  const supportedImageTypes = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ])

  const CodeBlockWithLanguageSelector = CodeBlockLowlight.extend({
    addNodeView() {
      return VueNodeViewRenderer(CodeBlockNodeView)
    }
  }).configure({ lowlight: createSharedLowlight() })

  // 编辑器端图片：在共享 schema（width 属性）基础上开启拖拽调宽
  const ResizableImage = createBlogResizableImage().configure({
    inline: false,
    resize: {
      enabled: true,
      directions: ['bottom-right'],
      minWidth: 120,
      minHeight: 1,
      alwaysPreserveAspectRatio: true
    }
  })

  /** rawContent 回填：JSON 字符串 → ProseMirror JSON；旧数据（HTML）直接作为 HTML 解析 */
  function parseRawContent(value: string): JSONContent | string {
    if (!value) return ''
    try {
      return JSON.parse(value) as JSONContent
    } catch {
      return value
    }
  }

  function getJson() {
    return JSON.stringify(editor.getJSON())
  }

  const editor = new Editor({
    // schema 级扩展统一来自 @xlt-blog/shared/tiptap，与服务端转换器严格一致；
    // 这里仅叠加编辑器专属的行为类扩展（查找替换 / 占位符）
    extensions: [
      ...createTiptapSchemaExtensions({
        codeBlock: CodeBlockWithLanguageSelector,
        image: ResizableImage
      }),
      FindAndReplace.configure({ searchDebounceMs: 100, injectCSS: false }),
      Placeholder.configure({ placeholder: '开始写作，使用工具栏组织内容。' })
    ],
    content: parseRawContent(model.value),
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
      model.value = getJson()
      text.value = editor.getText()
    }
  })

  watch(model, (value) => {
    if (value !== getJson()) {
      editor.commands.setContent(parseRawContent(value) || '', { emitUpdate: false })
      text.value = editor.getText()
    }
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
    outline: none;
  }

  .hidden {
    display: none;
  }

  @media (width <= 640px) {
    .content :deep(.tiptap) {
      padding: 24px 16px 96px;
    }
  }
</style>
