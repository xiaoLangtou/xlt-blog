<script lang="ts" setup>
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
  import FilePreview from '@/components/blog/FilePreview.vue'

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
  const previewMode = ref<'info' | 'preview'>('info')

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
    // 默认显示预览
    previewMode.value = canPreview(item.mimeType) ? 'preview' : 'info'
  }

  // 判断是否可以预览
  function canPreview(mimeType: string): boolean {
    const mt = (mimeType || '').toLowerCase()
    return (
      mt.includes('pdf') ||
      mt.includes('word') ||
      mt.includes('document') ||
      mt.includes('sheet') ||
      mt.includes('excel') ||
      mt.includes('presentation') ||
      mt.includes('powerpoint') ||
      mt.includes('image/') ||
      mt.includes('video/') ||
      mt.includes('audio/') ||
      mt.includes('text/') ||
      mt.includes('json') ||
      mt.includes('markdown') ||
      mt.includes('html')
    )
  }

  async function copyLink(item: Api.Blog.Attachment) {
    try {
      await navigator.clipboard.writeText(new URL(assetUrl(item.url), window.location.origin).href)
      ElMessage.success('链接已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败')
    }
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
          <span v-if="cat.color" :style="{ background: cat.color }" class="chip-dot" />
          {{ cat.label }}
          <span class="chip-count">{{ categoryCount(cat.key) }}</span>
        </ElCheckTag>
      </div>

      <div class="toolbar-right">
        <ElInput v-model="query.keyword" class="search-input" clearable placeholder="搜索文件名">
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
          <div aria-label="视图切换" class="view-mode-toggle" role="tablist">
            <button
              :class="{ 'is-active': viewMode === 'grid' }"
              class="view-mode-toggle__btn"
              type="button"
              @click="viewMode = 'grid'"
            >
              <ArtSvgIcon icon="ri:layout-grid-line" />网格
            </button>
            <button
              :class="{ 'is-active': viewMode === 'list' }"
              class="view-mode-toggle__btn"
              type="button"
              @click="viewMode = 'list'"
            >
              <ArtSvgIcon icon="ri:list-unordered" />列表
            </button>
          </div>
        </template>
      </ArtTableHeader>

      <ArtTable
        v-if="viewMode === 'list'"
        :columns="columns"
        :data="attachments"
        :loading="loading"
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
                :alt="item.filename"
                :src="assetUrl(item.url)"
              />
              <div
                v-else
                :style="`color:${categoryMeta(fileCategory(item.mimeType)).color};background:${categoryMeta(fileCategory(item.mimeType)).color}12`"
                class="media-card__cover-placeholder"
              >
                <ArtSvgIcon :icon="fileIcon(fileCategory(item.mimeType))" />
              </div>
              <span
                :style="{ background: categoryMeta(fileCategory(item.mimeType)).color }"
                class="media-card__badge"
              >
                {{ categoryMeta(fileCategory(item.mimeType)).code }}
              </span>
            </div>
            <div class="media-card__body">
              <h3 :title="item.filename" class="media-card__title" @click="openDetail(item)">
                {{ item.filename }}
              </h3>
              <div class="media-card__meta">
                <span>{{ formatSize(item.size) }}</span>
                <span>{{ formatDate(item.createdAt) }}</span>
              </div>
              <div class="media-card__actions">
                <ElButton class="media-card__action" size="small" @click.stop="copyLink(item)"
                  >复制链接</ElButton
                >
                <ElButton
                  class="media-card__action media-card__action--danger"
                  size="small"
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
        :http-request="uploadFile"
        :show-file-list="true"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.tar,.gz"
        drag
        multiple
        @success="onUploadSuccess"
      >
        <ArtSvgIcon class="upload-icon" icon="ri:upload-cloud-2-line" />
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      </ElUpload>
      <template #footer>
        <ElButton @click="closeUploadDialog">完成</ElButton>
      </template>
    </ElDialog>

    <!-- 文件详情弹窗 -->
    <ElDialog
      v-model="detailVisible"
      :before-close="() => (detailVisible = false)"
      :show-close="false"
      class="file-detail-dialog"
      top="5vh"
      width="85%"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h2 class="text-base font-medium text-gray-900 m-0">{{ detailItem?.filename }}</h2>
          <button
            class="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
            @click="detailVisible = false"
          >
            <ArtSvgIcon class="text-xl text-gray-400" icon="ri:close-line" />
          </button>
        </div>
      </template>

      <div v-if="detailItem" class="flex h-[80vh] gap-6">
        <!-- 左侧预览区 -->
        <div class="flex-1 bg-[#fafafa] rounded-lg flex items-center justify-center overflow-auto">
          <FilePreview
            v-if="canPreview(detailItem.mimeType)"
            :file="assetUrl(detailItem.url)"
            :filename="detailItem.filename"
            :mime-type="detailItem.mimeType"
            height="100%"
            width="100%"
          />
          <div v-else class="flex items-center justify-center w-full h-full">
            <img
              v-if="fileCategory(detailItem.mimeType) === 'image'"
              :alt="detailItem.filename"
              :src="assetUrl(detailItem.url)"
              class="max-w-full max-h-full object-contain"
            />
            <div v-else class="text-center">
              <div
                :style="`background:${categoryMeta(fileCategory(detailItem.mimeType)).color}15`"
                class="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-3"
              >
                <ArtSvgIcon
                  :icon="fileIcon(fileCategory(detailItem.mimeType))"
                  :style="`color:${categoryMeta(fileCategory(detailItem.mimeType)).color}`"
                  class="text-5xl"
                />
              </div>
              <p class="text-sm text-gray-400">无法预览</p>
            </div>
          </div>
        </div>

        <!-- 右侧信息区 -->
        <div class="w-80 flex flex-col gap-4">
          <!-- 操作按钮 -->
          <div class="bg-white rounded-lg border border-gray-100 p-4">
            <ElButton type="primary" @click="copyLink(detailItem)">
              <ArtSvgIcon class="text-base" icon="ri:link" />
              复制链接
            </ElButton>

            <ElButton type="danger" @click="removeFromDetail">
              <ArtSvgIcon class="text-base" icon="ri:delete-bin-line" />
              删除
            </ElButton>
          </div>

          <!-- 信息列表 -->
          <div
            class="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-100 p-4 space-y-4"
          >
            <div class="bg-white rounded-lg border border-gray-100 p-3">
              <div class="text-xs font-medium text-gray-500 mb-2">文件类型</div>
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
                :style="`background:${categoryMeta(fileCategory(detailItem.mimeType)).color}15;color:${categoryMeta(fileCategory(detailItem.mimeType)).color}`"
              >
                <ArtSvgIcon :icon="fileIcon(fileCategory(detailItem.mimeType))" class="text-sm" />
                {{ categoryMeta(fileCategory(detailItem.mimeType)).label }}
              </span>
            </div>

            <div class="bg-white rounded-lg border border-gray-100 p-3 grid grid-cols-2 gap-3">
              <div>
                <div class="text-xs font-medium text-gray-500 mb-1">文件大小</div>
                <div class="text-sm font-medium text-gray-900">{{ formatSize(detailItem.size) }}</div>
              </div>
              <div>
                <div class="text-xs font-medium text-gray-500 mb-1">上传时间</div>
                <div class="text-sm font-medium text-gray-900">{{ formatDate(detailItem.createdAt) }}</div>
              </div>
            </div>

            <div class="bg-white rounded-lg border border-gray-100 p-3">
              <div class="text-xs font-medium text-gray-500 mb-2">MIME 类型</div>
              <div class="text-xs text-gray-700 font-mono bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200">
                {{ detailItem.mimeType }}
              </div>
            </div>

            <div>
              <div class="text-xs text-gray-400 mb-1.5">地址</div>
              <div
                class="text-xs text-blue-500 cursor-pointer hover:text-blue-600 break-all transition-colors"
                @click="copyLink(detailItem)"
              >
                {{ assetUrl(detailItem.url) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ElDialog>
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
    border-radius: 8px;
    box-shadow: 0 1px 2px rgb(0 0 0 / 5%);
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
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
    border-radius: 8px;
    box-shadow: 0 1px 2px rgb(0 0 0 / 5%);
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
    background: #f3f4f6;
    border-radius: 6px;
  }

  .view-mode-toggle__btn {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    height: 30px;
    padding: 0 12px;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: #6b7280;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .view-mode-toggle__btn :deep(.art-svg-icon) {
    font-size: 15px;
  }

  .view-mode-toggle__btn.is-active {
    background: #fff;
    color: var(--theme-color);
    box-shadow: 0 1px 2px rgb(0 0 0 / 6%);
  }

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
    background: #f3f4f6;
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
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
    transition: all 0.2s ease;
  }

  .media-card:hover {
    box-shadow: 0 8px 20px rgb(0 0 0 / 10%);
    transform: translateY(-2px);
  }

  .media-card__cover {
    position: relative;
    height: 150px;
    background: #f3f4f6;
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
    border-radius: 4px;
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
    color: #1f2937;
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
    color: #6b7280;
  }

  .media-card__actions {
    display: flex;
    gap: 8px;
    align-items: center;
    padding-top: 12px;
    margin-top: auto;
    border-top: 1px solid #e5e7eb;
  }

  .media-card__action {
    font-size: 14px;
    --el-button-bg-color: color-mix(in srgb, var(--theme-color) 10%, transparent);
    --el-button-text-color: var(--theme-color);
    --el-button-border-color: transparent;
    --el-button-hover-bg-color: color-mix(in srgb, var(--theme-color) 16%, transparent);
  }

  .media-card__action--danger {
    margin-left: auto;
    --el-button-bg-color: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
    --el-button-text-color: var(--el-color-danger);
    --el-button-hover-bg-color: color-mix(in srgb, var(--el-color-danger) 16%, transparent);
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

  /* 自定义滚动条样式 */
  .file-detail-dialog :deep(.el-dialog__body) {
    padding: 20px;
  }

  .file-detail-dialog :deep(*::-webkit-scrollbar) {
    width: 8px;
    height: 8px;
  }

  .file-detail-dialog :deep(*::-webkit-scrollbar-track) {
    background: #f3f4f6;
    border-radius: 4px;
  }

  .file-detail-dialog :deep(*::-webkit-scrollbar-thumb) {
    background: #d1d5db;
    border-radius: 4px;
  }

  .file-detail-dialog :deep(*::-webkit-scrollbar-thumb:hover) {
    background: #9ca3af;
  }

  @media (max-width: 960px) {
    .stats {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
