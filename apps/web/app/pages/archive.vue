<script setup lang="ts">
import type { ArchiveGroup } from '@xlt-blog/shared'

const { data: groups, pending } = useApi<ArchiveGroup[]>('/archive')

const total = computed(() => groups.value?.reduce((sum, g) => sum + g.articles.length, 0) ?? 0)

useSeoMeta({
  title: '归档',
  description: '按时间浏览全部文章'
})

function formatDay(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}
</script>

<template>
  <UContainer class="max-w-6xl py-12">
    <header class="mb-10 border-b border-default/60 pb-6">
      <p class="font-mono text-xs tracking-[0.25em] text-dimmed uppercase mb-3">Archive</p>
      <h1 class="font-display text-3xl text-highlighted tracking-wide">
        归档
      </h1>
      <p class="text-sm text-muted mt-2">
        共 {{ total }} 篇文章，按时间倒序
      </p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-12">
      <div>
        <div v-if="pending" class="space-y-4">
          <USkeleton v-for="i in 5" :key="i" class="h-8 w-full" />
        </div>

        <div v-else-if="groups?.length" class="space-y-14">
          <section v-for="group in groups" :key="`${group.year}-${group.month}`" class="relative">
            <!-- 年月水印：宋体大字做背景层 -->
            <span
              class="absolute -top-6 right-0 font-display text-6xl text-default/6 dark:text-white/4 select-none pointer-events-none tabular-nums"
              aria-hidden="true"
            >
              {{ group.year }}.{{ String(group.month).padStart(2, '0') }}
            </span>

            <h2 class="font-display text-lg text-highlighted tracking-wide mb-5">
              {{ group.year }} 年 {{ group.month }} 月
              <span class="font-mono text-xs font-normal text-dimmed ml-2">{{ group.articles.length }} 篇</span>
            </h2>
            <ul class="space-y-1 border-l border-default/60 pl-5">
              <li v-for="article in group.articles" :key="article.slug" class="relative">
                <span class="absolute -left-[23px] top-3.5 size-1.5 rounded-full bg-(--color-cinnabar)/70" />
                <NuxtLink
                  :to="`/posts/${article.slug}`"
                  class="flex items-baseline gap-3 group py-1.5 px-2 -mx-2 rounded-xs transition-colors hover:bg-elevated/40"
                >
                  <time class="font-mono text-xs text-dimmed tabular-nums shrink-0">
                    {{ formatDay(article.publishedAt) }}
                  </time>
                  <span class="text-default group-hover:text-primary transition-colors min-w-0 truncate">
                    {{ article.title }}
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </section>
        </div>

        <div v-else class="text-center py-20">
          <p class="font-display text-lg text-muted tracking-widest">此处尚无文章</p>
          <p class="text-xs text-dimmed mt-2 font-mono">NOTHING PUBLISHED YET</p>
        </div>
      </div>

      <div class="hidden lg:block">
        <div class="sticky top-24">
          <BlogSidebar />
        </div>
      </div>
    </div>
  </UContainer>
</template>
