<script setup lang="ts">
  import { Domternal, DomternalNotionColorPicker } from '@domternal/vue'
  import {
    StarterKit,
    BubbleMenu,
    NotionColorPicker,
    BlockColor,
    UniqueID,
    ListIndent,
    Placeholder,
    Underline,
    Link,
    TextAlign,
    TextStyle,
    TextColor,
    Highlight
  } from '@domternal/core'
  import {
    BlockHandle,
    BlockContextMenu,
    SlashCommand,
    SmartPaste,
    KeyboardReorder,
    FloatingMenu
  } from '@domternal/extension-block-controls'
  import { CodeBlockLowlight } from '@domternal/extension-code-block-lowlight'
  import { Image } from '@domternal/extension-image'
  import { common, createLowlight } from 'lowlight'

  const model = defineModel<string>({ default: '' })
  const codeTheme = defineModel<Api.Blog.CodeTheme>('codeTheme', { default: 'github' })

  const lowlight = createLowlight(common)

  const extensions = [
    StarterKit.configure({ codeBlock: false }),
    CodeBlockLowlight.configure({ lowlight }),
    Underline,
    Link.configure({ openOnClick: false }),
    Image,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    TextColor,
    Highlight,
    UniqueID,
    Placeholder.configure({ placeholder: "输入 '/' 唤起命令…" }),
    BlockColor,
    NotionColorPicker,
    ListIndent,
    BlockHandle.configure({ nested: true }),
    BlockContextMenu,
    SlashCommand,
    SmartPaste,
    KeyboardReorder,
    FloatingMenu.configure({ requireExplicitTrigger: true }),
    BubbleMenu
  ]

  function onUpdate({ editor }: { editor: any }) {
    model.value = editor.getHTML()
  }
</script>

<template>
  <div class="domternal-editor-wrapper">
    <Domternal
      :extensions="extensions"
      :content="model"
      preset="notion"
      :on-update="onUpdate"
    >
      <Domternal.Content />
      <Domternal.BubbleMenu />
      <Domternal.FloatingMenu />
      <DomternalNotionColorPicker />
    </Domternal>
  </div>
</template>

<style scoped>
  .domternal-editor-wrapper {
    height: 100%;
    min-height: 0;
    overflow-y: auto;
  }

  .domternal-editor-wrapper :deep(.dm-editor) {
    min-height: 100%;
    padding: 48px 24px 120px;
  }

  .domternal-editor-wrapper :deep(.dm-editor.dm-notion-mode) {
    --dm-notion-column-width: 46rem;
    --dm-editor-line-height: 1.75;
  }
</style>
