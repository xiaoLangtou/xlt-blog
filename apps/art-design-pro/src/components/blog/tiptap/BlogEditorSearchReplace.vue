<script setup lang="ts">
  import type { Editor } from '@tiptap/vue-3'

  const { editor } = defineProps<{ editor: Editor }>()
  const open = defineModel<boolean>('open', { default: false })
  const searchTerm = ref('')
  const replaceTerm = ref('')
  const caseSensitive = ref(false)
  const wholeWord = ref(false)
  const resultCount = ref(0)
  const currentIndex = ref(0)

  function refreshStatus() {
    const storage = editor.storage.findAndReplace
    resultCount.value = storage?.results?.length ?? 0
    currentIndex.value = resultCount.value ? (storage?.currentIndex ?? 0) + 1 : 0
  }

  function updateSearch() {
    editor.commands.setSearchTerm(searchTerm.value)
    editor.commands.setCaseSensitive(caseSensitive.value)
    editor.commands.setWholeWord(wholeWord.value)
    nextTick(refreshStatus)
  }

  function updateReplace() {
    editor.commands.setReplaceTerm(replaceTerm.value)
  }

  function previous() {
    editor.commands.goToPreviousResult()
    refreshStatus()
  }

  function next() {
    editor.commands.goToNextResult()
    refreshStatus()
  }

  function replaceCurrent() {
    updateReplace()
    editor.commands.replace()
    refreshStatus()
  }

  function replaceAll() {
    updateReplace()
    editor.commands.replaceAll()
    refreshStatus()
  }

  function close() {
    open.value = false
    editor.commands.clearSearch()
    resultCount.value = 0
    currentIndex.value = 0
    editor.commands.focus()
  }

  watch([searchTerm, caseSensitive, wholeWord], updateSearch)
  watch(replaceTerm, updateReplace)
  watch(open, (value) => {
    if (!value) editor.commands.clearSearch()
  })

  onMounted(() => editor.on('transaction', refreshStatus))
  onBeforeUnmount(() => editor.off('transaction', refreshStatus))
</script>

<template>
  <div v-if="open" class="editor-search" contenteditable="false">
    <div class="editor-search__row">
      <ElInput
        v-model="searchTerm"
        size="small"
        clearable
        placeholder="查找"
        aria-label="查找内容"
        @keydown.enter.prevent="next"
        @keydown.esc.prevent="close"
      />
      <span class="editor-search__count">{{ currentIndex }}/{{ resultCount }}</span>
      <ElTooltip content="上一个">
        <ElButton text aria-label="上一个匹配" @click="previous">
          <ArtSvgIcon icon="ri:arrow-up-s-line" />
        </ElButton>
      </ElTooltip>
      <ElTooltip content="下一个">
        <ElButton text aria-label="下一个匹配" @click="next">
          <ArtSvgIcon icon="ri:arrow-down-s-line" />
        </ElButton>
      </ElTooltip>
      <ElTooltip content="区分大小写">
        <ElButton
          text
          aria-label="区分大小写"
          :type="caseSensitive ? 'primary' : 'default'"
          @click="caseSensitive = !caseSensitive"
        >
          Aa
        </ElButton>
      </ElTooltip>
      <ElTooltip content="全词匹配">
        <ElButton
          text
          aria-label="全词匹配"
          :type="wholeWord ? 'primary' : 'default'"
          @click="wholeWord = !wholeWord"
        >
          W
        </ElButton>
      </ElTooltip>
      <ElButton text aria-label="关闭查找" @click="close">
        <ArtSvgIcon icon="ri:close-line" />
      </ElButton>
    </div>
    <div class="editor-search__row">
      <ElInput
        v-model="replaceTerm"
        size="small"
        placeholder="替换为"
        aria-label="替换内容"
        @keydown.enter.prevent="replaceCurrent"
        @keydown.esc.prevent="close"
      />
      <ElButton size="small" :disabled="!resultCount" @click="replaceCurrent">替换</ElButton>
      <ElButton size="small" :disabled="!resultCount" @click="replaceAll">全部替换</ElButton>
    </div>
  </div>
</template>
