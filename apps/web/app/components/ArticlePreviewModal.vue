<script setup lang="ts">
  import type { ArticleDetailDto } from '@xlt-blog/shared'
  import { renderMarkdown } from '~/utils/markdown'

  const props = defineProps<{
    slug: string
  }>()

  const isOpen = defineModel<boolean>('open', { required: true })

  const { data: article, status } = useApi<ArticleDetailDto>(`/articles/${props.slug}`, {
    immediate: computed(() => isOpen.value)
  })

  const renderedContent = ref('')
  const renderingContent = ref(false)
  const renderError = ref(false)

  watch(
    () => [article.value?.content, article.value?.codeTheme, article.value?.contentFormat] as const,
    async ([content, codeTheme, contentFormat]) => {
      if (!content) {
        renderedContent.value = ''
        return
      }

      renderingContent.value = true
      renderError.value = false
      try {
        renderedContent.value = await renderMarkdown(content, codeTheme, contentFormat)
      } catch {
        renderedContent.value = ''
        renderError.value = true
      } finally {
        renderingContent.value = false
      }
    },
    { immediate: true }
  )

  function formatDate(value: string | null) {
    if (!value) return ''
    const d = new Date(value)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
  }
</script>

<template>
  <UModal v-model="isOpen" :ui="{ width: 'max-w-4xl' }">
    <div class="p-6">
      <template v-if="status === 'pending' && !article">
        <div class="space-y-4">
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-2/3" />
        </div>
      </template>

      <template v-else-if="article">
        <!-- 头部信息 -->
        <div class="border-b border-default/60 pb-4 mb-6">
          <div
            class="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.18em] text-dimmed uppercase mb-2"
          >
            <span>预览</span>
            <span aria-hidden="true">/</span>
            <time>{{ formatDate(article.publishedAt ?? article.createdAt) }}</time>
            <template v-if="article.category">
              <span aria-hidden="true">/</span>
              <span>{{ article.category.name }}</span>
            </template>
          </div>

          <h1 class="font-display text-2xl text-highlighted leading-snug tracking-wide mb-3">
            {{ article.title }}
          </h1>

          <p v-if="article.summary" class="text-sm text-muted leading-relaxed">
            {{ article.summary }}
          </p>

          <div
            v-if="article.tags.length"
            class="flex flex-wrap gap-x-2.5 mt-3 font-mono text-[10px] tracking-wide text-dimmed"
          >
            <span v-for="tag in article.tags" :key="tag.id"># {{ tag.name }}</span>
          </div>
        </div>

        <!-- 封面图 -->
        <div v-if="article.cover" class="mb-6">
          <img
            :src="article.cover"
            :alt="article.title"
            class="w-full max-h-96 object-cover rounded-xs border border-default/60"
          />
        </div>

        <!-- 文章内容预览 -->
        <div class="markdown-body max-h-[52vh] overflow-y-auto pr-2 text-muted leading-relaxed">
          <div v-if="renderingContent" class="space-y-4">
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-5/6" />
            <USkeleton class="h-4 w-2/3" />
          </div>
          <p v-else-if="renderError" class="text-muted">文章内容渲染失败</p>
          <div v-else v-html="renderedContent" />
        </div>

        <!-- 底部操作 -->
        <div class="flex items-center justify-between pt-6 mt-6 border-t border-default/60">
          <div class="text-xs text-dimmed font-mono">
            <span>{{ article.views }} 次浏览</span>
          </div>

          <div class="flex gap-3">
            <UButton variant="outline" color="neutral" @click="isOpen = false"> 关闭 </UButton>
            <UButton :to="`/posts/${article.slug}`" @click="isOpen = false"> 阅读全文 </UButton>
          </div>
        </div>
      </template>

      <div v-else class="text-center py-10">
        <p class="text-muted">文章加载失败</p>
      </div>
    </div>
  </UModal>
</template>
