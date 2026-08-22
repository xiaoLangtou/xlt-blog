<script setup lang="ts">
  import type { ArticleDetailDto } from '@xlt-blog/shared'

  const route = useRoute()
  const slug = computed(() => String(route.params.slug))

  const config = useRuntimeConfig()

  // 文章详情 SSR 取数：正文为后端统一渲染的安全 HTML（转换 + 净化 + Shiki），
  // 前台直接渲染，保证查看源码可见正文且各编辑器产物表现一致
  const { data, error } = await useAsyncData(`post-${slug.value}`, async () => {
    const res = await $fetch<{ data: ArticleDetailDto }>(`/articles/${slug.value}`, {
      baseURL: import.meta.server ? config.apiBase : config.public.apiBase
    })
    return { article: res.data, html: res.data.renderHtml }
  })

  if (error.value || !data.value) {
    throw createError({ statusCode: 404, statusMessage: '文章不存在', fatal: true })
  }

  const article = computed(() => data.value!.article)

  useSeoMeta({
    title: () => article.value.title,
    description: () => article.value.summary ?? article.value.title,
    ogTitle: () => article.value.title,
    ogDescription: () => article.value.summary ?? article.value.title,
    ogType: 'article',
    ogImage: () => article.value.cover ?? undefined
  })

  function formatDate(value: string | null) {
    if (!value) {
      return ''
    }
    const d = new Date(value)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
  }

  // 阅读进度：顶部朱砂细条
  const progress = ref(0)

  function onScroll() {
    const el = document.documentElement
    const scrollable = el.scrollHeight - el.clientHeight
    progress.value = scrollable > 0 ? Math.min(el.scrollTop / scrollable, 1) : 0
  }

  onMounted(() => {
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
  })
</script>

<template>
  <UContainer class="max-w-3xl py-12">
    <!-- 阅读进度条 -->
    <div
      class="fixed top-0 left-0 right-0 z-[60] h-0.75 origin-left bg-(--color-cinnabar) transition-transform duration-75 motion-reduce:transition-none"
      :style="{ transform: `scaleX(${progress})` }"
      aria-hidden="true"
    />

    <article v-if="data">
      <header class="mb-10">
        <!-- 元信息眉行：日期 / 分类 / 阅读量，等宽小字 -->
        <div
          class="flex flex-wrap items-center gap-x-3 font-mono text-xs tracking-wide text-dimmed mb-5"
        >
          <time>{{ formatDate(article.publishedAt ?? article.createdAt) }}</time>
          <template v-if="article.category">
            <span aria-hidden="true">/</span>
            <NuxtLink
              :to="`/categories/${article.category.slug}`"
              class="hover:text-primary transition-colors"
            >
              {{ article.category.name }}
            </NuxtLink>
          </template>
          <span aria-hidden="true">/</span>
          <span>{{ article.views }} 次阅读</span>
        </div>

        <h1 class="font-display text-3xl sm:text-4xl text-highlighted leading-snug tracking-wide">
          {{ article.title }}
        </h1>

        <p
          v-if="article.summary"
          class="text-muted leading-relaxed mt-4 pl-4 border-l-2 border-(--color-cinnabar)/60"
        >
          {{ article.summary }}
        </p>

        <div
          v-if="article.tags.length"
          class="flex flex-wrap gap-x-3 mt-5 font-mono text-xs text-dimmed"
        >
          <NuxtLink
            v-for="tag in article.tags"
            :key="tag.id"
            :to="`/tags/${tag.slug}`"
            class="hover:text-primary transition-colors"
          >
            # {{ tag.name }}
          </NuxtLink>
        </div>
      </header>

      <img
        v-if="article.cover"
        :src="article.cover"
        :alt="article.title"
        class="w-full rounded-xs border border-default/60 mb-10"
      />

      <!-- 后端渲染结果：已在保存/发布时完成转换、净化与高亮 -->
      <div
        class="article-content"
        :class="`editor-${article.editorType}`"
        v-html="data.html"
      />

      <!-- 文末收束：居中小印代替分隔线 -->
      <div class="flex justify-center my-14" aria-hidden="true">
        <span class="seal">完</span>
      </div>

      <CommentSection :slug="slug" />
    </article>
  </UContainer>
</template>
