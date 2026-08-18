<script setup lang="ts">
  import type { BuiltInParserName, Plugin } from 'prettier'
  import type { NodeViewProps } from '@tiptap/vue-3'
  import { NodeViewContent, NodeViewWrapper } from '@tiptap/vue-3'
  import babelPlugin from 'prettier/plugins/babel'
  import estreePlugin from 'prettier/plugins/estree'
  import htmlPlugin from 'prettier/plugins/html'
  import postcssPlugin from 'prettier/plugins/postcss'
  import typescriptPlugin from 'prettier/plugins/typescript'
  import { format } from 'prettier/standalone'

  const props = defineProps<NodeViewProps>()

  const languages = [
    { label: 'Plain text', value: 'plaintext' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'Vue', value: 'xml' },
    { label: 'HTML', value: 'html' },
    { label: 'CSS', value: 'css' },
    { label: 'JSON', value: 'json' },
    { label: 'Bash', value: 'bash' },
    { label: 'Python', value: 'python' }
  ] as const

  interface FormatterConfig {
    parser: BuiltInParserName
    plugins: Plugin[]
  }

  const formatterConfig: Partial<Record<string, FormatterConfig>> = {
    javascript: { parser: 'babel', plugins: [babelPlugin, estreePlugin] },
    typescript: { parser: 'typescript', plugins: [typescriptPlugin, estreePlugin] },
    xml: { parser: 'vue', plugins: [htmlPlugin] },
    html: { parser: 'html', plugins: [htmlPlugin] },
    css: { parser: 'css', plugins: [postcssPlugin] },
    json: { parser: 'json-stringify', plugins: [babelPlugin, estreePlugin] }
  }

  const isFormatting = ref(false)
  const isLanguageMenuOpen = ref(false)
  const language = computed(() => props.node.attrs.language || 'plaintext')
  const languageLabel = computed(
    () => languages.find((option) => option.value === language.value)?.label || 'Plain text'
  )
  const canFormat = computed(() => Boolean(formatterConfig[language.value]))
  const formatTooltip = computed(() =>
    canFormat.value ? '格式化代码' : `${languageLabel.value} 暂不支持格式化`
  )

  function selectLanguage(value: string) {
    props.updateAttributes({ language: value })
  }

  async function formatCode() {
    const config = formatterConfig[language.value]
    if (!config || isFormatting.value) return

    isFormatting.value = true
    try {
      const formatted = await format(props.node.textContent, {
        parser: config.parser,
        plugins: config.plugins,
        semi: false,
        singleQuote: true
      })
      const position = props.getPos()
      if (typeof position !== 'number') throw new Error('Code block position is unavailable')

      props.editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.insertText(formatted, position + 1, position + props.node.nodeSize - 1)
          return true
        })
        .run()
      ElMessage.success('代码格式化成功')
    } catch {
      ElMessage.error('代码格式化失败，请检查语法是否正确')
    } finally {
      isFormatting.value = false
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(props.node.textContent)
      ElMessage.success('复制成功')
    } catch {
      ElMessage.error('复制失败，请检查浏览器剪贴板权限')
    }
  }
</script>

<template>
  <NodeViewWrapper
    as="pre"
    class="code-block"
    :class="{ 'code-block--menu-open': isLanguageMenuOpen }"
  >
    <span class="code-block__language-label" contenteditable="false">{{ languageLabel }}</span>
    <div class="code-block__actions" contenteditable="false" @mousedown.stop>
      <ElDropdown
        trigger="click"
        placement="bottom-start"
        @command="selectLanguage"
        @visible-change="isLanguageMenuOpen = $event"
      >
        <button
          class="code-block__action code-block__language"
          type="button"
          aria-label="选择代码语言"
        >
          <span>{{ languageLabel }}</span>
          <ArtSvgIcon icon="ri:arrow-down-s-line" />
        </button>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem
              v-for="option in languages"
              :key="option.value"
              :command="option.value"
              :class="{ 'is-selected': option.value === language }"
            >
              {{ option.label }}
            </ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
      <ElTooltip :content="formatTooltip">
        <button
          class="code-block__action code-block__icon-action"
          type="button"
          aria-label="格式化代码"
          :disabled="!canFormat || isFormatting"
          @click="formatCode"
        >
          <ArtSvgIcon :icon="isFormatting ? 'ri:loader-4-line' : 'ri:magic-line'" />
        </button>
      </ElTooltip>
      <ElTooltip content="复制代码">
        <button
          class="code-block__action code-block__icon-action"
          type="button"
          aria-label="复制代码"
          @click="copyCode"
        >
          <ArtSvgIcon icon="ri:file-copy-line" />
        </button>
      </ElTooltip>
    </div>
    <code :class="`language-${language}`">
      <NodeViewContent as="span" />
    </code>
  </NodeViewWrapper>
</template>
