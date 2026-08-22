<script lang="ts" setup>
  import { Domternal, DomternalNotionColorPicker } from '@domternal/vue'
  import type { Editor, FloatingMenuItem, JSONContent, ToolbarLayoutEntry } from '@domternal/core'
  import {
    BlockColor,
    Blockquote,
    Bold,
    BulletList,
    CharacterCount,
    ClearFormatting,
    Code,
    Dropcursor,
    FontFamily,
    FontSize,
    HardBreak,
    Heading,
    Highlight,
    HorizontalRule,
    InvisibleChars,
    Italic,
    LineHeight,
    Link,
    LinkPopover,
    ListIndent,
    NotionColorPicker,
    OrderedList,
    Placeholder,
    Print,
    SelectionDecoration,
    Strike,
    Subscript,
    Superscript,
    TaskList,
    TextAlign,
    TextColor,
    TextStyle,
    Underline,
    UniqueID
  } from '@domternal/core'
  import type { TurnIntoTarget } from '@domternal/extension-block-controls'
  import {
    BlockContextMenu,
    BlockHandle,
    KeyboardReorder,
    SlashCommand,
    SmartPaste
  } from '@domternal/extension-block-controls'
  import { CodeBlockLowlight } from '@domternal/extension-code-block-lowlight'
  import { Image } from '@domternal/extension-image'
  import { Table } from '@domternal/extension-table'
  import { Details } from '@domternal/extension-details'
  import { common, createLowlight } from 'lowlight'
  import { blogApi } from '@/api/blog'
  import MediaLibraryPicker from './MediaLibraryPicker.vue'

  /** v-model：ProseMirror JSON 字符串（rawContent，原样入库，后端负责转 HTML） */
  const model = defineModel<string>({ default: '' })
  /** v-model:text：纯文本（供字数统计） */
  const text = defineModel<string>('text', { default: '' })
  const codeTheme = defineModel<Api.Blog.CodeTheme>('codeTheme', { default: 'github' })

  const lowlight = createLowlight(common)
  const editorInstance = shallowRef<Editor | null>(null)
  const mediaPickerVisible = ref(false)

  const toolbarLayout: ToolbarLayoutEntry[] = [
    'undo',
    'redo',
    '|',
    'heading',
    '|',
    'bold',
    'italic',
    'underline',
    'link',
    '|',
    'bulletList',
    'orderedList',
    'taskList',
    '|',
    'blockquote',
    'codeBlock',
    '|',
    'image',
    'table',
    '|',
    'clearFormatting'
  ]

  /** rawContent → 编辑器初始内容：JSON 字符串 parse 为对象；旧数据（HTML）原样透传 */
  function parseRawContent(value: string): JSONContent | string {
    if (!value) return ''
    try {
      return JSON.parse(value) as JSONContent
    } catch {
      return value
    }
  }

  /** 初始内容（Domternal 只在创建时消费，后续同步走下方 watch） */
  const initialContent = computed(() => parseRawContent(model.value))

  function handleCreate(editor: Editor) {
    editorInstance.value = editor
    text.value = editor.getText()
  }

  function handleUpdate({ editor }: { editor: Editor }) {
    model.value = JSON.stringify(editor.getJSON())
    text.value = editor.getText()
  }

  function insertMediaImage(url: string) {
    const editor = editorInstance.value
    if (!editor || editor.isDestroyed) return
    editor.view.focus()
    editor.commands.setImage({ src: url })
  }

  // 外部回填（异步加载文章等场景）：与编辑器当前文档比对，不同才 setContent，
  // 避免编辑过程中的自身更新把光标顶回开头。
  watch(model, (value) => {
    const editor = editorInstance.value
    if (!editor || editor.isDestroyed) return
    const next = parseRawContent(value)
    if (JSON.stringify(next) !== JSON.stringify(editor.getJSON())) {
      editor.setContent(next, false)
      text.value = editor.getText()
    }
  })

  const floatingLabels: Record<string, { label: string; description?: string }> = {
    'heading-1': { label: '一级标题', description: '大号章节标题' },
    'heading-2': { label: '二级标题', description: '中号章节标题' },
    'heading-3': { label: '三级标题', description: '小号章节标题' },
    paragraph: { label: '正文', description: '普通文本段落' },
    blockquote: { label: '引用', description: '插入引用内容' },
    'code-block': { label: '代码块', description: '插入代码片段' },
    'bullet-list': { label: '无序列表', description: '创建项目列表' },
    'ordered-list': { label: '有序列表', description: '创建编号列表' },
    'task-list': { label: '待办列表', description: '创建任务清单' },
    'horizontal-rule': { label: '分割线', description: '插入水平分割线' },
    image: { label: '图片', description: '插入图片' },
    table: { label: '表格', description: '插入三行三列表格' }
  }

  const groupLabels: Record<string, string> = {
    Basic: '基础块',
    Media: '媒体',
    Blocks: '块元素'
  }

  function translateFloatingItems(items: FloatingMenuItem[]) {
    return items.map((item) => {
      const translation = floatingLabels[item.name] ?? floatingLabels[item.label]
      return {
        ...item,
        ...(translation ? { label: translation.label, description: translation.description } : {}),
        ...(item.group && groupLabels[item.group] ? { group: groupLabels[item.group] } : {})
      }
    })
  }

  const turnIntoTargets: TurnIntoTarget[] = [
    { label: '正文', icon: 'textT', nodeType: 'paragraph' },
    { label: '一级标题', icon: 'textHOne', nodeType: 'heading', attrs: { level: 1 } },
    { label: '二级标题', icon: 'textHTwo', nodeType: 'heading', attrs: { level: 2 } },
    { label: '三级标题', icon: 'textHThree', nodeType: 'heading', attrs: { level: 3 } },
    {
      label: '无序列表',
      icon: 'listBullets',
      nodeType: 'bulletList',
      command: 'turnIntoBulletList'
    },
    {
      label: '有序列表',
      icon: 'listNumbers',
      nodeType: 'orderedList',
      command: 'turnIntoOrderedList'
    },
    { label: '待办列表', icon: 'listChecks', nodeType: 'taskList', command: 'turnIntoTaskList' },
    { label: '引用', icon: 'quotes', nodeType: 'blockquote', command: 'toggleBlockquote' },
    { label: '代码块', icon: 'codeBlock', nodeType: 'codeBlock' }
  ]

  const extensions = [
    // —— 官方 full toolbar 的格式化扩展（逐个引入，不用 StarterKit 避免与下方扩展重名冲突） ——
    Bold,
    Italic,
    Underline,
    Strike,
    Code,
    Highlight,
    Subscript,
    Superscript,
    Link,
    LinkPopover,
    Heading,
    Blockquote,
    HardBreak,
    HorizontalRule,
    BulletList,
    OrderedList,
    TaskList,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    TextColor,
    FontSize,
    FontFamily,
    LineHeight,
    InvisibleChars,
    SelectionDecoration,
    ClearFormatting,
    Dropcursor,
    Print,
    CodeBlockLowlight.configure({ lowlight }),
    Table,
    Details,
    Image.configure({
      placement: 'float',
      uploadHandler: async (file: File) => (await blogApi.upload(file)).url,
      onUploadError: () => ElMessage.error('图片上传失败，请检查文件格式和大小')
    }),

    // —— 博客业务扩展：字数统计、Notion 风格块控件 ——
    CharacterCount,
    UniqueID,
    Placeholder.configure({ placeholder: '开始写作，工具栏组织内容…' }),
    BlockColor,
    NotionColorPicker,
    ListIndent,
    BlockHandle.configure({ nested: true }),
    BlockContextMenu.configure({ turnIntoTargets }),
    SlashCommand.configure({ items: (items) => translateFloatingItems(items) }),
    SmartPaste,
    KeyboardReorder
  ]

</script>

<template>
  <!-- classic preset + 精简官方工具栏；图片按钮仍保留 Domternal 原生 URL / 本地上传弹层。 -->
  <div :class="`code-theme-${codeTheme}`" class="domternal-editor-wrapper">
    <Domternal
      :content="initialContent"
      :extensions="extensions"
      :on-create="handleCreate"
      :on-update="handleUpdate"
      preset="classic"
    >
      <div class="domternal-toolbar-row">
        <Domternal.Toolbar :layout="toolbarLayout" class="domternal-full-toolbar" />
        <ElTooltip content="从媒体库选择">
          <button
            type="button"
            class="dm-toolbar-button domternal-media-library-button"
            aria-label="从媒体库选择"
            @mousedown.prevent
            @click="mediaPickerVisible = true"
          >
            <ArtSvgIcon icon="ri:gallery-line" />
          </button>
        </ElTooltip>
      </div>
      <div class="domternal-scroll">
        <Domternal.Content />
        <DomternalNotionColorPicker />
      </div>

      <Domternal.BubbleMenu :contexts="{ image: true }" />
      <Domternal.FloatingMenu require-explicit-trigger />
    </Domternal>
    <MediaLibraryPicker v-model:visible="mediaPickerVisible" @select="insertMediaImage" />
  </div>
</template>

<style scoped>
  .domternal-editor-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: var(--default-box-color);
  }

  .domternal-toolbar-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    overflow-x: auto;
    border-bottom: 1px solid var(--default-border);
  }

  .dm-toolbar {
    border-radius: 0px;
    border: none;
  }

  .domternal-full-toolbar {
    flex: 0 0 auto;
    min-width: max-content;
    flex-wrap: nowrap;
  }

  .domternal-media-library-button {
    flex: 0 0 auto;
  }

  /* Image's native URL/file popover is appended to document.body. The article
   * editor itself is rendered in an Element Plus drawer (base z-index: 3000),
   * so Domternal's default z-index (60) places an open popover behind it. */
  :global(.dm-image-popover) {
    z-index: 3100;
  }

  .domternal-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .domternal-scroll :deep(.dm-editor) {
    max-width: 860px;
    min-height: 100%;
    margin: 0 auto;
    font-size: 15px;
    line-height: 1.8;
    border: none;
    box-shadow: none;
  }

  @media (width <= 640px) {
    .domternal-editor-wrapper {
      min-height: 500px;
    }

    .domternal-scroll :deep(.dm-editor) {
      padding: 18px 16px 96px;
    }
  }
</style>
