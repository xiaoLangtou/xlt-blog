<script setup lang="ts">
import { CodeTheme, type PageDto } from '@xlt-blog/shared'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const config = useRuntimeConfig()

// SSR 阶段完成取数与 Markdown 渲染，保证查看源码可见正文
const { data, error } = await useAsyncData(`page-${slug.value}`, async () => {
  const res = await $fetch<{ data: PageDto }>(`/pages/${slug.value}`, {
    baseURL: config.public.apiBase
  })
  const page = res.data
  const html = await renderMarkdown(page.content, CodeTheme.Github, page.contentFormat)
  return { page, html }
})

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: '页面不存在', fatal: true })
}

const page = computed(() => data.value!.page)

useSeoMeta({
  title: () => page.value.title,
  description: () => page.value.title,
  ogTitle: () => page.value.title
})

function formatDate(value: string) {
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}
</script>

<template>
  <UContainer class="max-w-3xl py-12">
    <article v-if="data">
      <!-- 书框页头：与文章详情区分，标示这是常设页面 -->
      <header class="book-frame px-7 py-8 mb-10 text-center">
        <p class="font-mono text-[10px] tracking-[0.25em] text-dimmed uppercase mb-3">Page</p>
        <h1 class="font-display text-3xl text-highlighted tracking-wide leading-snug">
          {{ page.title }}
        </h1>
        <p class="font-mono text-xs text-dimmed mt-4 tabular-nums">
          修订于 {{ formatDate(page.updatedAt) }}
        </p>
      </header>

      <div class="markdown-body" v-html="data.html" />

      <div class="flex justify-center my-14" aria-hidden="true">
        <span class="seal">栖迟</span>
      </div>
    </article>
  </UContainer>
</template>
