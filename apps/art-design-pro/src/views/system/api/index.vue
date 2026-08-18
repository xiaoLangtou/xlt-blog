<!-- API 管理 -->
<template>
  <div class="api-page art-full-height">
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :show-expand="false"
      @reset="handleReset"
      @search="handleSearch"
    />

    <ElCard class="art-table-card">
      <ArtTableHeader
        v-model:columns="columnChecks"
        :loading="loading"
        @refresh="handleRefresh"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="showDialog('add')" v-ripple>新增接口</ElButton>
            <ElButton @click="handleSync" :loading="syncLoading" v-ripple>同步接口</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 接口弹窗 -->
    <ApiDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :api-data="currentApiData"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElTag, ElMessageBox } from 'element-plus'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import {
    useApiListQuery,
    useSyncApisQuery,
    useAddApiMutation,
    useEditApiMutation,
    useRemoveApiMutation
  } from '@/hooks/queries/useApiQuery'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ApiDialog from './modules/api-dialog.vue'

  defineOptions({ name: 'ApiManage' })

  type IApi = Api.ApiManage.IApi

  // 搜索
  const searchForm = ref<Record<string, unknown>>({ current: 1, size: 20 })
  const appliedSearch = ref<Record<string, unknown>>({})

  const queryParams = computed(() => ({
    ...appliedSearch.value,
    current: (searchForm.value.current as number) || 1,
    size: (searchForm.value.size as number) || 20
  }))

  const listQuery = useApiListQuery(queryParams)
  const loading = computed(() => listQuery.isLoading.value)
  const data = computed(() => listQuery.data.value?.records ?? [])

  const total = computed(() => listQuery.data.value?.pager?.total ?? 0)

  const pagination = reactive({
    current: computed(() => (searchForm.value.current as number) || 1),
    size: computed(() => (searchForm.value.size as number) || 20),
    total
  })

  // Mutations
  const addApi = useAddApiMutation()
  const editApi = useEditApiMutation()
  const removeApi = useRemoveApiMutation()

  // 同步
  const syncLoading = ref(false)
  const syncQuery = useSyncApisQuery({ enabled: ref(false) })

  // 弹窗
  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const currentApiData = ref<IApi | undefined>()

  // Method colors
  const methodColors: Record<string, string> = {
    GET: '#61affe',
    POST: '#49cc90',
    PUT: '#fca130',
    DELETE: '#f93e3e',
    PATCH: '#50e3c2',
    HEAD: '#9012fe',
    OPTIONS: '#0d5aa7'
  }

  const searchItems = computed(() => [
    { label: '接口路径', key: 'path', type: 'input', props: { placeholder: '请输入接口路径', clearable: true } },
    { label: '接口描述', key: 'description', type: 'input', props: { placeholder: '请输入接口描述', clearable: true } },
    {
      label: '请求方式',
      key: 'method',
      type: 'select',
      props: {
        placeholder: '请选择请求方式',
        options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].map((m) => ({
          label: m,
          value: m
        })),
        clearable: true
      }
    },
    { label: '接口分组', key: 'tags', type: 'input', props: { placeholder: '请输入接口分组', clearable: true } }
  ])

  const { columns, columnChecks } = useTableColumns<IApi>(() => [
    { type: 'index', width: 60, label: '序号' },
    {
      prop: 'method',
      label: '请求方式',
      width: 100,
      formatter: (row: IApi) =>
        h(
          ElTag,
          {
            style: {
              backgroundColor: methodColors[row.method ?? ''] ?? '#999',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontFamily: 'monospace'
            }
          },
          () => row.method ?? ''
        )
    },
    {
      prop: 'path',
      label: '接口路径',
      minWidth: 200,
      formatter: (row: IApi) =>
        h(
          'code',
          {
            style: {
              fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
              fontSize: '13px',
              color: 'var(--el-text-color-primary)'
            }
          },
          row.path ?? ''
        )
    },
    { prop: 'description', label: '接口描述', minWidth: 150, showOverflowTooltip: true },
    {
      prop: 'apiGroup',
      label: '接口分组',
      width: 120,
      formatter: (row: IApi) =>
        row.apiGroup
          ? h(ElTag, { type: 'info' }, () => row.apiGroup ?? '')
          : h('span', { style: 'color: var(--el-text-color-placeholder)' }, '-')
    },
    {
      prop: 'operation',
      label: '操作',
      width: 120,
      fixed: 'right',
      formatter: (row: IApi) =>
        h('div', { style: 'display:flex;gap:4px' }, [
          h(ArtButtonTable, { type: 'edit', onClick: () => showDialog('edit', row) }),
          h(ArtButtonTable, { type: 'delete', onClick: () => deleteApi(row) })
        ])
    }
  ])

  function handleSearch(params: Record<string, unknown>) {
    appliedSearch.value = { ...params }
    searchForm.value.current = 1
  }

  function handleReset() {
    appliedSearch.value = {}
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

  async function handleSync() {
    syncLoading.value = true
    try {
      await syncQuery.refetch()
      ElMessage.success('同步成功')
      listQuery.refetch()
    } catch {
      ElMessage.error('同步失败')
    } finally {
      syncLoading.value = false
    }
  }

  function showDialog(type: 'add' | 'edit', row?: IApi) {
    dialogType.value = type
    currentApiData.value = row
    dialogVisible.value = true
  }

  function handleDialogSuccess() {
    dialogVisible.value = false
    listQuery.refetch()
  }

  async function deleteApi(row: IApi) {
    await ElMessageBox.confirm(`确定删除接口"${row.path}"吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    removeApi.mutate(row.id!, {
      onSuccess: () => {
        ElMessage.success('删除成功')
        listQuery.refetch()
      }
    })
  }
</script>
