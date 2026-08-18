<script setup lang="ts">
import type { ArticleListItemDto, Paginated } from '@xlt-blog/shared'

const props = defineProps<{
  category?: string
  tag?: string
  keyword?: string
  /** 首页模式：第一页首篇以头条大卡展示 */
  featuredFirst?: boolean
}>()

const route = useRoute()
const router = useRouter()

const page = computed(() => Number(route.query.page) || 1)
const pageSize = 10

const { data, status } = useApi<Paginated<ArticleListItemDto>>('/articles', {
  query: computed(() => ({
    page: page.value,
    pageSize,
    category: props.category || undefined,
    tag: props.tag || undefined,
    keyword: props.keyword || undefined
  })),
  watch: [() => route.query.page]
})

function onPageChange(newPage: number) {
  router.push({ query: { ...route.query, page: newPage === 1 ? undefined : newPage } })
}

// 头条仅在首页第一页启用
const showFeatured = computed(() => Boolean(props.featuredFirst) && page.value === 1)
const featured = computed(() => showFeatured.value ? data.value?.items[0] ?? null : null)
const rest = computed(() => showFeatured.value ? data.value?.items.slice(1) ?? [] : data.value?.items ?? [])
</script>

<template>
  <div>
    <template v-if="status === 'pending' && !data">
      <div class="divide-y divide-default/60">
        <USkeleton v-for="i in 3" :key="i" class="h-28 w-full my-4" />
      </div>
    </template>

    <template v-else-if="data?.items.length">
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

      <div v-if="data.total > pageSize" class="flex justify-center pt-10">
        <UPagination
          :page="page"
          :items-per-page="pageSize"
          :total="data.total"
          @update:page="onPageChange"
        />
      </div>
    </template>

    <div v-else class="text-center py-20">
      <p class="font-display text-lg text-muted tracking-widest">此处尚无文章</p>
      <p class="text-xs text-dimmed mt-2 font-mono">NOTHING PUBLISHED YET</p>
    </div>
  </div>
</template>
