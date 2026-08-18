<script setup lang="ts">
  import { MdEditor } from 'md-editor-v3'
  import type { ExposeParam } from 'md-editor-v3'
  import 'md-editor-v3/lib/style.css'
  import { blogApi } from '@/api/blog'
  import { useSettingStore } from '@/store/modules/setting'
  import MediaLibraryPicker from './MediaLibraryPicker.vue'

  const model = defineModel<string>({ default: '' })
  const codeTheme = defineModel<Api.Blog.CodeTheme>('codeTheme', { default: 'github' })
  const settingStore = useSettingStore()
  const editorTheme = computed(() => (settingStore.isDark ? 'dark' : 'light'))
  const mdEditorRef = useTemplateRef<ExposeParam>('mdEditor')
  const mediaPickerVisible = ref(false)

  async function uploadImages(files: File[], callback: (urls: string[]) => void) {
    const uploads = await Promise.all(files.map((file) => blogApi.upload(file)))
    callback(uploads.map(({ url }) => url))
  }

  function insertImage(url: string) {
    const view = mdEditorRef.value?.getEditorView()
    if (!view) return
    const { from, to } = view.state.selection.main
    const selectedText = view.state.sliceDoc(from, to).trim()
    const text = `![${selectedText || '图片'}](${url})`
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length }
    })
  }
</script>

<template>
  <div class="markdown-editor" :class="`code-theme-${codeTheme}`">
    <button
      type="button"
      class="media-btn"
      title="从媒体库选择图片"
      @click="mediaPickerVisible = true"
    >
      <ArtSvgIcon icon="ri:image-line" />媒体库
    </button>
    <MdEditor
      ref="mdEditor"
      class="markdown-body"
      v-model="model"
      language="zh-CN"
      :theme="editorTheme"
      :code-theme="codeTheme"
      :preview="true"
      :html-preview="false"
      :no-prettier="true"
      :on-upload-img="uploadImages"
      :toolbars-exclude="['github', 'htmlPreview', 'pageFullscreen', 'catalog']"
    />
    <MediaLibraryPicker v-model:visible="mediaPickerVisible" @select="insertImage" />
  </div>
</template>

<style scoped>
  .markdown-editor {
    position: relative;
    min-height: 0;
    height: 100%;
    flex: 1;
    overflow: hidden;
  }

  .markdown-editor :deep(.md-editor) {
    --md-bk-color: var(--default-box-color);
    --md-bk-color-outstand: var(--default-bg-color);
    --md-bk-color-hover: var(--art-hover-color);
    --md-border-color: var(--default-border);
    --md-color: var(--art-gray-900);
    --md-color-hover: var(--theme-color);
    --md-color-modal: var(--art-gray-900);
    --md-scrollbar-bg-color: var(--default-bg-color);

    height: 100%;
    border: 0;
    border-radius: 0;
  }

  .markdown-editor :deep(.md-editor-toolbar-wrapper) {
    padding: 0;
    padding-right: 96px;
  }

  .markdown-editor :deep(.md-editor-toolbar) {
    min-height: 40px;
    padding: 4px 10px;
  }

  .media-btn {
    position: absolute;
    top: 5px;
    right: 10px;
    z-index: 10;
    display: inline-flex;
    gap: 5px;
    align-items: center;
    height: 30px;
    padding: 0 10px;
    font-size: 13px;
    font-weight: 500;
    color: var(--art-gray-600);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-left: 1px solid var(--default-border);
    border-radius: 0;
  }

  .media-btn:hover {
    color: var(--theme-color);
  }

  .media-btn :deep(.art-svg-icon) {
    font-size: 16px;
  }
</style>
