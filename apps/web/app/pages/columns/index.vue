<script setup lang="ts">
import type { ColumnDto } from '@xlt-blog/shared'

const { data: columns, status } = useApi<ColumnDto[]>('/columns')

useSeoMeta({
  title: '专栏',
  description: '按主题编排的系列文章'
})
</script>

<template>
  <UContainer class="max-w-6xl py-12">
    <header class="mb-10 border-b border-default/60 pb-6">
      <p class="font-mono text-xs tracking-[0.25em] text-dimmed uppercase mb-3">Columns</p>
      <h1 class="font-display text-3xl text-highlighted tracking-wide">专栏</h1>
      <p class="text-sm text-muted mt-2">按主题编排，循序阅读。</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-12">
      <section>
        <div v-if="status === 'pending'" class="grid sm:grid-cols-2 gap-5">
          <USkeleton v-for="index in 4" :key="index" class="h-64 w-full" />
        </div>

        <div v-else-if="columns?.length" class="grid sm:grid-cols-2 gap-5">
          <NuxtLink
            v-for="column in columns"
            :key="column.id"
            :to="`/columns/${column.slug}`"
            class="group overflow-hidden rounded-xs border border-default/70 bg-elevated/20 transition-colors hover:border-primary/50"
          >
            <img
              v-if="column.cover"
              :src="column.cover"
              :alt="column.name"
              class="h-40 w-full object-cover border-b border-default/60"
            >
            <div class="p-5">
              <p class="font-mono text-[10px] tracking-[0.22em] text-dimmed uppercase mb-3">Column</p>
              <h2 class="font-display text-xl text-highlighted tracking-wide group-hover:text-primary transition-colors">
                {{ column.name }}
              </h2>
              <p v-if="column.description" class="text-sm text-muted leading-relaxed mt-3 line-clamp-3">
                {{ column.description }}
              </p>
              <span class="inline-flex items-center gap-2 mt-5 text-xs text-dimmed group-hover:text-primary transition-colors">
                阅读专栏 <span aria-hidden="true">-&gt;</span>
              </span>
            </div>
          </NuxtLink>
        </div>

        <div v-else class="text-center py-20">
          <p class="font-display text-lg text-muted tracking-widest">此处尚无专栏</p>
          <p class="text-xs text-dimmed mt-2 font-mono">NO COLUMNS YET</p>
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
