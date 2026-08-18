<!-- 岗位管理 -->
<template>
  <div class="post-manage  art-full-height">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-3 gap-3.5 mb-[18px] max-[1180px]:grid-cols-2 max-sm:grid-cols-1">
      <div class="post-stat-card">
        <div class="post-stat-icon" style="color: var(--art-info); background: color-mix(in srgb, var(--art-info) 12%, transparent)">
          <ArtSvgIcon icon="ri:briefcase-line" :size="20" />
        </div>
        <div>
          <div class="text-11px mb-0.5 truncate" style="color: var(--art-gray-600)">岗位总数</div>
          <div class="text-2xl font-bold leading-tight" style="color: var(--art-gray-900)">{{ total }}</div>
        </div>
      </div>
      <div class="post-stat-card">
        <div class="post-stat-icon" style="color: var(--art-success); background: color-mix(in srgb, var(--art-success) 12%, transparent)">
          <ArtSvgIcon icon="ri:checkbox-circle-line" :size="20" />
        </div>
        <div>
          <div class="text-11px mb-0.5 truncate" style="color: var(--art-gray-600)">已启用</div>
          <div class="text-2xl font-bold leading-tight" style="color: var(--art-gray-900)">{{ postStats.enabled }}</div>
        </div>
      </div>
      <div class="post-stat-card">
        <div class="post-stat-icon" style="color: var(--art-danger); background: color-mix(in srgb, var(--art-danger) 12%, transparent)">
          <ArtSvgIcon icon="ri:close-circle-line" :size="20" />
        </div>
        <div>
          <div class="text-11px mb-0.5 truncate" style="color: var(--art-gray-600)">已停用</div>
          <div class="text-2xl font-bold leading-tight" style="color: var(--art-gray-900)">{{ postStats.disabled }}</div>
        </div>
      </div>
    </div>

    <!-- 搜索工具栏 -->
    <ArtSearchCard
      v-model:keyword="keyword"
      v-model:filter-values="filterValues"
      class="mb-3.5"
      placeholder="搜索岗位名称、岗位编码..."
      :filter-items="filterItems"
      @search="handleSearch"
      @reset="handleReset"
    >
      <template #actions>
        <ElButton type="primary" @click="showDialog('add')">
          <ArtSvgIcon icon="ri:add-line" :size="12" class="mr-1" />
          新增岗位
        </ElButton>
      </template>
    </ArtSearchCard>

    <!-- 表格卡片 -->
    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="handleRefresh" />

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 岗位弹窗 -->
    <PostDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :post-data="currentPostData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElTag, ElMessageBox } from 'element-plus'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import {
    usePostListQuery,
    useRemovePostMutation,
    useChangePostStatusMutation
  } from '@/hooks/queries/usePostQuery'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtSearchCard from '@/components/core/search/index.vue'
  import PostDialog from './modules/post-dialog.vue'

  defineOptions({ name: 'PostManage' })

  type IPost = Api.Post.IPost

  const searchForm = ref<Api.Post.PostSearchParams & { current: number; size: number }>({
    current: 1,
    size: 20,
    name: undefined,
    code: undefined,
    status: undefined
  })

  const appliedSearch = ref<Api.Post.PostSearchParams>({ current: 1, size: 20 })

  // 搜索组件状态
  const keyword = ref('')
  const filterValues = ref<Record<string, any>>({})

  const filterItems = [
    {
      key: 'status',
      label: '岗位状态',
      type: 'select' as const,
      placeholder: '全部状态',
      options: [
        { label: '启用', value: 1 },
        { label: '停用', value: 0 }
      ]
    }
  ]

  const queryParams = computed(() => ({
    ...appliedSearch.value,
    current: searchForm.value.current,
    size: searchForm.value.size
  }))

  const listQuery = usePostListQuery(queryParams)
  const loading = computed(() => listQuery.isLoading.value)
  const data = computed(() => listQuery.data.value?.records ?? [])

  const total = computed(() => listQuery.data.value?.pager?.total ?? 0)

  const postStats = computed(() => {
    const enabled = data.value.filter((item) => item.status === 1 || item.status === '1').length
    return { enabled, disabled: data.value.length - enabled }
  })

  const pagination = reactive({
    current: computed(() => searchForm.value.current),
    size: computed(() => searchForm.value.size),
    total
  })

  const removePost = useRemovePostMutation()
  const changeStatus = useChangePostStatusMutation()

  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const currentPostData = ref<IPost | undefined>()

  const { columns, columnChecks } = useTableColumns<IPost>(() => [
    { type: 'index', width: 60, label: '#' },
    {
      prop: 'name',
      label: '岗位名称',
      minWidth: 140,
      formatter: (row: IPost) =>
        h('span', { class: 'post-row-name', title: row.description }, row.name || '-')
    },
    {
      prop: 'code',
      label: '岗位编码',
      minWidth: 140,
      formatter: (row: IPost) =>
        h('span', { class: 'post-code-pill' }, row.code || '-')
    },
    {
      prop: 'sortOrder',
      label: '排序',
      width: 80,
      formatter: (row: IPost) =>
        h('span', { class: 'post-sort' }, row.sortOrder ?? '-')
    },
    {
      prop: 'status',
      label: '状态',
      width: 80,
      formatter: (row: IPost) =>
        h(
          ElTag,
          {
            type: row.status === 1 || row.status === '1' ? 'success' : 'danger',
            class: 'post-tag'
          },
          () => (row.status === 1 || row.status === '1' ? '启用' : '停用')
        )
    },
    {
      prop: 'createTime',
      label: '创建时间',
      minWidth: 160,
      formatter: (row: IPost) =>
        h('span', { class: 'post-muted' }, row.createTime || '-')
    },
    {
      prop: 'operation',
      label: '操作',
      width: 160,
      fixed: 'right',
      formatter: (row: IPost) =>
        h('div', { class: 'post-row-actions' }, [
          h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) }),
          h(ArtButtonTable, {
            type: 'view',
            title: row.status === 1 || row.status === '1' ? '禁用' : '启用',
            onClick: () => toggleStatus(row)
          }),
          h(ArtButtonTable, { type: 'delete', onClick: () => deletePost(row) })
        ])
    }
  ])

  function handleSearch({ keyword: kw, filters }: { keyword: string; filters: Record<string, any> }) {
    appliedSearch.value = {
      current: 1,
      size: 20,
      name: kw || undefined,
      status: filters.status !== undefined && filters.status !== '' ? Number(filters.status) : undefined
    }
    searchForm.value.current = 1
  }

  function handleReset() {
    appliedSearch.value = { current: 1, size: 20 }
    searchForm.value.current = 1
  }

  function handleRefresh() {
    listQuery.refetch()
  }

  function handleSizeChange(size: number) {
    searchForm.value.size = size
    searchForm.value.current = 1
  }

  function handleCurrentChange(current: number) {
    searchForm.value.current = current
  }

  function showDialog(type: 'add' | 'edit', row?: IPost) {
    dialogType.value = type
    currentPostData.value = row
    dialogVisible.value = true
  }

  function handleDialogSuccess() {
    dialogVisible.value = false
    listQuery.refetch()
  }

  function toggleStatus(row: IPost) {
    const newStatus = row.status === 1 || row.status === '1' ? 0 : 1
    changeStatus.mutate(
      { id: row.id!, status: newStatus },
      {
        onSuccess: () => {
          ElMessage.success('状态修改成功')
          listQuery.refetch()
        }
      }
    )
  }

  async function deletePost(row: IPost) {
    await ElMessageBox.confirm(`确定删除岗位"${row.name}"吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    removePost.mutate(row.id!, {
      onSuccess: () => {
        ElMessage.success('删除成功')
        listQuery.refetch()
      }
    })
  }
</script>

<style lang="scss" scoped>
  // ============ 页面容器 ============
  .post-manage {
    color: var(--art-gray-900);
    border-radius: calc(var(--custom-radius) / 2 + 4px);

    @media (max-width: 768px) {
      padding: 16px;
    }
  }

  // ============ 统计卡片 ============
  .post-stat-card {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 18px 20px;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: 12px;
    opacity: 0;
    animation: post-fade-up 0.5s ease forwards;

    &:nth-child(1) { animation-delay: 0.05s; }
    &:nth-child(2) { animation-delay: 0.1s; }
    &:nth-child(3) { animation-delay: 0.15s; }
  }

  .post-stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    border-radius: 10px;
  }

  @keyframes post-fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  // ============ 表格卡片 ============
  .art-table-card {
    opacity: 0;
    animation: post-fade-up 0.5s ease forwards;
    animation-delay: 0.2s;

    :deep(.el-table) {
      .el-table__header th {
        font-size: 11.5px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--art-gray-600);
        background: var(--art-gray-200) !important;
      }

      .el-table__body td {
        font-size: 13.5px;
      }
    }

    :deep(.el-pagination) {
      padding: 12px 16px;
    }
  }

  // ============ 表格内联样式 ============
  .post-row-name {
    overflow: hidden;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--art-gray-900);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .post-code-pill {
    display: inline-flex;
    max-width: 100%;
    align-items: center;
    padding: 2px 7px;
    overflow: hidden;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    color: var(--theme-color);
    text-overflow: ellipsis;
    white-space: nowrap;
    background: color-mix(in srgb, var(--theme-color) 10%, transparent);
    border: 1px solid var(--art-card-border);
    border-radius: 4px;
  }

  .post-sort {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .post-muted {
    font-size: 12.5px;
    color: var(--art-gray-600);
  }

  .post-tag.el-tag {
    border-color: transparent;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
  }

  .post-row-actions {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    width: 100%;
    justify-content: flex-end;
  }
</style>
