<script setup lang="ts">
import type { ColumnDetailDto } from '@xlt-blog/shared'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const { data: column, status, error } = useApi<ColumnDetailDto>(() => `/columns/${encodeURIComponent(slug.value)}`)

watch(error, (value) => {
  if (value) throw createError({ statusCode: 404, statusMessage: '专栏不存在', fatal: true })
})

useSeoMeta({
  title: () => column.value ? `专栏：${column.value.name}` : '专栏',
  description: () => column.value?.description ?? undefined
})

function formatDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<template>
  <UContainer class="max-w-6xl py-12">
    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-12">
      <section>
        <template v-if="status === 'pending'">
          <USkeleton class="h-10 w-56 mb-5" />
          <USkeleton class="h-5 w-full max-w-xl mb-10" />
          <div class="space-y-4"><USkeleton v-for="index in 4" :key="index" class="h-24 w-full" /></div>
        </template>

        <template v-else-if="column">
          <header class="mb-10 border-b border-default/60 pb-6">
            <p class="font-mono text-xs tracking-[0.25em] text-dimmed uppercase mb-3">Column</p>
            <h1 class="font-display text-3xl text-highlighted tracking-wide">{{ column.name }}</h1>
            <p v-if="column.description" class="text-sm text-muted leading-relaxed mt-3 max-w-2xl">{{ column.description }}</p>
          </header>

          <img
            v-if="column.cover"
            :src="column.cover"
            :alt="column.name"
            class="w-full max-h-90 object-cover rounded-xs border border-default/60 mb-8"
          >

          <ol v-if="column.articles.length" class="border-l border-default/60 pl-5 space-y-2">
            <li v-for="(article, index) in column.articles" :key="article.id" class="relative">
              <span class="absolute -left-[23px] top-5 size-1.5 rounded-full bg-(--color-cinnabar)/70" />
              <NuxtLink
                :to="`/posts/${article.slug}`"
                class="group block rounded-xs px-4 py-3 transition-colors hover:bg-elevated/40"
              >
                <div class="flex items-baseline gap-3">
                  <span class="font-mono text-xs text-dimmed tabular-nums">{{ String(index + 1).padStart(2, '0') }}</span>
                  <h2 class="font-display text-lg text-highlighted tracking-wide group-hover:text-primary transition-colors">{{ article.title }}</h2>
                </div>
                <p v-if="article.summary" class="text-sm text-muted leading-relaxed mt-2 line-clamp-2">{{ article.summary }}</p>
                <time v-if="article.publishedAt" class="block font-mono text-[10px] text-dimmed mt-3">{{ formatDate(article.publishedAt) }}</time>
              </NuxtLink>
            </li>
          </ol>

          <div v-else class="text-center py-16 border-y border-default/60">
            <p class="font-display text-lg text-muted tracking-widest">这个专栏尚未收录文章</p>
          </div>
        </template>
      </section>

      <div class="hidden lg:block">
        <div class="sticky top-24">
          <BlogSidebar />
        </div>
      </div>
    </div>
  </UContainer>
</template>
