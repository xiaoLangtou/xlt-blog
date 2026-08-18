<script setup lang="ts">
  import {
    ElButton,
    ElMessage,
    ElMessageBox,
    type UploadInstance,
    type UploadProgressEvent,
    type UploadRequestOptions
  } from 'element-plus'
  import { watchDebounced } from '@vueuse/core'
  import { blogApi } from '@/api/blog'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'

  const query = reactive<Api.Blog.AttachmentQuery>({
    page: 1,
    pageSize: 24,
    keyword: '',
    category: 'all',
    sort: 'date'
  })
  const attachments = ref<Api.Blog.Attachment[]>([])
  const total = ref(0)
  const loading = ref(false)
  const viewMode = ref<'grid' | 'list'>('grid')
  const uploadDialogVisible = ref(false)
  const detailVisible = ref(false)
  const detailItem = ref<Api.Blog.Attachment | null>(null)
  const uploadRef = useTemplateRef<UploadInstance>('uploadRef')

  const stats = ref<Api.Blog.AttachmentStats>({
    total: 0,
    totalSize: 0,
    todayCount: 0,
    imageRatio: 0,
    categoryCounts: { image: 0, video: 0, audio: 0, doc: 0, archive: 0, other: 0 }
  })

  const categories: Array<{
    key: Api.Blog.AttachmentCategory | 'all'
    label: string
    color: string
    code: string
  }> = [
    { key: 'all', label: '全部', color: '', code: '' },
    { key: 'image', label: '图片', color: '#10b981', code: 'IMG' },
    { key: 'video', label: '视频', color: '#8b5cf6', code: 'VID' },
    { key: 'audio', label: '音频', color: '#f59e0b', code: 'AUD' },
    { key: 'doc', label: '文档', color: '#f97316', code: 'DOC' },
    { key: 'archive', label: '压缩包', color: '#64748b', code: 'ZIP' },
    { key: 'other', label: '其他', color: '#ec4899', code: 'OTH' }
  ]

  const categoryCount = (key: Api.Blog.AttachmentCategory | 'all') =>
    key === 'all' ? stats.value.total : (stats.value.categoryCounts[key] ?? 0)

  const docRatio = computed(() =>
    stats.value.total ? Math.round((stats.value.categoryCounts.doc / stats.value.total) * 100) : 0
  )
  const videoRatio = computed(() =>
    stats.value.total ? Math.round((stats.value.categoryCounts.video / stats.value.total) * 100) : 0
  )

  const assetUrl = (url: string) => (url.startsWith('/') ? url : `/${url}`)

  function fileCategory(mimeType: string): Api.Blog.AttachmentCategory {
    const mt = (mimeType || '').toLowerCase()
    if (mt.startsWith('image/')) return 'image'
    if (mt.startsWith('video/')) return 'video'
    if (mt.startsWith('audio/')) return 'audio'
    if (
      mt.startsWith('text/') ||
      mt.startsWith('application/pdf') ||
      mt.startsWith('application/msword') ||
      mt.includes('document') ||
      mt.includes('sheet') ||
      mt.includes('presentation')
    ) {
      return 'doc'
    }
    if (
      mt.includes('zip') ||
      mt.includes('rar') ||
      mt.includes('7z') ||
      mt.includes('tar') ||
      mt.includes('gzip')
    ) {
      return 'archive'
    }
    return 'other'
  }

  function fileIcon(category: Api.Blog.AttachmentCategory): string {
    const map: Record<Api.Blog.AttachmentCategory, string> = {
      image: 'ri:image-line',
      video: 'ri:video-line',
      audio: 'ri:music-2-line',
      doc: 'ri:file-text-line',
      archive: 'ri:file-zip-line',
      other: 'ri:file-3-line'
    }
    return map[category]
  }

  function categoryMeta(category: Api.Blog.AttachmentCategory) {
    return categories.find((c) => c.key === category)!
  }

  async function load() {
    loading.value = true
    try {
      const data = await blogApi.listAttachments(query)
      attachments.value = data.items ?? []
      total.value = data.total ?? 0
    } finally {
      loading.value = false
    }
  }

  async function loadStats() {
    stats.value = await blogApi.getAttachmentStats()
  }

  function selectCategory(key: Api.Blog.AttachmentCategory | 'all') {
    query.category = key
    query.page = 1
    load()
  }

  function onSortChange() {
    query.page = 1
    load()
  }

  watchDebounced(
    () => query.keyword,
    () => {
      query.page = 1
      load()
    },
    { debounce: 300 }
  )

  async function uploadFile(options: UploadRequestOptions) {
    try {
      const result = await blogApi.upload(options.file, (percent) => {
        options.onProgress({ percent } as UploadProgressEvent)
      })
      options.onSuccess(result)
      ElMessage.success(`「${options.file.name}」已上传`)
    } catch (error) {
      options.onError(error as never)
      ElMessage.error(`「${options.file.name}」上传失败`)
    }
  }

  function onUploadSuccess() {
    query.page = 1
    load()
    loadStats()
  }

  function closeUploadDialog() {
    uploadDialogVisible.value = false
    uploadRef.value?.clearFiles()
  }

  async function remove(item: Api.Blog.Attachment) {
    await ElMessageBox.confirm(`确认删除「${item.filename}」？`, '删除文件', { type: 'warning' })
    await blogApi.deleteAttachment(item.id)
    ElMessage.success('文件已删除')
    await Promise.all([load(), loadStats()])
  }

  function openDetail(item: Api.Blog.Attachment) {
    detailItem.value = item
    detailVisible.value = true
  }

  async function copyLink(item: Api.Blog.Attachment) {
    try {
      await navigator.clipboard.writeText(new URL(assetUrl(item.url), window.location.origin).href)
      ElMessage.success('链接已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败')
    }
  }

  function insertArticle() {
    ElMessage.info('已插入到当前文章')
    detailVisible.value = false
  }

  async function removeFromDetail() {
    if (!detailItem.value) return
    await remove(detailItem.value)
    detailVisible.value = false
  }

  function formatSize(size: number) {
    if (size >= 1024 * 1024 * 1024) return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
    if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
    return `${Math.ceil(size / 1024)} KB`
  }

  function formatDate(value: string) {
    const d = new Date(value)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const pagination = computed(() => ({
    current: query.page ?? 1,
    size: query.pageSize ?? 24,
    total: total.value
  }))

  const { columns, columnChecks } = useTableColumns<Api.Blog.Attachment>(() => [
    {
      prop: 'filename',
      label: '文件名',
      minWidth: 260,
      formatter: (row) =>
        h('div', { class: 'media-name-cell' }, [
          fileCategory(row.mimeType) === 'image'
            ? h('img', { class: 'media-name-thumb', src: assetUrl(row.url), alt: '' })
            : h(
                'span',
                {
                  class: 'media-name-thumb media-name-thumb--icon',
                  style: {
                    color: categoryMeta(fileCategory(row.mimeType)).color,
                    background: `${categoryMeta(fileCategory(row.mimeType)).color}12`
                  }
                },
                [h(ArtSvgIcon, { icon: fileIcon(fileCategory(row.mimeType)) })]
              ),
          h('span', { class: 'media-name-text' }, row.filename)
        ])
    },
    {
      prop: 'category',
      label: '类型',
      width: 110,
      formatter: (row) => categoryMeta(fileCategory(row.mimeType)).label
    },
    { prop: 'size', label: '大小', width: 100, formatter: (row) => formatSize(row.size) },
    {
      prop: 'createdAt',
      label: '上传时间',
      width: 150,
      formatter: (row) => formatDate(row.createdAt)
    },
    {
      prop: 'operation',
      label: '操作',
      width: 180,
      fixed: 'right',
      formatter: (row) => [
        h(ElButton, { link: true, type: 'primary', onClick: () => openDetail(row) }, () => '详情'),
        h(ElButton, { link: true, onClick: () => copyLink(row) }, () => '复制链接'),
        h(ElButton, { link: true, type: 'danger', onClick: () => remove(row) }, () => '删除')
      ]
    }
  ])

  function handleSizeChange(size: number) {
    query.pageSize = size
    query.page = 1
    load()
  }

  function handleCurrentChange(page: number) {
    query.page = page
    load()
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && detailVisible.value) detailVisible.value = false
  }

  onMounted(() => {
    document.addEventListener('keydown', onKeydown)
    load()
    loadStats()
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown)
  })
</script>

<template>
  <div class="media-page">
    <!-- 统计卡片 -->
    <div class="stats">
      <div class="stat-card">
        <div class="stat-icon" style="background: #eff6ff; color: #2563eb">
          <ArtSvgIcon icon="ri:file-3-line" />
        </div>
        <div class="stat-body">
          <div class="stat-label">文件总数</div>
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-delta">图片 {{ stats.categoryCounts.image }} 张</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #f0fdf4; color: #16a34a">
          <ArtSvgIcon icon="ri:database-2-line" />
        </div>
        <div class="stat-body">
          <div class="stat-label">占用空间</div>
          <div class="stat-value">{{ formatSize(stats.totalSize) }}</div>
          <div class="stat-delta dim">已用存储</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #fff7ed; color: #ea580c">
          <ArtSvgIcon icon="ri:upload-cloud-2-line" />
        </div>
        <div class="stat-body">
          <div class="stat-label">今日上传</div>
          <div class="stat-value">{{ stats.todayCount }}</div>
          <div class="stat-delta dim">今日新增</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #fdf4ff; color: #a21caf">
          <ArtSvgIcon icon="ri:image-line" />
        </div>
        <div class="stat-body">
          <div class="stat-label">图片占比</div>
          <div class="stat-value">{{ stats.imageRatio }}%</div>
          <div class="stat-delta dim">文档 {{ docRatio }}% · 视频 {{ videoRatio }}%</div>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="chips">
        <ElCheckTag
          v-for="cat in categories"
          :key="cat.key"
          :checked="query.category === cat.key"
          @change="selectCategory(cat.key)"
        >
          <span v-if="cat.color" class="chip-dot" :style="{ background: cat.color }" />
          {{ cat.label }}
          <span class="chip-count">{{ categoryCount(cat.key) }}</span>
        </ElCheckTag>
      </div>

      <div class="toolbar-right">
        <ElInput v-model="query.keyword" class="search-input" placeholder="搜索文件名" clearable>
          <template #prefix><ArtSvgIcon icon="ri:search-line" /></template>
        </ElInput>
        <ElSelect v-model="query.sort" class="sort-select" @change="onSortChange">
          <ElOption label="按上传时间" value="date" />
          <ElOption label="按文件名" value="name" />
          <ElOption label="按大小" value="size" />
        </ElSelect>
      </div>
    </div>

    <!-- 内容 -->
    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="load">
        <template #left>
          <ElButton type="primary" @click="uploadDialogVisible = true">
            <ArtSvgIcon icon="ri:upload-2-line" />上传文件
          </ElButton>
        </template>
        <template #right>
          <div class="view-mode-toggle" role="tablist" aria-label="视图切换">
            <button
              type="button"
              class="view-mode-toggle__btn"
              :class="{ 'is-active': viewMode === 'grid' }"
              @click="viewMode = 'grid'"
            >
              <ArtSvgIcon icon="ri:layout-grid-line" />网格
            </button>
            <button
              type="button"
              class="view-mode-toggle__btn"
              :class="{ 'is-active': viewMode === 'list' }"
              @click="viewMode = 'list'"
            >
              <ArtSvgIcon icon="ri:list-unordered" />列表
            </button>
          </div>
        </template>
      </ArtTableHeader>

      <ArtTable
        v-if="viewMode === 'list'"
        :loading="loading"
        :data="attachments"
        :columns="columns"
        :pagination="pagination"
        :pagination-options="{ layout: 'total, prev, pager, next' }"
        row-key="id"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />

      <div v-else v-loading="loading" class="media-card-list mt-4">
        <div v-if="attachments.length" class="media-card-grid">
          <article
            v-for="item in attachments"
            :key="item.id"
            class="media-card"
            @click="openDetail(item)"
          >
            <div class="media-card__cover">
              <img
                v-if="fileCategory(item.mimeType) === 'image'"
                :src="assetUrl(item.url)"
                :alt="item.filename"
              />
              <div
                v-else
                class="media-card__cover-placeholder"
                :style="`color:${categoryMeta(fileCategory(item.mimeType)).color};background:${categoryMeta(fileCategory(item.mimeType)).color}12`"
              >
                <ArtSvgIcon :icon="fileIcon(fileCategory(item.mimeType))" />
              </div>
              <span
                class="media-card__badge"
                :style="{ background: categoryMeta(fileCategory(item.mimeType)).color }"
              >
                {{ categoryMeta(fileCategory(item.mimeType)).code }}
              </span>
            </div>
            <div class="media-card__body">
              <h3 class="media-card__title" :title="item.filename" @click="openDetail(item)">
                {{ item.filename }}
              </h3>
              <div class="media-card__meta">
                <span>{{ formatSize(item.size) }}</span>
                <span>{{ formatDate(item.createdAt) }}</span>
              </div>
              <div class="media-card__actions">
                <ElButton size="small" class="media-card__action" @click.stop="copyLink(item)"
                  >复制链接</ElButton
                >
                <ElButton
                  size="small"
                  class="media-card__action media-card__action--danger"
                  @click.stop="remove(item)"
                  >删除</ElButton
                >
              </div>
            </div>
          </article>
        </div>
        <ElEmpty v-else description="未找到匹配文件" />
        <div class="media-card-pagination">
          <ElPagination
            :current-page="pagination.current"
            :page-size="pagination.size"
            :total="pagination.total"
            layout="total, prev, pager, next"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </ElCard>

    <!-- 上传弹窗 -->
    <ElDialog
      v-model="uploadDialogVisible"
      title="上传文件"
      width="520px"
      @closed="uploadRef?.clearFiles()"
    >
      <ElUpload
        ref="uploadRef"
        drag
        :show-file-list="true"
        :http-request="uploadFile"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.tar,.gz"
        @success="onUploadSuccess"
      >
        <ArtSvgIcon icon="ri:upload-cloud-2-line" class="upload-icon" />
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      </ElUpload>
      <template #footer>
        <ElButton @click="closeUploadDialog">完成</ElButton>
      </template>
    </ElDialog>

    <!-- 文件详情 -->
    <Teleport to="body">
      <div v-if="detailVisible" class="detail-overlay" @click.self="detailVisible = false">
        <div class="detail-panel">
          <div class="panel-header">
            <h2>文件详情</h2>
            <button
              class="panel-close"
              type="button"
              aria-label="关闭"
              @click="detailVisible = false"
            >
              ✕
            </button>
          </div>

          <div v-if="detailItem" class="detail-body">
            <div class="detail-preview">
              <img
                v-if="fileCategory(detailItem.mimeType) === 'image'"
                :src="assetUrl(detailItem.url)"
                alt=""
              />
              <div
                v-else
                class="icon-wrap-lg"
                :style="`background:${categoryMeta(fileCategory(detailItem.mimeType)).color}15;color:${categoryMeta(fileCategory(detailItem.mimeType)).color}`"
              >
                <ArtSvgIcon :icon="fileIcon(fileCategory(detailItem.mimeType))" />
              </div>
            </div>

            <div class="detail-meta">
              <div class="field">
                <label>文件名</label>
                <div class="value">{{ detailItem.filename }}</div>
              </div>
              <div class="field">
                <label>文件类型</label>
                <div class="value">
                  {{ categoryMeta(fileCategory(detailItem.mimeType)).label }} ({{
                    fileCategory(detailItem.mimeType)
                  }})
                </div>
              </div>
              <div class="field">
                <label>文件大小</label>
                <div class="value">{{ formatSize(detailItem.size) }}</div>
              </div>
              <div class="field">
                <label>上传时间</label>
                <div class="value">{{ formatDate(detailItem.createdAt) }}</div>
              </div>
              <div class="field">
                <label>文件地址</label>
                <div class="value url-link" @click="copyLink(detailItem)">
                  {{ assetUrl(detailItem.url) }}
                </div>
              </div>
            </div>
          </div>

          <div class="panel-footer">
            <button type="button" class="btn btn-danger-ghost" @click="removeFromDetail">
              删除
            </button>
            <button type="button" class="btn btn-ghost" @click="detailItem && copyLink(detailItem)">
              复制链接
            </button>
            <button type="button" class="btn btn-primary" @click="insertArticle">插入文章</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>

  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }

  .stat-card {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 16px 18px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
  }

  .stat-icon :deep(.art-svg-icon) {
    font-size: 19px;
  }

  .stat-body .stat-label {
    margin-bottom: 3px;
    font-size: 14px;
    color: #6b7280;
  }

  .stat-body .stat-value {
    font-size: 16px;
    font-weight: 700;
    line-height: 1.2;
    color: #1f2937;
  }

  .stat-body .stat-delta {
    margin-top: 5px;
    font-size: 14px;
    color: #10b981;
  }

  .stat-body .stat-delta.dim {
    color: #9ca3af;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    margin-bottom: 16px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chips :deep(.el-check-tag) {
    font-size: 14px;
  }

  .chip-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    margin-right: 4px;
    border-radius: 50%;
  }

  .chip-count {
    margin-left: 4px;
    font-size: 14px;
    color: #9ca3af;
  }

  .toolbar-right {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .search-input {
    width: 180px;
  }

  .sort-select {
    width: 130px;
  }

  .view-mode-toggle {
    display: inline-flex;
    padding: 3px;
    background: var(--default-bg-color);
    border: 1px solid var(--default-border);
    border-radius: 7px;
  }

  .view-mode-toggle__btn {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    height: 30px;
    padding: 0 12px;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: var(--art-gray-600);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .view-mode-toggle__btn :deep(.art-svg-icon) {
    font-size: 15px;
  }

  .view-mode-toggle__btn.is-active {
    background: var(--default-box-color);
    color: var(--theme-color);
    box-shadow: 0 1px 2px rgb(16 24 40 / 6%);
  }

  /* 表格单元格（formatter 渲染在 ArtTable 内部，需用 :deep） */
  .media-page :deep(.media-name-cell) {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  .media-page :deep(.media-name-thumb) {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    object-fit: cover;
    background: var(--default-bg-color);
    border: 1px solid var(--default-border);
    border-radius: 6px;
  }

  .media-page :deep(.media-name-thumb--icon) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .media-page :deep(.media-name-thumb--icon .art-svg-icon) {
    font-size: 20px;
  }

  .media-page :deep(.media-name-text) {
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 卡片视图 */
  .media-card-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .media-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .media-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    cursor: pointer;
    background: var(--default-box-color);
    border: 1px solid var(--default-border);
    border-radius: 8px;
    box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
    transition:
      transform 0.16s ease,
      box-shadow 0.16s ease;
  }

  .media-card:hover {
    box-shadow: 0 8px 20px rgb(0 0 0 / 10%);
    transform: translateY(-2px);
  }

  .media-card__cover {
    position: relative;
    height: 150px;
    background: var(--default-bg-color);
  }

  .media-card__cover img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .media-card__cover-placeholder {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
  }

  .media-card__cover-placeholder :deep(.art-svg-icon) {
    font-size: 40px;
  }

  .media-card__badge {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 3px 8px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.3px;
    color: #fff;
    border-radius: 5px;
  }

  .media-card__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 14px 16px 16px;
  }

  .media-card__title {
    margin: 0;
    overflow: hidden;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--art-gray-900);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .media-card__title:hover {
    color: var(--theme-color);
  }

  .media-card__meta {
    display: flex;
    gap: 8px 14px;
    align-items: center;
    margin-top: 12px;
    font-size: 14px;
    color: var(--art-gray-500);
  }

  .media-card__actions {
    display: flex;
    gap: 8px;
    align-items: center;
    padding-top: 12px;
    margin-top: auto;
    border-top: 1px solid var(--default-border);
  }

  .media-card__action {
    font-size: 14px;
    --el-button-bg-color: color-mix(in srgb, var(--theme-color) 10%, transparent);
    --el-button-text-color: var(--theme-color);
    --el-button-border-color: transparent;
    --el-button-hover-bg-color: color-mix(in srgb, var(--theme-color) 16%, transparent);
    --el-button-hover-text-color: var(--theme-color);
    --el-button-hover-border-color: transparent;
    --el-button-active-bg-color: color-mix(in srgb, var(--theme-color) 20%, transparent);
    --el-button-active-text-color: var(--theme-color);
    --el-button-active-border-color: transparent;
  }

  .media-card__action--danger {
    margin-left: auto;
    --el-button-bg-color: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
    --el-button-text-color: var(--el-color-danger);
    --el-button-border-color: transparent;
    --el-button-hover-bg-color: color-mix(in srgb, var(--el-color-danger) 16%, transparent);
    --el-button-hover-text-color: var(--el-color-danger);
    --el-button-hover-border-color: transparent;
    --el-button-active-bg-color: color-mix(in srgb, var(--el-color-danger) 20%, transparent);
    --el-button-active-text-color: var(--el-color-danger);
    --el-button-active-border-color: transparent;
  }

  .media-card-pagination {
    display: flex;
    justify-content: flex-end;
  }

  .upload-icon {
    margin-bottom: 12px;
    font-size: 56px;
    color: #9ca3af;
  }

  /* ===== 文件详情弹窗 ===== */
  .detail-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(0 0 0 / 45%);
    backdrop-filter: blur(4px);
  }

  .detail-panel {
    width: 620px;
    max-width: 92vw;
    max-height: 80vh;
    overflow-y: auto;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    box-shadow: 0 24px 60px rgb(0 0 0 / 20%);
    animation: panel-up 0.3s ease;
  }

  @keyframes panel-up {
    from {
      opacity: 0;
      transform: translateY(16px) scale(0.97);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 22px;
    border-bottom: 1px solid #e5e7eb;
  }

  .panel-header h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }

  .panel-close {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #9ca3af;
    cursor: pointer;
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    transition: all 0.15s;
  }

  .panel-close:hover {
    color: #1f2937;
    background: #f3f4f6;
  }

  .detail-body {
    display: flex;
    gap: 22px;
    padding: 22px;
  }

  .detail-preview {
    width: 240px;
    min-width: 240px;
    aspect-ratio: 4 / 3;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #f3f4f6;
    border-radius: 10px;
  }

  .detail-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .detail-preview .icon-wrap-lg {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
  }

  .detail-preview .icon-wrap-lg :deep(.art-svg-icon) {
    font-size: 28px;
  }

  .detail-meta {
    flex: 1;
    min-width: 0;
  }

  .field {
    margin-bottom: 14px;
  }

  .field:last-child {
    margin-bottom: 0;
  }

  .field label {
    display: block;
    margin-bottom: 4px;
    font-size: 14px;
    font-weight: 600;
    color: #9ca3af;
  }

  .field .value {
    font-size: 14px;
    line-height: 1.5;
    color: #1f2937;
    font-family: 'Courier New', monospace;
    word-break: break-all;
  }

  .field .value.url-link {
    color: #2563eb;
    cursor: pointer;
  }

  .field .value.url-link:hover {
    text-decoration: underline;
  }

  .panel-footer {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: flex-end;
    padding: 14px 22px;
    border-top: 1px solid #e5e7eb;
  }

  .btn {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    justify-content: center;
    padding: 9px 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 8px;
    transition: all 0.15s;
  }

  .btn-primary {
    color: #fff;
    background: #2563eb;
  }

  .btn-primary:hover {
    background: #1d4ed8;
  }

  .btn-ghost {
    color: #6b7280;
    background: transparent;
    border-color: #e5e7eb;
  }

  .btn-ghost:hover {
    color: #1f2937;
    background: #f3f4f6;
  }

  .btn-danger-ghost {
    color: #ef4444;
    background: transparent;
    border-color: #e5e7eb;
  }

  .btn-danger-ghost:hover {
    background: #fef2f2;
    border-color: #ef4444;
  }

  @media (max-width: 960px) {
    .stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .detail-body {
      flex-direction: column;
    }

    .detail-preview {
      width: 100%;
      min-width: 0;
    }
  }
</style>
