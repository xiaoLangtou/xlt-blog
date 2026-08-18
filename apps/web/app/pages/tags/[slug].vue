<script setup lang="ts">
import type { TagDto } from '@xlt-blog/shared'

const route = useRoute()
const slug = String(route.params.slug)

const { data: tags } = useApi<TagDto[]>('/tags')
const tag = computed(() => tags.value?.find(t => t.slug === slug))

useSeoMeta({
  title: () => tag.value ? `标签：${tag.value.name}` : '标签'
})
</script>

<template>
  <UContainer class="max-w-6xl py-12">
    <header class="mb-8 border-b border-default/60 pb-6">
      <p class="font-mono text-xs tracking-[0.25em] text-dimmed uppercase mb-3">Tag</p>
      <h1 class="font-display text-3xl text-highlighted tracking-wide">
        # {{ tag?.name ?? slug }}
      </h1>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-12">
      <ArticleList :tag="slug" />

      <div class="hidden lg:block">
        <div class="sticky top-24">
          <BlogSidebar />
        </div>
      </div>
    </div>
  </UContainer>
</template>
