<script setup lang="ts">
  import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import { blogApi } from '@/api/blog'
  import SearchTable from '@/components/searchTable/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import { useBlogArticleListQuery } from '@/hooks/queries/useBlogQuery'

  const router = useRouter()
  const viewMode = ref<'table' | 'card'>('table')
  const params = reactive<Api.Blog.ArticleQuery>({
    page: 1,
    pageSize: 10,
    keyword: '',
    status: undefined
  })
  const searchFields = [
    { prop: 'keyword', label: '文章标题', placeholder: '请输入文章标题' },
    {
      prop: 'status',
      label: '文章状态',
      type: 'select' as const,
      placeholder: '全部状态',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已发布', value: 'published' }
      ]
    }
  ]
  const { data, isFetching, refetch } = useBlogArticleListQuery(params)
  const articles = computed(() => data.value?.items ?? [])
  const pagination = computed(() => ({
    current: params.page ?? 1,
    size: params.pageSize ?? 10,
    total: data.value?.total ?? 0
  }))

  const { columns, columnChecks } = useTableColumns<Api.Blog.Article>(() => [
    {
      prop: 'title',
      label: '标题',
      minWidth: 280,
      formatter: (row) =>
        h('div', { class: 'article-title-cell' }, [
          row.cover
            ? h('img', { class: 'article-title-cover', src: row.cover, alt: '' })
            : h(
                'span',
                { class: 'article-title-cover article-title-cover--empty' },
                row.title.slice(0, 1)
              ),
          h('span', { class: 'article-title-text' }, row.title)
        ])
    },
    {
      prop: 'category',
      label: '分类',
      width: 130,
      formatter: (row) => row.category?.name || '-'
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
    { prop: 'views', label: '浏览', width: 80 },
    {
      prop: 'updatedAt',
      label: '更新时间',
      width: 180,
      formatter: (row) => formatDate(row.updatedAt)
    },
    {
      prop: 'operation',
      label: '操作',
      width: 190,
      fixed: 'right',
      formatter: (row) => [
        h(
          ElButton,
          {
            link: true,
            type: 'primary',
            onClick: () => router.push(`/blog/articles/${row.id}/edit`)
          },
          () => '编辑'
        ),
        h(ElButton, { link: true, onClick: () => changeStatus(row) }, () =>
          row.status === 'published' ? '转草稿' : '发布'
        ),
        h(ElButton, { link: true, type: 'danger', onClick: () => removeArticle(row) }, () => '删除')
      ]
    }
  ])

  function search() {
    params.page = 1
    refetch()
  }

  function reset() {
    params.keyword = ''
    params.status = undefined
    params.page = 1
    refetch()
  }

  function handleSizeChange(size: number) {
    params.pageSize = size
    params.page = 1
    refetch()
  }

  function handleCurrentChange(page: number) {
    params.page = page
    refetch()
  }

  async function changeStatus(article: Api.Blog.Article) {
    await (article.status === 'published'
      ? blogApi.unpublishArticle(article.id)
      : blogApi.publishArticle(article.id))
    ElMessage.success(article.status === 'published' ? '文章已转为草稿' : '文章已发布')
    refetch()
  }

  async function removeArticle(article: Api.Blog.Article) {
    try {
      await ElMessageBox.confirm(
        `确定删除文章「${article.title}」吗？删除后不可恢复。`,
        '删除文章',
        {
          type: 'warning',
          confirmButtonText: '删除',
          confirmButtonClass: 'el-button--danger'
        }
      )
    } catch {
      return
    }
    await blogApi.deleteArticle(article.id)
    ElMessage.success('文章已删除')
    refetch()
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(value)
    )
  }
</script>

<template>
  <div class="article-list-page art-full-height">
    <SearchTable
      v-model:query="params"
      :query-source="searchFields"
      :loading="isFetching"
      @search="search"
      @reset="reset"
    />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="isFetching" @refresh="refetch">
        <template #left>
          <ElButton type="primary" @click="router.push('/blog/articles/new')">
            <ArtSvgIcon icon="ri:add-line" />新建文章
          </ElButton>
        </template>
        <template #right>
          <div class="view-mode-toggle" role="tablist" aria-label="视图切换">
            <button
              type="button"
              class="view-mode-toggle__btn"
              :class="{ 'is-active': viewMode === 'table' }"
              @click="viewMode = 'table'"
            >
              <ArtSvgIcon icon="ri:list-unordered" />表格
            </button>
            <button
              type="button"
              class="view-mode-toggle__btn"
              :class="{ 'is-active': viewMode === 'card' }"
              @click="viewMode = 'card'"
            >
              <ArtSvgIcon icon="ri:layout-grid-line" />卡片
            </button>
          </div>
        </template>
      </ArtTableHeader>

      <ArtTable
        v-if="viewMode === 'table'"
        :loading="isFetching"
        :data="articles"
        :columns="columns"
        :pagination="pagination"
        :pagination-options="{ layout: 'total, prev, pager, next' }"
        row-key="id"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />

      <div v-else v-loading="isFetching" class="article-card-list">
        <div v-if="articles.length" class="article-card-grid">
          <article v-for="item in articles" :key="item.id" class="article-card">
            <div class="article-card__cover">
              <img v-if="item.cover" :src="item.cover" :alt="item.title" />
              <div v-else class="article-card__cover-placeholder">
                <ArtSvgIcon icon="ri:image-line" />
              </div>
              <span
                class="article-card__status"
                :class="item.status === 'published' ? 'is-published' : 'is-draft'"
              >
                <i class="article-card__status-dot" />
                {{ item.status === 'published' ? '已发布' : '草稿' }}
              </span>
            </div>
            <div class="article-card__body">
              <h3
                class="article-card__title"
                @click="router.push(`/blog/articles/${item.id}/edit`)"
              >
                {{ item.title }}
              </h3>
              <p v-if="item.summary" class="article-card__summary">{{ item.summary }}</p>
              <div class="article-card__meta">
                <span v-if="item.category" class="article-card__category">{{
                  item.category.name
                }}</span>
                <span class="article-card__meta-item">
                  <ArtSvgIcon icon="ri:eye-line" />{{ item.views }}
                </span>
                <span class="article-card__meta-item">
                  <ArtSvgIcon icon="ri:time-line" />{{ formatDate(item.updatedAt) }}
                </span>
              </div>
              <div class="article-card__actions">
                <ElButton
                  size="small"
                  class="article-card__action"
                  @click="router.push(`/blog/articles/${item.id}/edit`)"
                >
                  编辑
                </ElButton>
                <ElButton size="small" class="article-card__action" @click="changeStatus(item)">
                  {{ item.status === 'published' ? '转草稿' : '发布' }}
                </ElButton>
                <ElButton
                  size="small"
                  class="article-card__action article-card__action--danger"
                  @click="removeArticle(item)"
                >
                  删除
                </ElButton>
              </div>
            </div>
          </article>
        </div>
        <ElEmpty v-else description="暂无文章" />
        <div class="article-card-pagination">
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
  </div>
</template>

<style scoped>
  .article-list-page {
    display: flex;
    flex-direction: column;
  }

  .article-list-page :deep(.art-table-card .el-card__header) {
    padding: 12px 16px;
    border-bottom: 0;
  }

  .article-list-page :deep(.art-table-card .el-card__body) {
    padding: 12px 16px 16px;
  }

  .article-list-page :deep(.article-title-cell) {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  .article-list-page :deep(.article-title-cover) {
    flex: 0 0 auto;
    width: 46px;
    height: 34px;
    object-fit: cover;
    background: var(--default-bg-color);
    border: 1px solid var(--default-border);
    border-radius: 4px;
  }

  .article-list-page :deep(.article-title-cover--empty) {
    display: grid;
    place-items: center;
    font-size: 15px;
    font-weight: 600;
    color: var(--art-gray-500);
  }

  .article-list-page :deep(.article-title-text) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    height: 28px;
    padding: 0 12px;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: var(--art-gray-600);
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
    background: var(--default-box-color);
    color: var(--theme-color);
    box-shadow: 0 1px 2px rgb(16 24 40 / 6%);
  }

  .article-card-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 16px;
  }

  .article-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .article-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--default-box-color);
    border: 1px solid var(--default-border);
    border-radius: 8px;
    box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
    transition:
      transform 0.16s ease,
      box-shadow 0.16s ease;
  }

  .article-card:hover {
    box-shadow: 0 8px 20px rgb(0 0 0 / 10%);
    transform: translateY(-2px);
  }

  .article-card__cover {
    position: relative;
    height: 150px;
    background: var(--default-bg-color);
  }

  .article-card__cover img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .article-card__cover-placeholder {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    color: color-mix(in srgb, var(--theme-color) 42%, transparent);
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--theme-color) 12%, var(--default-bg-color)),
      color-mix(in srgb, var(--theme-color) 4%, var(--default-bg-color))
    );
  }

  .article-card__cover-placeholder :deep(.art-svg-icon) {
    font-size: 34px;
  }

  .article-card__status {
    position: absolute;
    top: 12px;
    left: 12px;
    display: inline-flex;
    gap: 5px;
    align-items: center;
    height: 22px;
    padding: 0 9px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 999px;
  }

  .article-card__status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .article-card__status.is-published {
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 14%, var(--default-box-color));
  }

  .article-card__status.is-draft {
    color: var(--art-gray-600);
    background: var(--art-gray-200);
  }

  .article-card__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 14px 16px 16px;
  }

  .article-card__title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--art-gray-900);
    cursor: pointer;
  }

  .article-card__title:hover {
    color: var(--theme-color);
  }

  .article-card__summary {
    display: -webkit-box;
    margin: 8px 0 0;
    overflow: hidden;
    font-size: 13px;
    line-height: 1.6;
    color: var(--art-gray-600);
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .article-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    align-items: center;
    margin-top: 12px;
    font-size: 12px;
    color: var(--art-gray-500);
  }

  .article-card__category {
    padding: 2px 8px;
    font-weight: 500;
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 10%, transparent);
    border-radius: 4px;
  }

  .article-card__meta-item {
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }

  .article-card__meta-item :deep(.art-svg-icon) {
    font-size: 14px;
  }

  .article-card__actions {
    display: flex;
    gap: 8px;
    align-items: center;
    padding-top: 12px;
    margin-top: auto;
    border-top: 1px solid var(--default-border);
  }

  .article-card__action {
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

  .article-card__action--danger {
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

  .article-card-pagination {
    display: flex;
    justify-content: flex-end;
  }
</style>
