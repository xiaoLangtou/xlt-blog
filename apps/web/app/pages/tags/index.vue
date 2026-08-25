<script setup lang="ts">
import type { TagDto } from '@xlt-blog/shared'

const keyword = ref('')
const { data: tags, status } = useApi<TagDto[]>('/tags')

const sortedTags = computed(() =>
  [...(tags.value ?? [])].sort(
    (a, b) => (b.articleCount ?? 0) - (a.articleCount ?? 0) || a.name.localeCompare(b.name, 'zh-CN')
  )
)

const normalizedKeyword = computed(() => keyword.value.trim().toLocaleLowerCase('zh-CN'))
const visibleTags = computed(() => {
  if (!normalizedKeyword.value) return sortedTags.value.slice(0, 10)
  return sortedTags.value.filter(tag => tag.name.toLocaleLowerCase('zh-CN').includes(normalizedKeyword.value))
})

useSeoMeta({
  title: '标签',
  description: '按文章数量浏览热门标签，或搜索全部标签'
})
</script>

<template>
  <UContainer class="max-w-6xl py-12">
    <header class="mb-10 border-b border-default/60 pb-6">
      <p class="font-mono text-xs tracking-[0.25em] text-dimmed uppercase mb-3">Tags</p>
      <h1 class="font-display text-3xl text-highlighted tracking-wide">标签</h1>
      <p class="text-sm text-muted mt-2">默认展示文章数最多的 10 个标签；输入关键词可搜索全部标签。</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-12">
      <section>
        <label for="tag-search" class="sr-only">搜索标签</label>
        <div class="relative mb-7">
          <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dimmed pointer-events-none" />
          <input
            id="tag-search"
            v-model="keyword"
            type="search"
            placeholder="搜索标签"
            class="w-full rounded-xs border border-default bg-elevated/20 py-2.5 pl-10 pr-4 text-sm text-default outline-none transition-colors placeholder:text-dimmed focus:border-primary"
          >
        </div>

        <div v-if="status === 'pending'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <USkeleton v-for="index in 6" :key="index" class="h-20 w-full" />
        </div>

        <div v-else-if="visibleTags.length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NuxtLink
            v-for="tag in visibleTags"
            :key="tag.id"
            :to="`/tags/${tag.slug}`"
            class="group flex items-center justify-between gap-4 rounded-xs border border-default/70 bg-elevated/20 px-4 py-3 transition-colors hover:border-primary/50 hover:bg-elevated/50"
          >
            <span class="font-display text-base text-highlighted tracking-wide group-hover:text-primary transition-colors"># {{ tag.name }}</span>
            <span class="font-mono text-xs text-dimmed tabular-nums shrink-0">{{ tag.articleCount ?? 0 }} 篇</span>
          </NuxtLink>
        </div>

        <div v-else class="text-center py-16 border-y border-default/60">
          <p class="font-display text-lg text-muted tracking-widest">未找到匹配标签</p>
          <p class="text-xs text-dimmed mt-2 font-mono">TRY ANOTHER KEYWORD</p>
        </div>
      </section>

      <div class="hidden lg:block">
        <div class="sticky top-24">
          <BlogSidebar />
        </div>
      </div>
    </div>
  </UContainer>
</template>
