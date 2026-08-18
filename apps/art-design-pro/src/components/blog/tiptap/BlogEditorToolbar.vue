<script setup lang="ts">
  import type { Editor } from '@tiptap/vue-3'
  import BlogTableMenu from './table/BlogTableMenu.vue'

  const { editor } = defineProps<{ editor: Editor }>()
  const emit = defineEmits<{
    image: []
    media: []
    search: []
  }>()

  const linkVisible = ref(false)
  const linkUrl = ref('')
  const tick = ref(0)

  const headingLabel = computed(() => {
    const update = tick.value
    void update
    for (const level of [1, 2, 3, 4] as const) {
      if (editor.isActive('heading', { level })) return `H${level}`
    }
    return '正文'
  })

  function refresh() {
    tick.value++
  }

  function setHeading(command: string) {
    if (command === 'paragraph') editor.chain().focus().setParagraph().run()
    else
      editor
        .chain()
        .focus()
        .toggleHeading({ level: Number(command) as 1 | 2 | 3 | 4 })
        .run()
  }

  function setList(command: string) {
    if (command === 'bullet') editor.chain().focus().toggleBulletList().run()
    else if (command === 'ordered') editor.chain().focus().toggleOrderedList().run()
    else editor.chain().focus().toggleTaskList().run()
  }

  function setAlign(command: string) {
    editor.chain().focus().setTextAlign(command).run()
  }

  function openLink() {
    linkUrl.value = String(editor.getAttributes('link').href ?? '')
    linkVisible.value = true
  }

  function applyLink() {
    const href = linkUrl.value.trim()
    if (!href) editor.chain().focus().unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    linkVisible.value = false
  }

  function removeLink() {
    editor.chain().focus().unsetLink().run()
    linkUrl.value = ''
    linkVisible.value = false
  }

  function handleImage(command: string) {
    if (command === 'media') emit('media')
    else emit('image')
  }

  onMounted(() => {
    editor.on('selectionUpdate', refresh)
    editor.on('transaction', refresh)
  })
  onBeforeUnmount(() => {
    editor.off('selectionUpdate', refresh)
    editor.off('transaction', refresh)
  })
</script>

<template>
  <div class="simple-toolbar" contenteditable="false">
    <div class="simple-toolbar__group">
      <ElTooltip content="撤销">
        <ElButton
          text
          :disabled="!editor.can().undo()"
          aria-label="撤销"
          @click="editor.chain().focus().undo().run()"
        >
          <ArtSvgIcon icon="ri:arrow-go-back-line" />
        </ElButton>
      </ElTooltip>
      <ElTooltip content="重做">
        <ElButton
          text
          :disabled="!editor.can().redo()"
          aria-label="重做"
          @click="editor.chain().focus().redo().run()"
        >
          <ArtSvgIcon icon="ri:arrow-go-forward-line" />
        </ElButton>
      </ElTooltip>
    </div>

    <span class="simple-toolbar__divider" />

    <ElDropdown trigger="click" @command="setHeading">
      <ElButton text class="simple-toolbar__wide" aria-label="段落格式">
        {{ headingLabel }}<ArtSvgIcon icon="ri:arrow-down-s-line" />
      </ElButton>
      <template #dropdown>
        <ElDropdownMenu>
          <ElDropdownItem command="paragraph">正文</ElDropdownItem>
          <ElDropdownItem v-for="level in 4" :key="level" :command="String(level)"
            >H{{ level }} 标题</ElDropdownItem
          >
        </ElDropdownMenu>
      </template>
    </ElDropdown>

    <ElDropdown trigger="click" @command="setList">
      <ElButton
        text
        :type="
          editor.isActive('bulletList') ||
          editor.isActive('orderedList') ||
          editor.isActive('taskList')
            ? 'primary'
            : 'default'
        "
        aria-label="列表"
      >
        <ArtSvgIcon icon="ri:list-unordered" /><ArtSvgIcon icon="ri:arrow-down-s-line" />
      </ElButton>
      <template #dropdown>
        <ElDropdownMenu>
          <ElDropdownItem command="bullet">无序列表</ElDropdownItem>
          <ElDropdownItem command="ordered">有序列表</ElDropdownItem>
          <ElDropdownItem command="task">任务列表</ElDropdownItem>
        </ElDropdownMenu>
      </template>
    </ElDropdown>

    <span class="simple-toolbar__divider" />

    <div class="simple-toolbar__group">
      <ElTooltip content="粗体"
        ><ElButton
          text
          :type="editor.isActive('bold') ? 'primary' : 'default'"
          aria-label="粗体"
          @click="editor.chain().focus().toggleBold().run()"
          ><b>B</b></ElButton
        ></ElTooltip
      >
      <ElTooltip content="斜体"
        ><ElButton
          text
          :type="editor.isActive('italic') ? 'primary' : 'default'"
          aria-label="斜体"
          @click="editor.chain().focus().toggleItalic().run()"
          ><i>I</i></ElButton
        ></ElTooltip
      >
      <ElTooltip content="下划线"
        ><ElButton
          text
          :type="editor.isActive('underline') ? 'primary' : 'default'"
          aria-label="下划线"
          @click="editor.chain().focus().toggleUnderline().run()"
          ><u>U</u></ElButton
        ></ElTooltip
      >
      <ElTooltip content="删除线"
        ><ElButton
          text
          :type="editor.isActive('strike') ? 'primary' : 'default'"
          aria-label="删除线"
          @click="editor.chain().focus().toggleStrike().run()"
          ><s>S</s></ElButton
        ></ElTooltip
      >
      <ElTooltip content="代码块"
        ><ElButton
          text
          :type="editor.isActive('codeBlock') ? 'primary' : 'default'"
          aria-label="代码块"
          @click="editor.chain().focus().toggleCodeBlock({ language: 'plaintext' }).run()"
          ><ArtSvgIcon icon="ri:code-s-slash-line" /></ElButton
      ></ElTooltip>
      <ElTooltip content="引用"
        ><ElButton
          text
          :type="editor.isActive('blockquote') ? 'primary' : 'default'"
          aria-label="引用"
          @click="editor.chain().focus().toggleBlockquote().run()"
          ><ArtSvgIcon icon="ri:double-quotes-l" /></ElButton
      ></ElTooltip>
      <ElTooltip content="高亮"
        ><ElButton
          text
          :type="editor.isActive('highlight') ? 'primary' : 'default'"
          aria-label="高亮"
          @click="editor.chain().focus().toggleHighlight({ color: '#fff1a8' }).run()"
          ><ArtSvgIcon icon="ri:mark-pen-line" /></ElButton
      ></ElTooltip>
    </div>

    <ElPopover v-model:visible="linkVisible" trigger="click" placement="bottom" :width="290">
      <template #reference>
        <ElTooltip content="链接"
          ><ElButton
            text
            :type="editor.isActive('link') ? 'primary' : 'default'"
            aria-label="链接"
            @click="openLink"
            ><ArtSvgIcon icon="ri:link" /></ElButton
        ></ElTooltip>
      </template>
      <div class="link-popover">
        <ElInput
          v-model="linkUrl"
          size="small"
          placeholder="https://example.com"
          @keydown.enter.prevent="applyLink"
        />
        <ElButton size="small" type="primary" @click="applyLink">应用</ElButton>
        <ElButton size="small" :disabled="!editor.isActive('link')" @click="removeLink"
          >移除</ElButton
        >
      </div>
    </ElPopover>

    <span class="simple-toolbar__divider" />

    <ElDropdown trigger="click" @command="setAlign">
      <ElButton text aria-label="文本对齐"
        ><ArtSvgIcon icon="ri:align-left" /><ArtSvgIcon icon="ri:arrow-down-s-line"
      /></ElButton>
      <template #dropdown>
        <ElDropdownMenu>
          <ElDropdownItem command="left">左对齐</ElDropdownItem>
          <ElDropdownItem command="center">居中</ElDropdownItem>
          <ElDropdownItem command="right">右对齐</ElDropdownItem>
          <ElDropdownItem command="justify">两端对齐</ElDropdownItem>
        </ElDropdownMenu>
      </template>
    </ElDropdown>

    <ElDropdown trigger="click" @command="handleImage">
      <ElButton text aria-label="插入图片"
        ><ArtSvgIcon icon="ri:image-add-line" /><ArtSvgIcon icon="ri:arrow-down-s-line"
      /></ElButton>
      <template #dropdown>
        <ElDropdownMenu>
          <ElDropdownItem command="upload">本地上传</ElDropdownItem>
          <ElDropdownItem command="media">从媒体库选择</ElDropdownItem>
        </ElDropdownMenu>
      </template>
    </ElDropdown>
    <BlogTableMenu :editor="editor" />
    <ElTooltip content="查找与替换"
      ><ElButton text aria-label="查找与替换" @click="emit('search')"
        ><ArtSvgIcon icon="ri:search-line" /></ElButton
    ></ElTooltip>
  </div>
</template>
