<script setup lang="ts">
  import { ElButton, ElMessage, ElMessageBox, type UploadRequestOptions } from 'element-plus'
  import { blogApi } from '@/api/blog'
  import { useTableColumns } from '@/hooks/core/useTableColumns'

  const tags = ref<Api.Blog.Tag[]>([])
  const total = ref(0)
  const loading = ref(false)
  const dialogVisible = ref(false)
  const editingId = ref<number>()
  const form = reactive<Api.Blog.SaveTag>({ name: '', slug: '', color: null, icon: null })

  const params = reactive<Api.Blog.TagQuery>({ page: 1, pageSize: 20, keyword: '' })
  const searchFields = [{ prop: 'keyword', label: '标签名称', placeholder: '搜索标签名称或 Slug' }]
  const pagination = computed(() => ({
    current: params.page ?? 1,
    size: params.pageSize ?? 20,
    total: total.value
  }))

  const presetColors = [
    '#1662ff',
    '#2255e0',
    '#6366f1',
    '#8b5cf6',
    '#e81864',
    '#00b96b',
    '#f59e0b',
    '#14b8a6',
    '#616161',
    '#000000'
  ]

  const { columns, columnChecks } = useTableColumns<Api.Blog.Tag>(() => [
    {
      prop: 'name',
      label: '标签',
      minWidth: 220,
      formatter: (row) =>
        h(
          'span',
          {
            class: 'tag-pill',
            style: {
              color: row.color || 'var(--art-gray-700)',
              background: tagBg(row.color)
            }
          },
          [
            row.icon
              ? h('img', { class: 'tag-pill__icon', src: row.icon, alt: '' })
              : h('span', { class: 'tag-pill__icon tag-pill__icon--empty' }, row.name.slice(0, 1)),
            h('span', { class: 'tag-pill__name' }, row.name)
          ]
        )
    },
    {
      prop: 'slug',
      label: 'Slug',
      minWidth: 180,
      formatter: (row) => h('code', { class: 'tag-slug' }, row.slug)
    },
    {
      prop: 'color',
      label: '颜色',
      width: 150,
      formatter: (row) =>
        row.color
          ? h('span', { class: 'tag-color' }, [
              h('i', { class: 'tag-color__swatch', style: { background: row.color } }),
              h('code', { class: 'tag-color__hex' }, row.color)
            ])
          : h('span', { class: 'tag-muted' }, '—')
    },
    { prop: 'articleCount', label: '文章', width: 90, align: 'right' },
    {
      prop: 'operation',
      label: '操作',
      width: 140,
      fixed: 'right',
      formatter: (row) => [
        h(ElButton, { link: true, type: 'primary', onClick: () => open(row) }, () => '编辑'),
        h(ElButton, { link: true, type: 'danger', onClick: () => remove(row) }, () => '删除')
      ]
    }
  ])

  async function load() {
    loading.value = true
    try {
      const data = await blogApi.listTags(params)
      tags.value = data.items ?? []
      total.value = data.total ?? 0
    } finally {
      loading.value = false
    }
  }

  function open(item?: unknown) {
    const tag = item as Api.Blog.Tag | undefined
    editingId.value = tag?.id
    Object.assign(
      form,
      tag
        ? {
            name: tag.name,
            slug: tag.slug,
            color: tag.color ?? null,
            icon: tag.icon ?? null
          }
        : { name: '', slug: '', color: null, icon: null }
    )
    dialogVisible.value = true
  }

  async function save() {
    if (!form.name.trim() || !form.slug.trim()) return ElMessage.warning('请填写名称和 Slug')
    const payload: Api.Blog.SaveTag = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      color: form.color || null,
      icon: form.icon || null
    }
    if (editingId.value) await blogApi.updateTag(editingId.value, payload)
    else await blogApi.createTag(payload)
    dialogVisible.value = false
    await load()
    ElMessage.success('标签已保存')
  }

  async function remove(item: unknown) {
    const tag = item as Api.Blog.Tag
    await ElMessageBox.confirm(`确认删除标签「${tag.name}」？`, '删除标签', { type: 'warning' })
    await blogApi.deleteTag(tag.id)
    await load()
    ElMessage.success('标签已删除')
  }

  async function uploadIcon(options: UploadRequestOptions) {
    try {
      const { url } = await blogApi.upload(options.file)
      form.icon = url
    } catch {
      ElMessage.error('图标上传失败')
    }
  }

  function search() {
    params.page = 1
    load()
  }

  function reset() {
    params.keyword = ''
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

  /** 根据标签颜色生成浅色底，无颜色时回退灰色 */
  function tagBg(color: string | null | undefined) {
    return color
      ? `color-mix(in srgb, ${color} 12%, var(--default-box-color))`
      : 'var(--art-gray-200)'
  }

  onMounted(load)
</script>

<template>
  <div class="tag-page art-full-height">
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
          <ElButton type="primary" @click="open()">
            <ArtSvgIcon icon="ri:add-line" />新建标签
          </ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="tags"
        :columns="columns"
        :pagination="pagination"
        :pagination-options="{ layout: 'total, prev, pager, next' }"
        row-key="id"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="editingId ? '编辑标签' : '新建标签'" width="480px">
      <ElForm label-position="top">
        <ElFormItem label="名称">
          <ElInput v-model="form.name" placeholder="例如：Node.js" maxlength="50" />
        </ElFormItem>
        <ElFormItem label="Slug">
          <ElInput v-model="form.slug" placeholder="例如：node-js" maxlength="50" />
        </ElFormItem>

        <div class="tag-dialog__row">
          <ElFormItem label="颜色" class="tag-dialog__color">
            <div class="tag-color-field">
              <ElColorPicker v-model="form.color" :predefine="presetColors" />
              <span v-if="form.color" class="tag-color-field__hex">{{ form.color }}</span>
              <ElButton v-if="form.color" link type="danger" @click="form.color = null">
                清除
              </ElButton>
            </div>
          </ElFormItem>
        </div>

        <ElFormItem label="图标">
          <div class="tag-icon-field">
            <div class="tag-icon-field__preview">
              <img v-if="form.icon" :src="form.icon" alt="" />
              <ArtSvgIcon v-else icon="ri:image-line" />
            </div>
            <ElUpload :show-file-list="false" accept="image/*" :http-request="uploadIcon">
              <ElButton size="small">{{ form.icon ? '更换图标' : '上传图标' }}</ElButton>
            </ElUpload>
            <ElButton v-if="form.icon" size="small" link type="danger" @click="form.icon = null">
              移除
            </ElButton>
          </div>
        </ElFormItem>

        <div class="tag-dialog__preview">
          <span class="tag-dialog__preview-label">预览</span>
          <span
            class="tag-pill"
            :style="{
              color: form.color || 'var(--art-gray-700)',
              background: tagBg(form.color)
            }"
          >
            <img v-if="form.icon" :src="form.icon" class="tag-pill__icon" alt="" />
            <span v-else class="tag-pill__icon tag-pill__icon--empty">{{
              form.name ? form.name.slice(0, 1) : 'T'
            }}</span>
            <span class="tag-pill__name">{{ form.name || '标签名称' }}</span>
          </span>
        </div>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="save">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
  .tag-page {
    display: flex;
    flex-direction: column;
  }

  .tag-page :deep(.art-table-card .el-card__header) {
    padding: 12px 16px;
    border-bottom: 0;
  }

  .tag-page :deep(.art-table-card .el-card__body) {
    padding: 12px 16px 16px;
  }

  /* 表格单元格（formatter 渲染在 ArtTable 内部，需用 :deep） */
  .tag-page :deep(.tag-pill) {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    height: 30px;
    padding: 0 10px;
    border-radius: 999px;
  }

  .tag-page :deep(.tag-pill__icon) {
    width: 18px;
    height: 18px;
    object-fit: cover;
    border-radius: 50%;
  }

  .tag-page :deep(.tag-pill__icon--empty) {
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 600;
    background: rgb(255 255 255 / 60%);
  }

  .tag-page :deep(.tag-pill__name) {
    font-weight: 500;
  }

  .tag-page :deep(.tag-slug) {
    padding: 2px 6px;
    font-family: var(--art-font-family-code, ui-monospace, SFMono-Regular, Menlo, monospace);
    font-size: 12px;
    color: var(--art-gray-600);
    background: var(--default-bg-color);
    border-radius: 4px;
  }

  .tag-page :deep(.tag-color) {
    display: inline-flex;
    gap: 8px;
    align-items: center;
  }

  .tag-page :deep(.tag-color__swatch) {
    width: 16px;
    height: 16px;
    border: 1px solid var(--default-border);
    border-radius: 4px;
  }

  .tag-page :deep(.tag-color__hex) {
    font-size: 12px;
    color: var(--art-gray-600);
    text-transform: uppercase;
  }

  .tag-page :deep(.tag-muted) {
    color: var(--art-gray-500);
  }

  /* 弹窗布局 */
  .tag-dialog__row {
    display: flex;
    gap: 16px;
  }

  .tag-color-field {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .tag-color-field__hex {
    font-family: var(--art-font-family-code, ui-monospace, SFMono-Regular, Menlo, monospace);
    font-size: 12px;
    color: var(--art-gray-600);
    text-transform: uppercase;
  }

  .tag-icon-field {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .tag-icon-field__preview {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    overflow: hidden;
    color: var(--art-gray-400);
    background: var(--default-bg-color);
    border: 1px dashed var(--default-border);
    border-radius: 8px;
  }

  .tag-icon-field__preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .tag-icon-field__preview :deep(.art-svg-icon) {
    font-size: 22px;
  }

  .tag-dialog__preview {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px;
    background: var(--default-bg-color);
    border: 1px dashed var(--default-border);
    border-radius: 8px;
  }

  .tag-dialog__preview-label {
    font-size: 12px;
    color: var(--art-gray-500);
  }
</style>
