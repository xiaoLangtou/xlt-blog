<!-- 系统日志 -->
<template>
  <div class="logs-page art-full-height">
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
      />

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
        @row-click="handleRowClick"
        highlight-current-row
      />
    </ElCard>

    <!-- 日志详情弹窗 -->
    <ElDialog
      v-model="detailVisible"
      title="日志详情"
      width="640px"
      :close-on-click-modal="true"
    >
      <template v-if="detailQuery.isLoading.value">
        <div class="flex justify-center py-10">
          <ElIcon class="animate-spin" :size="24"><Loading /></ElIcon>
        </div>
      </template>
      <ElDescriptions v-else-if="detailData" :column="2" border size="small">
        <ElDescriptionsItem label="日志ID">{{ detailData.id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="日志类型">{{ detailData.logType }}</ElDescriptionsItem>
        <ElDescriptionsItem label="请求路径" :span="2">{{ detailData.requestUrl }}</ElDescriptionsItem>
        <ElDescriptionsItem label="请求方式">{{ detailData.requestMethod }}</ElDescriptionsItem>
        <ElDescriptionsItem label="请求IP">{{ detailData.requestIp }}</ElDescriptionsItem>
        <ElDescriptionsItem label="IP属地">{{ detailData.requestIpAddr }}</ElDescriptionsItem>
        <ElDescriptionsItem label="耗时">{{ detailData.requestTimeConsume }}ms</ElDescriptionsItem>
        <ElDescriptionsItem label="浏览器">{{ detailData.browser }}</ElDescriptionsItem>
        <ElDescriptionsItem label="操作系统">{{ detailData.os }}</ElDescriptionsItem>
        <ElDescriptionsItem label="操作模块">{{ detailData.module }}</ElDescriptionsItem>
        <ElDescriptionsItem label="状态">{{ detailData.status }}</ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间" :span="2">{{ detailData.createTime }}</ElDescriptionsItem>
        <ElDescriptionsItem label="日志内容" :span="2">
          <div style="max-height:200px;overflow-y:auto;white-space:pre-wrap;font-family:monospace;font-size:12px;">
            {{ detailData.logContent }}
          </div>
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { Loading } from '@element-plus/icons-vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import { useLogListQuery, useLogDetailQuery } from '@/hooks/queries/useLoggerQuery'

  defineOptions({ name: 'SystemLogs' })

  type ILog = Api.Logger.ILogs

  // 搜索
  const searchForm = ref<Api.Logger.LogSearchParams & { current: number; size: number }>({
    current: 1,
    size: 20
  })
  const appliedSearch = ref<Api.Logger.LogSearchParams>({ current: 1, size: 20 })

  const queryParams = computed(() => ({
    ...appliedSearch.value,
    current: searchForm.value.current,
    size: searchForm.value.size
  }))

  const listQuery = useLogListQuery(queryParams)
  const loading = computed(() => listQuery.isLoading.value)
  const data = computed(() => listQuery.data.value?.records ?? [])

  const total = computed(() => listQuery.data.value?.pager?.total ?? 0)

  const pagination = reactive({
    current: computed(() => searchForm.value.current),
    size: computed(() => searchForm.value.size),
    total
  })

  // 详情
  const detailVisible = ref(false)
  const selectedLogId = ref<number | undefined>()
  const detailQuery = useLogDetailQuery(selectedLogId, { enabled: computed(() => !!selectedLogId.value) })
  const detailData = computed(() => detailQuery.data.value)

  const searchItems = computed(() => [
    {
      label: '时间范围',
      key: 'daterange',
      type: 'datetime',
      props: {
        type: 'daterange',
        rangeSeparator: '至',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        valueFormat: 'YYYY-MM-DD',
        shortcuts: [
          { text: '今日', value: [new Date(), new Date()] },
          { text: '最近一周', value: [new Date(Date.now() - 604800000), new Date()] }
        ]
      }
    },
    { label: '创建人', key: 'createBy', type: 'input', props: { placeholder: '请输入创建人', clearable: true } },
    { label: '请求IP', key: 'ip', type: 'input', props: { placeholder: '请输入请求IP', clearable: true } }
  ])

  const { columns, columnChecks } = useTableColumns<ILog>(() => [
    { type: 'index', width: 60, label: '序号' },
    { prop: 'requestMethod', label: '请求方式', width: 90 },
    {
      prop: 'requestPath',
      label: '请求路径',
      minWidth: 180,
      showOverflowTooltip: true,
      formatter: (row: ILog) =>
        h(
          'code',
          { style: { fontFamily: 'monospace', fontSize: '12px' } },
          row.requestPath ?? ''
        )
    },
    { prop: 'requestIp', label: '请求IP', width: 140 },
    { prop: 'browser', label: '浏览器', minWidth: 120, showOverflowTooltip: true },
    { prop: 'os', label: '操作系统', width: 110, showOverflowTooltip: true },
    { prop: 'module', label: '操作模块', width: 100 },
    { prop: 'requestTime', label: '耗时(ms)', width: 90 },
    {
      prop: 'status',
      label: '状态',
      width: 60,
      formatter: (row: ILog) => {
        const ok = row.status === 200 || row.status === 0
        return h('span', { style: { color: ok ? '#67c23a' : '#f56c6c', fontWeight: 600 } }, String(row.status))
      }
    },
    { prop: 'createTime', label: '创建时间', width: 170 }
  ])

  function handleSearch(params: Record<string, unknown>) {
    const { daterange, ...rest } = params
    const search: Api.Logger.LogSearchParams = { ...rest } as any
    if (Array.isArray(daterange)) {
      search.startTime = daterange[0] as string
      search.endTime = daterange[1] as string
    }
    appliedSearch.value = search
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

  function handleRowClick(row: ILog) {
    selectedLogId.value = row.id
    detailVisible.value = true
  }
</script>
