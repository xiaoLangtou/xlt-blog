<script setup lang="ts">
  import { watchDebounced } from '@vueuse/core'
  import { blogApi } from '@/api/blog'

  const visible = defineModel<boolean>('visible', { default: false })
  const emit = defineEmits<{ select: [url: string] }>()

  const items = ref<Api.Blog.Attachment[]>([])
  const total = ref(0)
  const loading = ref(false)
  const query = reactive<Api.Blog.AttachmentQuery>({
    page: 1,
    pageSize: 24,
    keyword: '',
    category: 'image',
    sort: 'date'
  })

  const assetUrl = (url: string) => (url.startsWith('/') ? url : `/${url}`)

  async function load() {
    loading.value = true
    try {
      const data = await blogApi.listAttachments(query)
      items.value = data.items ?? []
      total.value = data.total ?? 0
    } finally {
      loading.value = false
    }
  }

  function choose(item: Api.Blog.Attachment) {
    emit('select', assetUrl(item.url))
    visible.value = false
  }

  watch(visible, (value) => {
    if (value) {
      query.page = 1
      query.keyword = ''
      load()
    }
  })

  watchDebounced(
    () => query.keyword,
    () => {
      query.page = 1
      load()
    },
    { debounce: 300 }
  )
</script>

<template>
  <ElDialog
    v-model="visible"
    title="从媒体库选择图片"
    width="720px"
    :append-to-body="true"
    class="media-picker"
  >
    <div class="picker-toolbar">
      <ElInput v-model="query.keyword" class="picker-search" placeholder="搜索文件名" clearable>
        <template #prefix><ArtSvgIcon icon="ri:search-line" /></template>
      </ElInput>
    </div>

    <div v-loading="loading" class="picker-grid">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="picker-item"
        :title="item.filename"
        @click="choose(item)"
      >
        <img :src="assetUrl(item.url)" :alt="item.filename" />
        <span class="picker-name">{{ item.filename }}</span>
      </button>
    </div>

    <ElEmpty v-if="!items.length && !loading" description="媒体库暂无图片" />

    <div class="picker-footer">
      <ElPagination
        v-model:current-page="query.page"
        :total="total"
        :page-size="query.pageSize"
        layout="total, prev, pager, next"
        @current-change="load"
      />
    </div>
  </ElDialog>
</template>

<style scoped>
  .picker-toolbar {
    margin-bottom: 12px;
  }

  .picker-search {
    width: 220px;
  }

  .picker-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
    gap: 12px;
    min-height: 120px;
  }

  .picker-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0;
    overflow: hidden;
    cursor: pointer;
    background: #fff;
    border: 1px solid var(--default-border);
    border-radius: 8px;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease,
      transform 0.15s ease;
  }

  .picker-item:hover {
    border-color: var(--theme-color);
    box-shadow: 0 4px 14px -4px rgb(0 0 0 / 14%);
    transform: translateY(-2px);
  }

  .picker-item img {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    background: var(--default-bg-color);
  }

  .picker-name {
    padding: 0 8px 8px;
    overflow: hidden;
    font-size: 13px;
    color: var(--art-gray-700);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .picker-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
</style>
