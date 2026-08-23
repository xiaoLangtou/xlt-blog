<script setup lang="ts">
import type { ArticleListItemDto, Paginated } from '@xlt-blog/shared'

const props = defineProps<{
  category?: string
  tag?: string
  keyword?: string
  /** 首页模式：首篇以头条大卡展示 */
  featuredFirst?: boolean
}>()

const pageSize = 10

const filterQuery = computed(() => ({
  category: props.category || undefined,
  tag: props.tag || undefined,
  keyword: props.keyword || undefined
}))

// 首屏第一页：保留 SSR 渲染，利于首屏与 SEO
const { data, status } = useApi<Paginated<ArticleListItemDto>>('/articles', {
  query: computed(() => ({ page: 1, pageSize, ...filterQuery.value })),
  watch: [filterQuery]
})

// 累积列表
const items = ref<ArticleListItemDto[]>([])
const total = ref(0)
const page = ref(1)
const loadingMore = ref(false)

// 首屏结果用于初始化/在筛选变化时重置累积列表
watch(
  data,
  (val) => {
    if (!val) return
    items.value = val.items
    total.value = val.total
    page.value = 1
  },
  { immediate: true }
)

const hasMore = computed(() => items.value.length < total.value)

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    const next = page.value + 1
    const res = await apiFetch<Paginated<ArticleListItemDto>>('/articles', {
      query: { page: next, pageSize, ...filterQuery.value }
    })
    items.value = [...items.value, ...res.items]
    total.value = res.total
    page.value = next
  } finally {
    loadingMore.value = false
  }
}

// 触底自动加载
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) loadMore()
    },
    { rootMargin: '240px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)
})

watch(sentinel, (el) => {
  observer?.disconnect()
  if (el && observer) observer.observe(el)
})

onBeforeUnmount(() => observer?.disconnect())

// 头条仅在首页启用，取累积列表首篇
const showFeatured = computed(() => Boolean(props.featuredFirst))
const featured = computed(() => (showFeatured.value ? items.value[0] ?? null : null))
const rest = computed(() => (showFeatured.value ? items.value.slice(1) : items.value))
</script>

<template>
  <div>
    <template v-if="status === 'pending' && !items.length">
      <div class="divide-y divide-default/60">
        <USkeleton v-for="i in 3" :key="i" class="h-28 w-full my-4" />
      </div>
    </template>

    <template v-else-if="items.length">
      <ArticleCard v-if="featured" :article="featured" featured class="mb-10" />

      <template v-if="rest.length">
        <!-- 目录栏头 -->
        <div v-if="featured" class="flex items-baseline gap-2 border-b border-default/60 pb-2">
          <span class="font-display text-base text-highlighted tracking-widest">更多文章</span>
          <span class="font-mono text-[10px] tracking-[0.2em] text-dimmed uppercase">Contents</span>
        </div>

        <div class="divide-y divide-default/60">
          <ArticleCard
            v-for="article in rest"
            :key="article.id"
            :article="article"
          />
        </div>
      </template>

      <!-- 触底加载哨兵与状态 -->
      <div v-if="hasMore" ref="sentinel" class="flex justify-center pt-10">
        <div class="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-dimmed uppercase">
          <UIcon name="i-lucide-loader-circle" class="animate-spin" />
          <span>{{ loadingMore ? '加载中' : '下拉加载更多' }}</span>
        </div>
      </div>
      <div v-else class="text-center pt-10 font-mono text-[10px] tracking-[0.25em] text-dimmed uppercase">
        没有更多了
      </div>
    </template>

    <div v-else class="text-center py-20">
      <p class="font-display text-lg text-muted tracking-widest">此处尚无文章</p>
      <p class="text-xs text-dimmed mt-2 font-mono">NOTHING PUBLISHED YET</p>
    </div>
  </div>
</template>
