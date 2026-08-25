<script setup lang="ts">
import type { ArticleDetailDto } from '@xlt-blog/shared'

interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const config = useRuntimeConfig()

// 文章详情正文由后端完成转换、净化与高亮，前台只渲染安全 HTML。
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
const progress = ref(0)
const contentRef = ref<HTMLElement | null>(null)
const tocItems = ref<TocItem[]>([])
const activeTocId = ref<string | null>(null)
let tocObserver: IntersectionObserver | null = null

useSeoMeta({
  title: () => article.value.title,
  description: () => article.value.summary ?? article.value.title,
  ogTitle: () => article.value.title,
  ogDescription: () => article.value.summary ?? article.value.title,
  ogType: 'article',
  ogImage: () => article.value.cover ?? undefined
})

function formatDate(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (number: number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
}

function onScroll() {
  const page = document.documentElement
  const scrollable = page.scrollHeight - page.clientHeight
  progress.value = scrollable > 0 ? Math.min(page.scrollTop / scrollable, 1) : 0
}

function scrollToHeading(id: string, smooth = true) {
  const heading = contentRef.value?.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
  if (!heading) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  heading.scrollIntoView({ behavior: smooth && !reduceMotion ? 'smooth' : 'auto', block: 'start' })
  activeTocId.value = id
  history.replaceState(null, '', `#${id}`)
}

function buildToc() {
  tocObserver?.disconnect()
  const headings = Array.from(contentRef.value?.querySelectorAll<HTMLElement>('h2, h3') ?? [])

  tocItems.value = headings.flatMap((heading, index) => {
    const text = heading.textContent?.trim()
    if (!text) return []
    const id = `post-${article.value.id}-heading-${index}`
    heading.id = id
    return [{ id, text, level: heading.tagName === 'H2' ? 2 : 3 }]
  })
  activeTocId.value = tocItems.value[0]?.id ?? null

  if (!tocItems.value.length) return
  tocObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter(entry => entry.isIntersecting)
      if (visible.length) activeTocId.value = (visible[0]!.target as HTMLElement).id
    },
    { rootMargin: '-88px 0px -60% 0px' }
  )
  headings.forEach(heading => tocObserver?.observe(heading))

  if (route.hash) {
    requestAnimationFrame(() => scrollToHeading(route.hash.slice(1), false))
  }
}

onMounted(async () => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  await nextTick()
  buildToc()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  tocObserver?.disconnect()
})
</script>

<template>
  <UContainer class="max-w-6xl py-12">
    <div
      class="fixed top-0 left-0 right-0 z-[60] h-0.75 origin-left bg-(--color-cinnabar) transition-transform duration-75 motion-reduce:transition-none"
      :style="{ transform: `scaleX(${progress})` }"
      aria-hidden="true"
    />

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_16rem] gap-10">
      <article v-if="data" class="min-w-0">
        <header class="mb-10">
          <div class="flex flex-wrap items-center gap-x-3 font-mono text-xs tracking-wide text-dimmed mb-5">
            <time>{{ formatDate(article.publishedAt ?? article.createdAt) }}</time>
            <template v-if="article.category">
              <span aria-hidden="true">/</span>
              <NuxtLink :to="`/categories/${article.category.slug}`" class="hover:text-primary transition-colors">
                {{ article.category.name }}
              </NuxtLink>
            </template>
            <span aria-hidden="true">/</span>
            <span>{{ article.views }} 次阅读</span>
          </div>

          <h1 class="font-display text-3xl sm:text-4xl text-highlighted leading-snug tracking-wide">{{ article.title }}</h1>
          <p v-if="article.summary" class="text-muted leading-relaxed mt-4 pl-4 border-l-2 border-(--color-cinnabar)/60">{{ article.summary }}</p>

          <div v-if="article.tags.length" class="flex flex-wrap gap-x-3 mt-5 font-mono text-xs text-dimmed">
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

        <img v-if="article.cover" :src="article.cover" :alt="article.title" class="w-full rounded-xs border border-default/60 mb-10">

        <div ref="contentRef" class="article-content" :class="`editor-${article.editorType}`" v-html="data.html" />

        <div class="flex justify-center my-14" aria-hidden="true"><span class="seal">完</span></div>
        <CommentSection :slug="slug" />
      </article>

      <aside v-if="tocItems.length" class="hidden lg:block">
        <nav class="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto border-l border-default/60 pl-4" aria-label="文章目录">
          <p class="font-mono text-[10px] tracking-[0.25em] text-dimmed uppercase mb-3">Contents</p>
          <ol class="space-y-1">
            <li v-for="item in tocItems" :key="item.id" :class="item.level === 3 ? 'pl-3' : ''">
              <a
                :href="`#${item.id}`"
                class="block border-l -ml-[17px] pl-4 py-1 text-sm leading-relaxed transition-colors"
                :class="activeTocId === item.id ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-highlighted'"
                :aria-current="activeTocId === item.id ? 'location' : undefined"
                @click.prevent="scrollToHeading(item.id)"
              >
                {{ item.text }}
              </a>
            </li>
          </ol>
        </nav>
      </aside>
    </div>
  </UContainer>
</template>
