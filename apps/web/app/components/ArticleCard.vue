<script setup lang="ts">
import type { ArticleListItemDto } from '@xlt-blog/shared'

const props = defineProps<{
  article: ArticleListItemDto
  /** 头条模式：本期首篇的大幅排版 */
  featured?: boolean
}>()

function formatDate(value: string | null) {
  if (!value) {
    return ''
  }
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

// 动画配置
const cardAnimation = props.featured ? {
  initial: { opacity: 0, y: 40 },
  visibleOnce: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 600,
      ease: 'easeOut'
    }
  }
} : {
  initial: { opacity: 0, x: -20 },
  visibleOnce: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 400,
      ease: 'easeOut'
    }
  }
}

// 预览模态框
const showPreview = ref(false)

function handlePreview(event: MouseEvent) {
  // 仅在按住 Ctrl/Cmd 键点击时显示预览
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    showPreview.value = true
  }
}
</script>

<template>
  <!-- 头条：书框大卡，封面通栏 -->
  <article v-if="featured" v-motion="cardAnimation" class="group">
    <NuxtLink
      :to="`/posts/${article.slug}`"
      class="book-frame rounded-xs block overflow-hidden bg-elevated/20 transition-all duration-300 hover:bg-elevated/40 hover:shadow-lg hover:-translate-y-1 motion-reduce:hover:translate-y-0"
      @click="handlePreview"
    >
      <div v-if="article.cover" class="overflow-hidden border-b border-default/60">
        <img
          :src="article.cover"
          :alt="article.title"
          class="w-full h-36 sm:h-44 object-cover grayscale-25 group-hover:grayscale-0 group-hover:scale-105 transition-[filter,transform] duration-500 motion-reduce:transition-none"
        >
      </div>

      <div class="p-4 sm:p-5">
        <div class="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.18em] text-dimmed uppercase mb-2.5">
          <span class="text-(--color-cinnabar)">本期头条</span>
          <span aria-hidden="true">/</span>
          <time>{{ formatDate(article.publishedAt ?? article.createdAt) }}</time>
          <template v-if="article.category">
            <span aria-hidden="true">/</span>
            <span>{{ article.category.name }}</span>
          </template>
        </div>

        <h2 class="font-display text-lg sm:text-xl text-highlighted leading-snug tracking-wide transition-colors group-hover:text-primary">
          {{ article.title }}
        </h2>

        <p v-if="article.summary" class="text-[13px] text-muted leading-relaxed line-clamp-2 mt-2 max-w-2xl">
          {{ article.summary }}
        </p>

        <div class="flex items-center justify-between mt-4">
          <div class="flex flex-wrap gap-x-2.5 font-mono text-[10px] tracking-wide text-dimmed">
            <span v-for="tag in article.tags" :key="tag.id"># {{ tag.name }}</span>
          </div>
          <span class="font-mono text-xs text-dimmed group-hover:text-primary transition-colors shrink-0" aria-hidden="true">
            读全文 -&gt;
          </span>
        </div>
      </div>
    </NuxtLink>
    
    <ArticlePreviewModal v-model:open="showPreview" :slug="article.slug" />
  </article>

  <!-- 普通条目：目录式，hover 有底色 -->
  <article v-else v-motion="cardAnimation" class="group">
    <NuxtLink
      :to="`/posts/${article.slug}`"
      class="block py-3 px-3 -mx-3 rounded-xs transition-all duration-200 hover:bg-elevated/40 hover:shadow-sm hover:translate-x-1 motion-reduce:hover:translate-x-0"
      @click="handlePreview"
    >
      <div class="flex items-baseline gap-3">
        <time class="font-mono text-[11px] text-dimmed tabular-nums shrink-0 pt-0.5">
          {{ formatDate(article.publishedAt ?? article.createdAt) }}
        </time>

        <div class="min-w-0 flex-1">
          <h2 class="font-display text-base text-highlighted leading-snug transition-colors group-hover:text-primary">
            <!-- hover 时滑出的短墨线 -->
            <span
              class="inline-block w-0 group-hover:w-4 h-px bg-(--color-cinnabar) align-middle mr-0 group-hover:mr-2 transition-all duration-300 motion-reduce:transition-none"
              aria-hidden="true"
            />{{ article.title }}
          </h2>

          <p v-if="article.summary" class="text-xs text-muted leading-relaxed line-clamp-1 mt-1">
            {{ article.summary }}
          </p>

          <div class="flex flex-wrap items-center gap-x-2 mt-2 font-mono text-[10px] tracking-wide text-dimmed">
            <span v-if="article.category">{{ article.category.name }}</span>
            <span v-if="article.category && article.tags.length" aria-hidden="true">·</span>
            <span v-for="tag in article.tags" :key="tag.id"># {{ tag.name }}</span>
          </div>
        </div>

        <div
          v-if="article.cover"
          class="hidden sm:block w-20 h-14 shrink-0 overflow-hidden rounded-xs border border-default/60 transition-transform duration-300 group-hover:scale-105"
        >
          <img
            :src="article.cover"
            :alt="article.title"
            class="w-full h-full object-cover grayscale-25 group-hover:grayscale-0 transition-[filter] duration-300 motion-reduce:transition-none"
          >
        </div>
      </div>
    </NuxtLink>
    
    <ArticlePreviewModal v-model:open="showPreview" :slug="article.slug" />
  </article>
</template>
