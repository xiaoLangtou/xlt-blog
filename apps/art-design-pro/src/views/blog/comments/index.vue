<script setup lang="ts">
  import { ElButton, ElInput, ElMessage, ElMessageBox } from 'element-plus'
  import SearchTable from '@/components/searchTable/index.vue'
  import { blogApi } from '@/api/blog'
  import { useTableColumns } from '@/hooks/core/useTableColumns'

  const query = reactive<Api.Blog.CommentQuery>({
    page: 1,
    pageSize: 10,
    keyword: '',
    status: undefined,
    articleId: undefined,
    order: 'desc'
  })

  const comments = ref<Api.Blog.Comment[]>([])
  const total = ref(0)
  const loading = ref(false)
  const articles = ref<Api.Blog.Article[]>([])

  const view = ref<'table' | 'card'>('table')
  const selectedIds = ref<Set<number>>(new Set())
  const artTableRef = ref()
  const expandComponentCache = new Map<number, Record<string, unknown>>()
  const detailVisible = ref(false)
  const detailItem = ref<Api.Blog.Comment | null>(null)
  const replyContent = ref('')
  const replyError = ref(false)

  const STATUS_META: Record<Api.Blog.CommentStatus, { label: string; cls: string }> = {
    pending: { label: '待审核', cls: 'badge-pending' },
    approved: { label: '已通过', cls: 'badge-approved' },
    rejected: { label: '已拒绝', cls: 'badge-rejected' }
  }

  const searchFields = computed(() => [
    { prop: 'keyword', label: '评论内容', placeholder: '请输入评论内容或用户昵称' },
    {
      prop: 'status',
      label: '状态',
      type: 'select' as const,
      placeholder: '全部状态',
      options: [
        { label: '待审核', value: 'pending' },
        { label: '已通过', value: 'approved' },
        { label: '已拒绝', value: 'rejected' }
      ]
    },
    {
      prop: 'articleId',
      label: '所属文章',
      type: 'select' as const,
      placeholder: '全部文章',
      options: articles.value.map((a) => ({ label: a.title, value: a.id }))
    }
  ])

  const pagination = computed(() => ({
    current: query.page ?? 1,
    size: query.pageSize ?? 10,
    total: total.value
  }))

  const { columns, columnChecks } = useTableColumns<Api.Blog.Comment>(() => [
    { type: 'selection', width: 44 },
    {
      type: 'expand',
      width: 50,
      formatter: (row: Api.Blog.Comment) => getExpandComponent(row)
    },
    {
      prop: 'content',
      label: '评论内容',
      minWidth: 300,
      formatter: (row: Api.Blog.Comment) =>
        h('div', { class: 'clamp2 comment-content', onClick: () => toggleReply(row) }, row.content)
    },
    {
      prop: 'articleTitle',
      label: '所属文章',
      width: 180,
      formatter: (row) => h('span', { class: 'text-theme' }, row.articleTitle)
    },
    {
      prop: 'nickname',
      label: '评论人',
      width: 140,
      formatter: (row) =>
        h('div', null, [
          h('div', null, row.nickname),
          h('div', { class: 'contact' }, contactText(row))
        ])
    },
    {
      prop: 'status',
      label: '状态',
      width: 90,
      formatter: (row) => h('span', { class: `badge ${statusClass(row)}` }, statusLabel(row))
    },
    {
      prop: 'createdAt',
      label: '时间',
      width: 150,
      formatter: (row) => h('span', { class: 'time-cell' }, formatDate(row.createdAt))
    },
    {
      prop: 'operation',
      label: '操作',
      width: 170,
      fixed: 'right',
      formatter: (row) =>
        row.status === 'pending'
          ? [
              h(
                ElButton,
                { link: true, type: 'primary', onClick: () => approve(row) },
                () => '通过'
              ),
              h(ElButton, { link: true, type: 'danger', onClick: () => reject(row) }, () => '驳回'),
              h(ElButton, { link: true, type: 'danger', onClick: () => remove(row) }, () => '删除')
            ]
          : [
              h(
                ElButton,
                { link: true, type: 'primary', onClick: () => toggleReply(row) },
                () => '回复'
              ),
              h(ElButton, { link: true, type: 'danger', onClick: () => remove(row) }, () => '删除')
            ]
    }
  ])

  async function load() {
    loading.value = true
    try {
      const data = await blogApi.listComments(query)
      comments.value = data.items ?? []
      total.value = data.total ?? 0
    } finally {
      loading.value = false
    }
  }

  async function loadArticles() {
    try {
      const data = await blogApi.listArticles({ page: 1, pageSize: 100 })
      articles.value = data.items ?? []
    } catch {
      articles.value = []
    }
  }

  function search() {
    query.page = 1
    load()
  }

  function reset() {
    query.page = 1
    selectedIds.value = new Set()
    load()
  }

  function onSelectionChange(rows: Api.Blog.Comment[]) {
    selectedIds.value = new Set(rows.map((r) => r.id))
  }

  function setView(mode: 'table' | 'card') {
    view.value = mode
    selectedIds.value = new Set()
  }

  function toggleSelect(id: number) {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
  }

  async function approve(item: Api.Blog.Comment) {
    await blogApi.approveComment(item.id)
    ElMessage.success('已通过该评论')
    load()
  }

  async function reject(item: Api.Blog.Comment) {
    await blogApi.rejectComment(item.id)
    ElMessage.success('已驳回该评论')
    load()
  }

  async function remove(item: Api.Blog.Comment) {
    try {
      await ElMessageBox.confirm('确定删除这条评论吗？该操作不可撤销。', '删除评论', {
        type: 'warning',
        confirmButtonText: '确定删除',
        confirmButtonClass: 'el-button--danger'
      })
    } catch {
      return
    }
    await blogApi.deleteComment(item.id)
    selectedIds.value = new Set([...selectedIds.value].filter((id) => id !== item.id))
    ElMessage.success('已删除该评论')
    load()
  }

  async function batchApprove() {
    const ids = [...selectedIds.value]
    const pending = comments.value.filter((c) => ids.includes(c.id) && c.status === 'pending')
    if (pending.length) {
      await Promise.all(pending.map((c) => blogApi.approveComment(c.id)))
      ElMessage.success(`已批量通过 ${pending.length} 条评论`)
    } else {
      ElMessage.warning('所选评论中没有待审核项')
    }
    selectedIds.value = new Set()
    load()
  }

  async function batchDelete() {
    const n = selectedIds.value.size
    if (!n) return
    try {
      await ElMessageBox.confirm(`确定删除选中的 ${n} 条评论吗？该操作不可撤销。`, '批量删除', {
        type: 'warning',
        confirmButtonText: '确定删除',
        confirmButtonClass: 'el-button--danger'
      })
    } catch {
      return
    }
    await Promise.all([...selectedIds.value].map((id) => blogApi.deleteComment(id)))
    selectedIds.value = new Set()
    ElMessage.success(`已删除 ${n} 条评论`)
    load()
  }

  function openDetail(item: Api.Blog.Comment) {
    detailItem.value = item
    replyContent.value = ''
    replyError.value = false
    detailVisible.value = true
  }

  function closeDetail() {
    detailVisible.value = false
    detailItem.value = null
    replyContent.value = ''
    replyError.value = false
  }

  async function sendReply(row?: Api.Blog.Comment) {
    const item = row ?? detailItem.value
    const content = replyContent.value.trim()
    if (!item || !content) {
      replyError.value = true
      return
    }
    await blogApi.replyComment(item.id, content)
    ElMessage.success('回复已发送')
    replyContent.value = ''
    replyError.value = false
    if (row) {
      collapseRow(row)
    } else {
      closeDetail()
    }
    load()
  }

  function getExpandComponent(row: Api.Blog.Comment) {
    const id = row.id
    if (!expandComponentCache.has(id)) {
      expandComponentCache.set(id, {
        name: 'CommentExpandContent',
        setup() {
          return () => renderExpandContent(row)
        }
      })
    }
    return expandComponentCache.get(id)
  }

  function renderExpandContent(row: Api.Blog.Comment) {
    const children: any[] = [
      h('div', { class: 'expand-section' }, [
        h('div', { class: 'expand-section-label' }, '评论内容'),
        h('div', { class: 'expand-full-content' }, row.content)
      ])
    ]
    if (row.status !== 'pending') {
      children.push(
        h('div', { class: 'expand-section' }, [
          h('div', { class: 'expand-section-label' }, `回复 ${row.nickname}`),
          h('div', { class: 'reply-box' }, [
            h(ElInput, {
              modelValue: replyContent.value,
              'onUpdate:modelValue': (v: string) => (replyContent.value = v),
              type: 'textarea',
              rows: 4,
              placeholder: `回复 ${row.nickname}……`
            }),
            replyError.value ? h('div', { class: 'reply-error' }, '请输入回复内容') : null,
            h('div', { class: 'reply-actions' }, [
              h(ElButton, { onClick: () => collapseRow(row) }, () => '取消'),
              h(ElButton, { type: 'primary', onClick: () => sendReply(row) }, () => '发送')
            ])
          ])
        ])
      )
    } else {
      children.push(
        h('div', { class: 'expand-section' }, [
          h('div', { class: 'expand-section-label' }, '审核操作'),
          h('div', { class: 'reply-actions' }, [
            h(ElButton, { type: 'primary', onClick: () => approve(row) }, () => '通过'),
            h(ElButton, { type: 'warning', onClick: () => reject(row) }, () => '驳回')
          ])
        ])
      )
    }
    return h('div', { class: 'comment-expand' }, children)
  }

  function onExpandChange() {
    replyContent.value = ''
    replyError.value = false
  }

  function collapseRow(row: Api.Blog.Comment) {
    artTableRef.value?.elTableRef?.toggleRowExpansion(row, false)
    replyContent.value = ''
    replyError.value = false
  }

  function toggleReply(row: Api.Blog.Comment) {
    artTableRef.value?.elTableRef?.toggleRowExpansion(row)
  }

  function statusLabel(item: Api.Blog.Comment) {
    return STATUS_META[item.status].label
  }

  function statusClass(item: Api.Blog.Comment) {
    return STATUS_META[item.status].cls
  }

  function contactText(item: Api.Blog.Comment) {
    const email = item.email
    if (!email) return '匿名访客'
    const [local, domain] = email.split('@')
    const head = local.slice(0, Math.min(3, local.length))
    return domain ? `${head}***@${domain}` : `${head}***`
  }

  function initial(name: string) {
    return (name || '匿').slice(0, 1)
  }

  function formatDate(value: string) {
    const d = new Date(value)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function handleSizeChange(size: number) {
    query.pageSize = size
    query.page = 1
    load()
  }

  function handleCurrentChange(page: number) {
    query.page = page
    load()
  }

  onMounted(() => {
    load()
    loadArticles()
  })
</script>

<template>
  <div class="comment-page art-full-height">
    <SearchTable
      v-model:query="query"
      :query-source="searchFields"
      :loading="loading"
      @search="search"
      @reset="reset"
    />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="load">
        <template #left>
          <ElButton
            type="primary"
            plain
            :disabled="!selectedIds.size"
            @click="batchApprove"
          >
            <ArtSvgIcon icon="ri:check-double-line" />批量通过
          </ElButton>
          <ElButton
            type="danger"
            plain
        
            :disabled="!selectedIds.size"
            @click="batchDelete"
          >
            <ArtSvgIcon icon="ri:delete-bin-6-line" />批量删除
          </ElButton>
          <span v-if="selectedIds.size" class="selected-hint">已选 {{ selectedIds.size }} 项</span>
        </template>
        <template #right>
          <div class="view-mode-toggle" role="tablist" aria-label="视图切换">
            <button
              type="button"
              class="view-mode-toggle__btn"
              :class="{ 'is-active': view === 'table' }"
              @click="setView('table')"
            >
              <ArtSvgIcon icon="ri:list-unordered" />表格
            </button>
            <button
              type="button"
              class="view-mode-toggle__btn"
              :class="{ 'is-active': view === 'card' }"
              @click="setView('card')"
            >
              <ArtSvgIcon icon="ri:layout-grid-line" />卡片
            </button>
          </div>
        </template>
      </ArtTableHeader>

      <ArtTable
        v-if="view === 'table'"
        ref="artTableRef"
        :loading="loading"
        :data="comments"
        :columns="columns"
        :pagination="pagination"
        :pagination-options="{ layout: 'total, prev, pager, next' }"
        row-key="id"
        :preserve-expanded-content="false"
        empty-text="没有找到符合条件的评论，试试调整筛选条件"
        @selection-change="onSelectionChange"
        @expand-change="onExpandChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />

      <div v-else v-loading="loading" class="comment-card-list">
        <div v-if="comments.length" class="comment-card-grid">
          <article v-for="item in comments" :key="item.id" class="comment-card">
            <div class="cc-head">
              <div class="cc-user">
                <ElCheckbox
                  class="cc-check"
                  :model-value="selectedIds.has(item.id)"
                  @change="toggleSelect(item.id)"
                />
                <div class="cc-avatar">{{ initial(item.nickname) }}</div>
                <div class="min-w-0">
                  <div class="cc-name">{{ item.nickname }}</div>
                  <div class="cc-contact">{{ contactText(item) }}</div>
                </div>
              </div>
              <span class="badge" :class="STATUS_META[item.status].cls">
                {{ STATUS_META[item.status].label }}
              </span>
            </div>

            <div class="cc-content" @click="openDetail(item)">{{ item.content }}</div>
            <div class="cc-article">{{ item.articleTitle }}</div>

            <div class="cc-footer">
              <span class="cc-meta">{{ formatDate(item.createdAt) }}</span>
              <div class="cc-actions">
                <template v-if="item.status === 'pending'">
                  <ElButton link type="primary" @click="approve(item)">通过</ElButton>
                  <ElButton link type="danger" @click="reject(item)">驳回</ElButton>
                  <ElButton link type="danger" @click="remove(item)">删除</ElButton>
                </template>
                <template v-else>
                  <ElButton link type="primary" @click="openDetail(item)">详情</ElButton>
                  <ElButton link type="danger" @click="remove(item)">删除</ElButton>
                </template>
              </div>
            </div>
          </article>
        </div>
        <ElEmpty v-else description="没有找到符合条件的评论，试试调整筛选条件" />
        <div class="comment-card-pagination">
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

    <!-- 评论详情 -->
    <ElDialog v-model="detailVisible" title="评论详情" width="560px" :append-to-body="true">
      <div v-if="detailItem" class="detail-body">
        <div class="detail-row">
          <span class="detail-label">评论人</span>
          <span class="detail-value">
            {{ detailItem.nickname }}
            <span class="detail-contact">{{ contactText(detailItem) }}</span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">状态</span>
          <span class="badge" :class="STATUS_META[detailItem.status].cls">
            {{ STATUS_META[detailItem.status].label }}
          </span>
        </div>
        <div class="detail-row detail-row--top">
          <span class="detail-label">评论内容</span>
          <span class="detail-value detail-content">{{ detailItem.content }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">所属文章</span>
          <span class="detail-value text-theme">{{ detailItem.articleTitle }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">时间</span>
          <span class="detail-value">{{ formatDate(detailItem.createdAt) }}</span>
        </div>

        <div v-if="detailItem.status !== 'pending'" class="detail-reply-area">
          <ElInput
            v-model="replyContent"
            type="textarea"
            :rows="4"
            :placeholder="`回复 ${detailItem.nickname}……`"
          />
          <div v-if="replyError" class="reply-error">请输入回复内容</div>
        </div>
      </div>

      <template #footer>
        <ElButton
          v-if="detailItem?.status === 'pending'"
          type="primary"
          @click="detailItem && approve(detailItem)"
        >
          通过
        </ElButton>
        <ElButton
          v-if="detailItem?.status === 'pending'"
          type="warning"
          @click="detailItem && reject(detailItem)"
        >
          驳回
        </ElButton>
        <ElButton
          v-if="detailItem && detailItem.status !== 'pending'"
          type="primary"
          @click="sendReply"
        >
          回复
        </ElButton>
        <ElButton type="danger" plain @click="detailItem && remove(detailItem)">删除</ElButton>
        <ElButton @click="closeDetail">关闭</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
  .comment-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ========== 搜索栏 ========== */
  .comment-page :deep(.search-table) {
    padding: 16px 18px;
    background: var(--system-card, var(--default-box-color));
    border: 1px solid var(--system-border-subtle, var(--default-border));
    border-radius: calc(var(--custom-radius) / 2 + 4px);
    box-shadow: none;
  }

  .comment-page :deep(.search-table .el-form-item__label) {
    color: var(--system-secondary, var(--art-gray-700));
  }

  .comment-page :deep(.search-table .el-input__wrapper),
  .comment-page :deep(.search-table .el-select__wrapper) {
    background: var(--system-input, var(--default-box-color));
    border-radius: 6px;
    box-shadow: 0 0 0 1px var(--system-border-subtle, var(--default-border)) inset;
    transition: box-shadow 0.2s ease;
  }

  .comment-page :deep(.search-table .el-input__wrapper.is-focus),
  .comment-page :deep(.search-table .el-select__wrapper.is-focused) {
    box-shadow:
      0 0 0 1px var(--system-accent, var(--theme-color)) inset,
      0 0 0 3px var(--system-accent-soft, color-mix(in srgb, var(--theme-color) 12%, transparent));
  }

  /* ========== 表格卡片 ========== */
  .comment-page :deep(.art-table-card) {
    border-radius: calc(var(--custom-radius) / 2 + 4px);
  }

  .comment-page :deep(.art-table-card .el-card__header) {
    padding: 12px 16px;
    border-bottom: 0;
  }

  .comment-page :deep(.art-table-card .el-card__body) {
    padding: 12px 16px 16px;
  }

  /* 展开行单元格 */
  .comment-page :deep(.el-table__expanded-cell) {
    padding: 12px 16px 16px 60px;
    background: var(--system-elevated, var(--art-gray-200));
  }

  .comment-page :deep(.el-table__expanded-cell[class*='cell']) {
    padding: 12px 16px 16px 60px;
  }

  /* 展开图标柔和化 */
  .comment-page :deep(.el-table__expand-icon) {
    transition:
      transform 0.2s ease,
      color 0.2s ease;
  }

  .comment-page :deep(.el-table__expand-icon.el-table__expand-icon--expanded) {
    color: var(--system-accent, var(--theme-color));
  }

  .selected-hint {
    font-size: 12.5px;
    color: var(--system-accent, var(--theme-color));
  }

  /* ========== 视图切换 ========== */
  .view-mode-toggle {
    display: inline-flex;
    padding: 3px;
    background: var(--system-elevated, var(--art-gray-200));
    border: 1px solid var(--system-border-subtle, var(--default-border));
    border-radius: calc(var(--custom-radius) / 3 + 2px);
  }

  .view-mode-toggle__btn {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    height: 28px;
    padding: 0 12px;
    border: 0;
    border-radius: calc(var(--custom-radius) / 4 + 2px);
    background: transparent;
    color: var(--system-muted, var(--art-gray-600));
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .view-mode-toggle__btn :deep(.art-svg-icon) {
    font-size: 14px;
  }

  .view-mode-toggle__btn.is-active {
    background: var(--system-card, var(--default-box-color));
    color: var(--system-accent, var(--theme-color));
    box-shadow: 0 1px 2px rgb(16 24 40 / 6%);
  }

  /* ========== 表格单元格 ========== */
  .comment-page :deep(.clamp2) {
    display: -webkit-box;
    overflow: hidden;
    line-height: 1.5;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .comment-page :deep(.comment-content) {
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .comment-page :deep(.comment-content:hover) {
    color: var(--system-accent, var(--theme-color));
  }

  .comment-page :deep(.contact) {
    margin-top: 2px;
    font-size: 12px;
    color: var(--system-muted, var(--art-gray-500));
  }

  .comment-page :deep(.time-cell) {
    color: var(--system-muted, var(--art-gray-600));
    white-space: nowrap;
  }

  /* ========== 状态徽章 ========== */
  .comment-page :deep(.badge),
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    border-radius: 20px;
  }

  .comment-page :deep(.badge-pending),
  .badge-pending {
    color: var(--art-warning);
    background: color-mix(in srgb, var(--art-warning) 12%, transparent);
  }

  .comment-page :deep(.badge-approved),
  .badge-approved {
    color: var(--system-green, var(--art-success));
    background: var(--system-green-soft, color-mix(in srgb, var(--art-success) 12%, transparent));
  }

  .comment-page :deep(.badge-rejected),
  .badge-rejected {
    color: var(--system-red, var(--art-danger));
    background: var(--system-red-soft, color-mix(in srgb, var(--art-danger) 12%, transparent));
  }

  /* ========== 展开行内容 ========== */
  .comment-page :deep(.comment-expand) {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .comment-page :deep(.expand-section) {
    display: flex;
    flex-direction: column;
  }

  .comment-page :deep(.expand-section-label) {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--system-muted, var(--art-gray-600));
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .comment-page :deep(.expand-section-label::before) {
    width: 3px;
    height: 12px;
    content: '';
    background: var(--system-accent, var(--theme-color));
    border-radius: 2px;
  }

  .comment-page :deep(.expand-full-content) {
    padding: 12px 14px;
    font-size: 13px;
    line-height: 1.7;
    color: var(--system-text, var(--art-gray-900));
    white-space: pre-wrap;
    word-break: break-word;
    background: var(--system-card, var(--default-box-color));
    border: 1px solid var(--system-border-subtle, var(--default-border));
    border-radius: 8px;
  }

  .comment-page :deep(.reply-box) {
    padding: 14px;
    background: var(--system-card, var(--default-box-color));
    border: 1px solid var(--system-border-subtle, var(--default-border));
    border-radius: 8px;
  }

  .comment-page :deep(.reply-box .el-textarea__inner) {
    background: var(--system-input, var(--default-box-color));
    border-radius: 6px;
    box-shadow: 0 0 0 1px var(--system-border-subtle, var(--default-border)) inset;
    transition: box-shadow 0.2s ease;
  }

  .comment-page :deep(.reply-box .el-textarea__inner:focus) {
    box-shadow:
      0 0 0 1px var(--system-accent, var(--theme-color)) inset,
      0 0 0 3px var(--system-accent-soft, color-mix(in srgb, var(--theme-color) 12%, transparent));
  }

  .comment-page :deep(.reply-actions) {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 10px;
  }

  .comment-page :deep(.reply-error) {
    margin-top: 6px;
    font-size: 12px;
    color: var(--system-red, var(--art-danger));
  }

  /* ========== 卡片视图 ========== */
  .comment-card-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .comment-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 14px;
  }

  .comment-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 14px 16px;
    background: var(--system-card, var(--default-box-color));
    border: 1px solid var(--system-border-subtle, var(--default-border));
    border-radius: calc(var(--custom-radius) / 2 + 4px);
    box-shadow: 0 1px 3px rgb(0 0 0 / 4%);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;
  }

  .comment-card:hover {
    border-color: color-mix(in srgb, var(--system-accent, var(--theme-color)) 30%, transparent);
    box-shadow: 0 8px 24px rgb(0 0 0 / 8%);
    transform: translateY(-2px);
  }

  .cc-head {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .cc-user {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .cc-check {
    margin-top: 2px;
  }

  .cc-avatar {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    font-size: 13px;
    font-weight: 600;
    color: var(--system-accent, var(--theme-color));
    background: var(
      --system-accent-soft,
      color-mix(in srgb, var(--theme-color) 12%, var(--default-box-color))
    );
    border-radius: 50%;
  }

  .cc-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--system-text, var(--art-gray-900));
  }

  .cc-contact {
    font-size: 12px;
    color: var(--system-muted, var(--art-gray-500));
  }

  .cc-content {
    min-height: 44px;
    margin-bottom: 10px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--system-text, var(--art-gray-900));
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .cc-content:hover {
    color: var(--system-accent, var(--theme-color));
  }

  .cc-article {
    margin-bottom: 8px;
    font-size: 12px;
    color: var(--system-accent, var(--theme-color));
  }

  .cc-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 10px;
    margin-top: auto;
    border-top: 1px solid var(--system-border-subtle, var(--default-border));
  }

  .cc-meta {
    font-size: 12px;
    color: var(--system-muted, var(--art-gray-500));
  }

  .cc-actions {
    display: flex;
    gap: 4px;
  }

  .comment-card-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  /* ========== 评论详情弹窗 ========== */
  .detail-body {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .detail-row {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    padding: 10px 0;
    border-bottom: 1px solid var(--system-border-subtle, var(--default-border));
  }

  .detail-row:last-of-type {
    border-bottom: none;
  }

  .detail-row--top {
    align-items: flex-start;
  }

  .detail-label {
    flex: 0 0 80px;
    font-size: 12.5px;
    color: var(--system-muted, var(--art-gray-600));
  }

  .detail-value {
    flex: 1;
    font-size: 13px;
    color: var(--system-text, var(--art-gray-900));
  }

  .detail-content {
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .detail-contact {
    margin-left: 8px;
    font-size: 12px;
    color: var(--system-muted, var(--art-gray-500));
  }

  .detail-reply-area {
    margin-top: 12px;
  }

  .reply-error {
    margin-top: 6px;
    font-size: 12px;
    color: var(--system-red, var(--art-danger));
  }
</style>
