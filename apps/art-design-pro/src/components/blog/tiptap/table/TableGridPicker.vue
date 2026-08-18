<script setup lang="ts">
  interface Cell {
    row: number
    col: number
  }

  const props = withDefaults(
    defineProps<{
      maxRow?: number
      maxCol?: number
      defaultRow?: number
      defaultCol?: number
    }>(),
    {
      maxRow: 10,
      maxCol: 10,
      defaultRow: 7,
      defaultCol: 7
    }
  )

  const emit = defineEmits<{
    select: [payload: { rows: number; cols: number }]
  }>()

  // 单元格边长与间距（px）——固定尺寸，网格随行列数增长而增长，
  // 单元格本身尺寸恒定，避免已有格子在扩展/收缩时抖动。
  const CELL_SIZE = 20
  const GRID_GAP = 4

  const hoveredRow = ref(props.defaultRow)
  const hoveredCol = ref(props.defaultCol)
  const rowCount = ref(props.defaultRow)
  const colCount = ref(props.defaultCol)

  const cells = computed<Cell[]>(() => {
    const list: Cell[] = []
    for (let row = 1; row <= rowCount.value; row += 1) {
      for (let col = 1; col <= colCount.value; col += 1) {
        list.push({ row, col })
      }
    }
    return list
  })

  // 固定像素轨道：单元格尺寸恒定，容器宽高由当前行列数决定。
  const gridStyle = computed(() => ({
    gridTemplateColumns: `repeat(${colCount.value}, ${CELL_SIZE}px)`,
    gridTemplateRows: `repeat(${rowCount.value}, ${CELL_SIZE}px)`,
    gap: `${GRID_GAP}px`
  }))

  // hover 到最后一行/列时向外扩展一格（不超过 max），
  // 回到默认区域内则收缩回默认尺寸。
  function expandOrShrinkRows(row: number) {
    if (row === rowCount.value && rowCount.value < props.maxRow) {
      rowCount.value += 1
    } else if (row <= props.defaultRow && rowCount.value > props.defaultRow) {
      rowCount.value = props.defaultRow
    }
  }

  function expandOrShrinkCols(col: number) {
    if (col === colCount.value && colCount.value < props.maxCol) {
      colCount.value += 1
    } else if (col <= props.defaultCol && colCount.value > props.defaultCol) {
      colCount.value = props.defaultCol
    }
  }

  function handleHover(row: number, col: number) {
    hoveredRow.value = row
    hoveredCol.value = col
    expandOrShrinkRows(row)
    expandOrShrinkCols(col)
  }

  function reset() {
    hoveredRow.value = props.defaultRow
    hoveredCol.value = props.defaultCol
    rowCount.value = props.defaultRow
    colCount.value = props.defaultCol
  }

  function handleSelect(row: number, col: number) {
    emit('select', { rows: row, cols: col })
    reset()
  }

  defineExpose({ reset })
</script>

<template>
  <div
    class="table-grid-picker"
    role="grid"
    :aria-label="`插入 ${hoveredRow} 行 ${hoveredCol} 列表格`"
  >
    <div class="table-grid-picker__grid" :style="gridStyle">
      <div
        v-for="cell in cells"
        :key="`${cell.row}-${cell.col}`"
        class="table-grid-picker__cell"
        role="gridcell"
        :class="{ 'is-active': cell.row <= hoveredRow && cell.col <= hoveredCol }"
        :aria-label="`${cell.row} 行 ${cell.col} 列`"
        @mouseenter="handleHover(cell.row, cell.col)"
        @click="handleSelect(cell.row, cell.col)"
      />
    </div>
    <div class="table-grid-picker__status">
      <span class="table-grid-picker__stat">
        <el-icon class="table-grid-picker__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <rect x="4" y="5" width="3.5" height="14" rx="1" />
            <rect x="10.25" y="5" width="3.5" height="14" rx="1" />
            <rect x="16.5" y="5" width="3.5" height="14" rx="1" />
          </svg>
        </el-icon>
        <span>{{ hoveredCol }}</span>
      </span>
      <span class="table-grid-picker__times">×</span>
      <span class="table-grid-picker__stat">
        <el-icon class="table-grid-picker__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <rect x="5" y="4" width="14" height="3.5" rx="1" />
            <rect x="5" y="10.25" width="14" height="3.5" rx="1" />
            <rect x="5" y="16.5" width="14" height="3.5" rx="1" />
          </svg>
        </el-icon>
        <span>{{ hoveredRow }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
  .table-grid-picker {
    /* 主色可由外部通过该变量覆盖，适配公司 UI 规范 */
    --grid-active-color: var(--theme-color, #6366f1);
    --grid-border-color: var(--default-border, #e5e7eb);
    --grid-cell-bg: var(--default-box-color, #fff);
    --grid-muted-color: #9ca3af;

    display: inline-grid;
    gap: 10px;
    justify-items: center;
    outline: none;
  }

  .table-grid-picker__grid {
    display: grid;
    justify-content: center;
    /* gap / 轨道由 :style 提供，单元格尺寸恒定 */
  }

  .table-grid-picker__cell {
    width: 100%;
    height: 100%;
    cursor: pointer;
    background: var(--grid-cell-bg);
    border: 1px solid var(--grid-border-color);
    border-radius: 3px;
    transition:
      background-color 0.08s ease,
      border-color 0.08s ease;
  }

  .table-grid-picker__cell.is-active {
    background: color-mix(in srgb, var(--grid-active-color) 16%, var(--grid-cell-bg));
    border-color: var(--grid-active-color);
  }

  .table-grid-picker__status {
    display: flex;
    gap: 6px;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: var(--art-gray-700, #6b7280);
    font-variant-numeric: tabular-nums;
  }

  .table-grid-picker__stat {
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }

  .table-grid-picker__icon {
    color: var(--grid-active-color);
  }

  .table-grid-picker__times {
    color: var(--grid-muted-color);
  }
</style>
