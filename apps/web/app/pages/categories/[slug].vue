<script setup lang="ts">
import type { CategoryDto } from '@xlt-blog/shared'

const route = useRoute()
const slug = String(route.params.slug)

const { data: categories } = useApi<CategoryDto[]>('/categories')
const category = computed(() => categories.value?.find(c => c.slug === slug))

useSeoMeta({
  title: () => category.value ? `分类：${category.value.name}` : '分类',
  description: () => category.value?.description ?? undefined
})
</script>

<template>
  <UContainer class="max-w-6xl py-12">
    <header class="mb-8 border-b border-default/60 pb-6">
      <p class="font-mono text-xs tracking-[0.25em] text-dimmed uppercase mb-3">Category</p>
      <h1 class="font-display text-3xl text-highlighted tracking-wide">
        {{ category?.name ?? slug }}
      </h1>
      <p v-if="category?.description" class="text-sm text-muted mt-2">
        {{ category.description }}
      </p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-12">
      <ArticleList :category="slug" />

      <div class="hidden lg:block">
        <div class="sticky top-24">
          <BlogSidebar />
        </div>
      </div>
    </div>
  </UContainer>
</template>
