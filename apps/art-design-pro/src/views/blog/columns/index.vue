<script setup lang="ts">
  import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import { blogApi } from '@/api/blog'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import ColumnCreateModal from './ColumnCreateModal.vue'
  import ColumnEditModal from './ColumnEditModal.vue'

  const columns_ = ref<Api.Blog.Column[]>([])
  const total = ref(0)
  const loading = ref(false)

  const params = reactive<Api.Blog.ColumnQuery>({
    page: 1,
    pageSize: 20,
    keyword: '',
    status: undefined
  })
  const searchFields = [
    { prop: 'keyword', label: '专栏名称', placeholder: '搜索专栏名称' },
    {
      prop: 'status',
      label: '状态',
      type: 'select' as const,
      placeholder: '全部状态',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已发布', value: 'published' }
      ]
    }
  ]
  const pagination = computed(() => ({
    current: params.page ?? 1,
    size: params.pageSize ?? 20,
    total: total.value
  }))

  const { columns, columnChecks } = useTableColumns<Api.Blog.Column>(() => [
    {
      prop: 'name',
      label: '专栏',
      minWidth: 240,
      formatter: (row) =>
        h('div', { class: 'column-name' }, [
          row.cover
            ? h('img', { class: 'column-name__cover', src: row.cover, alt: '' })
            : h(
                'span',
                { class: 'column-name__cover column-name__cover--empty' },
                row.name.slice(0, 1)
              ),
          h('span', { class: 'column-name__text' }, row.name)
        ])
    },
    {
      prop: 'description',
      label: '简介',
      minWidth: 240,
      showOverflowTooltip: true,
      formatter: (row) => row.description || '—'
    },
    {
      prop: 'status',
      label: '状态',
      width: 100,
      formatter: (row) =>
        h(ElTag, { type: row.status === 'published' ? 'primary' : 'info' }, () =>
          row.status === 'published' ? '已发布' : '草稿'
        )
    },
    { prop: 'articleCount', label: '文章', width: 80, align: 'right' },
    { prop: 'sort', label: '排序', width: 80, align: 'right' },
    {
      prop: 'operation',
      label: '操作',
      width: 140,
      fixed: 'right',
      formatter: (row) => [
        h(ElButton, { link: true, type: 'primary', onClick: () => edit(row) }, () => '编辑'),
        h(ElButton, { link: true, type: 'danger', onClick: () => remove(row) }, () => '删除')
      ]
    }
  ])

  const dialogVisible = ref(false)
  const editVisible = ref(false)
  const editingId = ref<number | null>(null)

  async function load() {
    loading.value = true
    try {
      const data = await blogApi.listColumns(params)
      columns_.value = data.items ?? []
      total.value = data.total ?? 0
    } finally {
      loading.value = false
    }
  }

  function openCreate() {
    dialogVisible.value = true
  }

  function edit(item: unknown) {
    const col = item as Api.Blog.Column
    editingId.value = col.id
    editVisible.value = true
  }

  async function remove(item: unknown) {
    const col = item as Api.Blog.Column
    await ElMessageBox.confirm(
      `确认删除专栏「${col.name}」？删除后专栏内文章不会被删除。`,
      '删除专栏',
      {
        type: 'warning'
      }
    )
    await blogApi.deleteColumn(col.id)
    await load()
    ElMessage.success('专栏已删除')
  }

  function search() {
    params.page = 1
    load()
  }

  function reset() {
    params.keyword = ''
    params.status = undefined
    params.page = 1
    load()
  }

  function handleSizeChange(size: number) {
    params.pageSize = size
    params.page = 1
    load()
  }

  function handleCurrentChange(page: number) {
    params.page = page
    load()
  }

  onMounted(load)
</script>

<template>
  <div class="column-page art-full-height">
    <SearchTable
      v-model:query="params"
      :query-source="searchFields"
      :loading="loading"
      @search="search"
      @reset="reset"
    />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="load">
        <template #left>
          <ElButton type="primary" @click="openCreate">
            <ArtSvgIcon icon="ri:add-line" />新建专栏
          </ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="columns_"
        :columns="columns"
        :pagination="pagination"
        :pagination-options="{ layout: 'total, prev, pager, next' }"
        row-key="id"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <ColumnCreateModal v-model:visible="dialogVisible" @success="load" />
    <ColumnEditModal v-model:visible="editVisible" :column-id="editingId" @success="load" />
  </div>
</template>

<style scoped>
  .column-page {
    display: flex;
    flex-direction: column;
  }

  .column-page :deep(.art-table-card .el-card__header) {
    padding: 12px 16px;
    border-bottom: 0;
  }

  .column-page :deep(.art-table-card .el-card__body) {
    padding: 12px 16px 16px;
  }

  .column-page :deep(.column-name) {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  .column-page :deep(.column-name__cover) {
    flex: 0 0 auto;
    width: 46px;
    height: 34px;
    object-fit: cover;
    background: var(--default-bg-color);
    border: 1px solid var(--default-border);
    border-radius: 4px;
  }

  .column-page :deep(.column-name__cover--empty) {
    display: grid;
    place-items: center;
    font-size: 15px;
    font-weight: 600;
    color: var(--art-gray-500);
  }

  .column-page :deep(.column-name__text) {
    overflow: hidden;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
