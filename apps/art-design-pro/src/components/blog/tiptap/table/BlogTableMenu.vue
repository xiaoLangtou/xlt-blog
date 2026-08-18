<script setup lang="ts">
  import type { Editor } from '@tiptap/vue-3'
  import TableGridPicker from './TableGridPicker.vue'
  import {
    canMoveCurrentColumn,
    canMoveCurrentRow,
    moveCurrentColumn,
    moveCurrentRow
  } from './table-commands'

  const { editor } = defineProps<{ editor: Editor }>()
  const visible = ref(false)
  const activeInTable = ref(false)
  const popoverWidth = computed(() => (activeInTable.value ? 210 : 290))

  function refresh() {
    activeInTable.value = editor.isActive('table')
  }

  function handleSelect({ rows, cols }: { rows: number; cols: number }) {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    visible.value = false
  }

  async function command(action: string) {
    const chain = editor.chain().focus()
    if (action === 'deleteTable') {
      try {
        await ElMessageBox.confirm('确定删除整个表格吗？此操作可通过撤销恢复。', '删除表格', {
          type: 'warning'
        })
      } catch {
        return
      }
    }
    const actions: Record<string, () => boolean> = {
      addColumnBefore: () => chain.addColumnBefore().run(),
      addColumnAfter: () => chain.addColumnAfter().run(),
      deleteColumn: () => chain.deleteColumn().run(),
      addRowBefore: () => chain.addRowBefore().run(),
      addRowAfter: () => chain.addRowAfter().run(),
      deleteRow: () => chain.deleteRow().run(),
      moveRowUp: () => moveCurrentRow(editor, -1),
      moveRowDown: () => moveCurrentRow(editor, 1),
      moveColumnLeft: () => moveCurrentColumn(editor, -1),
      moveColumnRight: () => moveCurrentColumn(editor, 1),
      mergeCells: () => chain.mergeCells().run(),
      splitCell: () => chain.splitCell().run(),
      toggleHeaderRow: () => chain.toggleHeaderRow().run(),
      toggleHeaderColumn: () => chain.toggleHeaderColumn().run(),
      toggleHeaderCell: () => chain.toggleHeaderCell().run(),
      alignLeft: () => chain.setCellAttribute('align', 'left').run(),
      alignCenter: () => chain.setCellAttribute('align', 'center').run(),
      alignRight: () => chain.setCellAttribute('align', 'right').run(),
      backgroundNeutral: () => chain.setCellAttribute('background', 'neutral').run(),
      backgroundAmber: () => chain.setCellAttribute('background', 'amber').run(),
      backgroundBlue: () => chain.setCellAttribute('background', 'blue').run(),
      clearBackground: () => chain.setCellAttribute('background', null).run(),
      fitContainer: () => chain.updateAttributes('table', { fit: 'container' }).run(),
      fitContent: () => chain.updateAttributes('table', { fit: 'content' }).run(),
      fixTables: () => chain.fixTables().run(),
      deleteTable: () => chain.deleteTable().run()
    }
    actions[action]?.()
    visible.value = false
  }

  onMounted(() => {
    refresh()
    editor.on('selectionUpdate', refresh)
    editor.on('transaction', refresh)
  })
  onBeforeUnmount(() => {
    editor.off('selectionUpdate', refresh)
    editor.off('transaction', refresh)
  })
</script>

<template>
  <ElPopover v-model:visible="visible" trigger="click" placement="bottom" :width="popoverWidth">
    <template #reference>
      <span class="table-menu__trigger">
        <ElTooltip content="表格" :disabled="visible">
          <ElButton text :type="activeInTable ? 'primary' : 'default'" aria-label="表格操作">
            <ArtSvgIcon icon="ri:table-2" />
          </ElButton>
        </ElTooltip>
      </span>
    </template>

    <TableGridPicker v-if="!activeInTable" @select="handleSelect" />
    <div v-else class="table-menu">
      <button type="button" @click="command('addColumnBefore')">在左侧添加列</button>
      <button type="button" @click="command('addColumnAfter')">在右侧添加列</button>
      <button type="button" @click="command('deleteColumn')">删除当前列</button>
      <span />
      <button
        type="button"
        :disabled="editor.isActive('tableHeader')"
        @click="command('addRowBefore')"
      >
        在上方添加行
      </button>
      <button type="button" @click="command('addRowAfter')">在下方添加行</button>
      <button
        type="button"
        :disabled="editor.isActive('tableHeader')"
        @click="command('deleteRow')"
      >
        删除当前行
      </button>
      <span />
      <button type="button" :disabled="!editor.can().mergeCells()" @click="command('mergeCells')">
        合并选中单元格
      </button>
      <button type="button" :disabled="!editor.can().splitCell()" @click="command('splitCell')">
        拆分单元格
      </button>
      <button type="button" @click="command('toggleHeaderRow')">切换表头行</button>
      <button type="button" @click="command('toggleHeaderColumn')">切换表头列</button>
      <button type="button" @click="command('toggleHeaderCell')">切换当前表头</button>
      <span />
      <div class="table-menu__group" aria-label="移动行列">
        <button
          type="button"
          :disabled="!canMoveCurrentRow(editor, -1)"
          @click="command('moveRowUp')"
        >
          上移行
        </button>
        <button
          type="button"
          :disabled="!canMoveCurrentRow(editor, 1)"
          @click="command('moveRowDown')"
        >
          下移行
        </button>
        <button
          type="button"
          :disabled="!canMoveCurrentColumn(editor, -1)"
          @click="command('moveColumnLeft')"
        >
          左移列
        </button>
        <button
          type="button"
          :disabled="!canMoveCurrentColumn(editor, 1)"
          @click="command('moveColumnRight')"
        >
          右移列
        </button>
      </div>
      <span />
      <div class="table-menu__group" aria-label="单元格对齐">
        <button type="button" @click="command('alignLeft')">左</button>
        <button type="button" @click="command('alignCenter')">中</button>
        <button type="button" @click="command('alignRight')">右</button>
      </div>
      <div class="table-menu__group" aria-label="单元格背景">
        <button type="button" class="color-neutral" @click="command('backgroundNeutral')"
          >灰</button
        >
        <button type="button" class="color-amber" @click="command('backgroundAmber')">黄</button>
        <button type="button" class="color-blue" @click="command('backgroundBlue')">蓝</button>
        <button type="button" @click="command('clearBackground')">清除</button>
      </div>
      <span />
      <button type="button" @click="command('fitContainer')">适应编辑器宽度</button>
      <button type="button" @click="command('fitContent')">按内容宽度</button>
      <button type="button" @click="command('fixTables')">修复表格结构</button>
      <span />
      <button type="button" class="is-danger" @click="command('deleteTable')">删除表格</button>
    </div>
  </ElPopover>
</template>
