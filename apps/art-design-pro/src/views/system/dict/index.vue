<!-- 字典管理 -->
<template>
  <div class="art-full-height">
    <SplitPane v-model:collapse="isCollapsed" size="280px" :min-size="220" :max-size="440">
      <!-- 左侧：字典类型列表 -->
      <template #left>
        <div class="dict-sidebar flex h-full flex-col">
          <!-- 头部 -->
          <div class="sidebar-header">
            <div class="flex items-center justify-between">
              <span class="sidebar-title">字典分类</span>
              <span v-if="typeList.length" class="sidebar-count">{{ typeList.length }} 项</span>
            </div>
            <div class="sidebar-search mt-2">
              <el-icon class="search-icon"><Search /></el-icon>
              <input
                v-model="typeSearch"
                class="search-input"
                placeholder="搜索字典类型…"
              />
            </div>
          </div>

          <!-- 列表 -->
          <div class="type-list flex-1 overflow-y-auto">
            <div v-if="typeListQuery.isLoading.value" class="flex justify-center py-12">
              <el-icon class="animate-spin" :size="22" style="color: var(--art-primary)"><Loading /></el-icon>
            </div>
            <template v-else>
              <ElEmpty v-if="!filteredTypeList.length" :image-size="56" description="暂无数据" class="py-10" />
              <div
                v-for="(item, index) in filteredTypeList"
                v-else
                :key="item.id"
                class="type-item"
                :class="selectedType?.id === item.id ? 'is-active' : ''"
                :style="{ animationDelay: `${index * 0.03}s` }"
                @click="selectType(item)"
              >
                <div class="type-icon" :class="ICON_COLORS[index % ICON_COLORS.length]">
                  <el-icon><Collection /></el-icon>
                </div>
                <div class="type-info min-w-0 flex-1">
                  <div class="type-name truncate">{{ item.dictName }}</div>
                  <div class="type-code truncate">{{ item.dictCode }}</div>
                </div>
                <div class="type-meta" @click.stop>
                  <span class="type-actions">
                    <el-icon class="action-btn" @click="showTypeDialog('edit', item)"><square-pen  color="#4d5875"/></el-icon>
                    <el-icon class="action-btn danger" @click="deleteType(item)"><Trash2 color="#4d5875"/></el-icon>
                  </span>
                </div>
              </div>
            </template>
          </div>

          <!-- 底部新增按钮 -->
          <div class="sidebar-footer">
            <button class="add-type-btn" @click="showTypeDialog('add')">
              <el-icon><Plus /></el-icon>
              新增字典类型
            </button>
          </div>
        </div>
      </template>

      <!-- 右侧：字典数据 -->
      <template #main>
        <!-- 未选中 -->
        <div v-if="!selectedType" class="dict-empty-state">

          <div class="empty-icon-wrap">
            <el-icon :size="28"><Collection /></el-icon>
          </div>
          <p class="empty-title">请选择字典类型</p>
          <p class="empty-desc">从左侧列表选择一个字典类型，查看或管理其字典数据</p>
        </div>

        <!-- 已选中 -->
        <ElCard v-else class="art-table-card !mt-0 dict-main-card h-full">
          <!-- toolbar -->
          <template #header>
            <div class="main-toolbar">
              <div class="toolbar-left">
                <div class="toolbar-search-box">
                  <el-icon class="toolbar-search-icon"><Search /></el-icon>
                  <input class="toolbar-search-input" placeholder="搜索字典项…" />
                </div>
                <span class="toolbar-divider" />
                <div class="toolbar-type-tag">
                  <span class="tag-code">{{ selectedType.dictCode }}</span>
                  <span class="tag-name">{{ selectedType.dictName }}</span>
                </div>
              </div>
              <div class="toolbar-right">
                <button class="toolbar-btn" @click="dataListQuery.refetch()">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </button>
                <span class="toolbar-divider" />
                <ArtTableHeader
                  v-model:columns="columnChecks"
                  :loading="dataListQuery.isLoading.value"
                  :show-search-bar-btn="false"
                  class="!p-0"
                />
                <span class="toolbar-divider" />
                <button class="toolbar-btn primary" @click="showDataDialog('add')">
                  <el-icon><Plus /></el-icon>
                  新增字典项
                </button>
              </div>
            </div>
          </template>

          <ArtTable
            :loading="dataListQuery.isLoading.value"
            :data="dataList"
            :columns="columns"
            :border="false"
            :pagination="pagination"
            @pagination:size-change="handleSizeChange"
            @pagination:current-change="handleCurrentChange"
          />
        </ElCard>
      </template>
    </SplitPane>

    <!-- 字典类型弹窗 -->
    <DictTypeDialog
      v-model="typeDialogVisible"
      :dialog-type="typeDialogType"
      :dict-data="currentTypeData"
    />

    <!-- 字典数据弹窗 -->
    <DictDataDialog
      v-if="selectedType"
      v-model="dataDialogVisible"
      :dialog-type="dataDialogType"
      :dict-type-id="selectedType.id!"
      :dict-data="currentDataRow"
    />
  </div>
</template>

<script setup lang="ts">
  import { Plus, Search, Edit, Delete, Loading, Collection, Refresh } from '@element-plus/icons-vue'
  import { SquarePen,Trash2 } from '@lucide/vue'
  import { ElMessageBox } from 'element-plus'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import {
    useDictTypeListQuery,
    useRemoveDictTypeMutation,
    useDictDataListQuery,
    useRemoveDictDataMutation
  } from '@/hooks/queries/useDictQuery'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import SplitPane from '@/components/core/layouts/art-col-page/index.vue'
  import DictTypeDialog from './modules/dict-type-dialog.vue'
  import DictDataDialog from './modules/dict-data-dialog.vue'

  defineOptions({ name: 'DictManage' })

  type IDictType = Api.Dict.IDictType
  type IDictData = Api.Dict.IDictData

  const ICON_COLORS = ['amber', 'blue', 'green', 'purple', 'cyan', 'red']

  // -------- 字典类型 --------
  const isCollapsed = ref(false)
  const typeSearch = ref('')
  const selectedType = ref<IDictType | undefined>()
  const typeDialogVisible = ref(false)
  const typeDialogType = ref<'add' | 'edit'>('add')
  const currentTypeData = ref<IDictType | undefined>()

  const typeListQuery = useDictTypeListQuery({ current: 1, size: 200 })

  const typeList = computed(() => typeListQuery.data.value?.records ?? [])

  const filteredTypeList = computed(() => {
    const kw = typeSearch.value.trim().toLowerCase()
    if (!kw) return typeList.value
    return typeList.value.filter(
      (t) => t.dictName?.toLowerCase().includes(kw) || t.dictCode?.toLowerCase().includes(kw)
    )
  })

  watch(typeList, (list) => {
    if (!selectedType.value && list.length) {
      selectType(list[0])
    }
  })

  function selectType(item: IDictType) {
    selectedType.value = item
    dataParams.value = { ...dataParams.value, typeId: item.id!, current: 1 }
  }

  function showTypeDialog(type: 'add' | 'edit', row?: IDictType) {
    typeDialogType.value = type
    currentTypeData.value = row
    typeDialogVisible.value = true
  }

  const removeDictType = useRemoveDictTypeMutation()

  async function deleteType(item: IDictType) {
    await ElMessageBox.confirm(`确定删除字典类型"${item.dictName}"吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    removeDictType.mutate(item.id!, {
      onSuccess: () => {
        ElMessage.success('删除成功')
        if (selectedType.value?.id === item.id) selectedType.value = undefined
      }
    })
  }

  // -------- 字典数据 --------
  const dataDialogVisible = ref(false)
  const dataDialogType = ref<'add' | 'edit'>('add')
  const currentDataRow = ref<IDictData | undefined>()

  const dataParams = ref<Api.Dict.DictDataSearchParams>({ current: 1, size: 20, typeId: 0 })

  const dataListQuery = useDictDataListQuery(dataParams, {
    enabled: computed(() => !!selectedType.value)
  })

  const dataList = computed(() => dataListQuery.data.value?.records ?? [])
  const total = computed(() => dataListQuery.data.value?.page?.total ?? 0)

  const pagination = reactive({
    current: computed(() => dataParams.value.current),
    size: computed(() => dataParams.value.size),
    total
  })

  function handleSizeChange(size: number) {
    dataParams.value = { ...dataParams.value, size, current: 1 }
  }

  function handleCurrentChange(current: number) {
    dataParams.value = { ...dataParams.value, current }
  }

  const removeDictData = useRemoveDictDataMutation()

  function showDataDialog(type: 'add' | 'edit', row?: IDictData) {
    dataDialogType.value = type
    currentDataRow.value = row
    dataDialogVisible.value = true
  }

  async function deleteData(row: IDictData) {
    await ElMessageBox.confirm(`确定删除字典数据"${row.dictLabel}"吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    removeDictData.mutate(row.id!, {
      onSuccess: () => ElMessage.success('删除成功')
    })
  }

  const { columns, columnChecks } = useTableColumns<IDictData>(() => [
    { prop: 'dictLabel', label: '字典标签', minWidth: 120 },
    {
      prop: 'dictValue',
      label: '字典值',
      minWidth: 120,
      formatter: (row: IDictData) =>
        h('span', {
          style: {
            fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
            fontSize: '14px',
            color: 'var(--art-primary)',
            background: 'var(--el-color-primary-light-9)',
            padding: '2px 8px',
            borderRadius: '4px',
            display: 'inline-block'
          }
        }, row.dictValue ?? '')
    },
    { prop: 'dictSort', label: '排序', width: 80 },
    { prop: 'dictRemark', label: '备注', minWidth: 150, showOverflowTooltip: true },
    {
      prop: 'operation',
      label: '操作',
      width: 120,
      fixed: 'right',
      formatter: (row: IDictData) =>
        h('div', { style: 'text-align:right' }, [
          h(ArtButtonTable, { type: 'edit', onClick: () => showDataDialog('edit', row) }),
          h(ArtButtonTable, { type: 'delete', onClick: () => deleteData(row) })
        ])
    }
  ])
</script>

<style lang="scss" scoped>
/* ── 左侧面板 ── */
.dict-sidebar {
  height: 100%;
  background: var(--default-box-color);
}

.sidebar-header {
  padding: 16px 14px 10px;
  border-bottom: 1px solid var(--default-border);
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}

.sidebar-count {
  font-size: 14px;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 2px 8px;
  border-radius: 4px;
}

.sidebar-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: var(--art-primary);
    box-shadow: 0 0 0 3px rgba(var(--art-primary-rgb, 99, 102, 241), 0.1);
  }

  .search-icon {
    color: var(--el-text-color-placeholder);
    font-size: 14px;
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 14px;
    color: var(--el-text-color-regular);

    &::placeholder {
      color: var(--el-text-color-placeholder);
    }
  }
}

/* ── 类型列表 ── */
.type-list {
  padding: 6px 8px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 2px;
  }
}

.type-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.12s;
  position: relative;
  margin-bottom: 2px;
  animation: slideIn 0.3s ease both;

  &:hover {
    background: var(--el-fill-color-light);

    .type-actions { visibility: visible; }
    .type-count   { display: none; }
  }

  &.is-active {
    background: var(--el-color-primary-light-9);

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 3px;
      background: var(--art-primary);
      border-radius: 0 3px 3px 0;
    }

    .type-name  { color: var(--art-primary); font-weight: 600; }
    .type-code  { color: var(--art-primary); opacity: 0.7; }
    .type-actions { visibility: visible; }
    .type-count   { display: none; }
  }
}

.type-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;

  &.amber { background: rgba(212, 149, 74, 0.15); color: #c8832a; }
  &.blue  { background: rgba(91, 156, 245, 0.15); color: #3d82e8; }
  &.green { background: rgba(61, 214, 140, 0.15); color: #18a058; }
  &.red   { background: rgba(232, 84, 84, 0.15);  color: #d03050; }
  &.purple{ background: rgba(168, 130, 255, 0.15);color: #7c3aed; }
  &.cyan  { background: rgba(74, 212, 210, 0.15); color: #0891b2; }
}

.type-info {
  .type-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    line-height: 1.4;
  }

  .type-code {
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-top: 2px;
  }
}

.type-meta {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-width: 48px;
  justify-content: flex-end;
}

.type-count {
  font-family: ui-monospace, monospace;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 2px 7px;
  border-radius: 4px;
}

.type-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  visibility: hidden;

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 5px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    transition: all 0.15s;
    font-size: 14px;

    &:hover {
      background: var(--el-fill-color);
      color: var(--art-primary);
    }

    &.danger:hover {
      background: var(--el-color-danger-light-9);
      color: var(--el-color-danger);
    }
  }
}

/* ── 底部新增按钮 ── */
.sidebar-footer {
  padding: 10px 12px;
  border-top: 1px solid var(--default-border);
  flex-shrink: 0;
}

.add-type-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 0;
  border-radius: 7px;
  border: 1px dashed var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--art-primary);
    color: var(--art-primary);
    background: var(--el-color-primary-light-9);
  }
}

/* ── 右侧空状态 ── */
.dict-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 10px;

  .empty-icon-wrap {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: var(--el-fill-color);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-placeholder);
    margin-bottom: 4px;
  }

  .empty-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);
  }

  .empty-desc {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    text-align: center;
    max-width: 240px;
    line-height: 1.6;
  }
}

/* ── 右侧主区域 ── */
.dict-main-card {
  :deep(.el-card__header) {
    padding: 0;
    border-bottom: 1px solid var(--default-border);
  }

  :deep(.el-card__body){
    padding: 0;
  }
}

/* ── toolbar ── */
.main-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-search-box {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: var(--art-primary);
    box-shadow: 0 0 0 3px rgba(var(--art-primary-rgb, 99, 102, 241), 0.1);
  }

  .toolbar-search-icon {
    font-size: 14px;
    color: var(--el-text-color-placeholder);
  }

  .toolbar-search-input {
    background: none;
    border: none;
    outline: none;
    font-size: 14px;
    width: 160px;
    color: var(--el-text-color-regular);

    &::placeholder {
      color: var(--el-text-color-placeholder);
    }
  }
}

.toolbar-type-tag {
  display: flex;
  align-items: center;
  gap: 6px;

  .tag-code {
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: 14px;
    color: var(--art-primary);
    background: var(--el-color-primary-light-9);
    padding: 2px 8px;
    border-radius: 4px;
  }

  .tag-name {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}

.toolbar-divider {
  width: 1px;
  height: 18px;
  background: var(--el-border-color);
  flex-shrink: 0;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
  }

  &.primary {
    background: var(--art-primary);
    border-color: var(--art-primary);
    color: #fff;
    font-weight: 500;

    &:hover {
      opacity: 0.88;
    }
  }
}

/* ── 动画 ── */
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}
</style>
