<script setup lang="ts">
import type { CategoryDto, SiteStats, TagDto } from '@xlt-blog/shared'

// 侧栏三份数据并行拉取，SSR 阶段完成
const { data: categories } = useApi<CategoryDto[]>('/categories')
const { data: tags } = useApi<TagDto[]>('/tags')
const { data: stats } = useApi<SiteStats>('/site/stats')

const statItems = computed(() => [
  { label: '文章', value: stats.value?.articleCount ?? 0 },
  { label: '分类', value: stats.value?.categoryCount ?? 0 },
  { label: '标签', value: stats.value?.tagCount ?? 0 },
  { label: '阅读', value: stats.value?.totalViews ?? 0 }
])

// 侧栏仅展示文章数最多的十个标签；同数量时按名称保持稳定顺序。
const topTags = computed(() =>
  [...(tags.value ?? [])]
    .sort((a, b) => (b.articleCount ?? 0) - (a.articleCount ?? 0) || a.name.localeCompare(b.name, 'zh-CN'))
    .slice(0, 10)
)
</script>

<template>
  <aside class="space-y-8">
    <!-- 主理人小卡 -->
    <section class="book-frame rounded-xs p-5 bg-elevated/30">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="font-mono text-[10px] tracking-[0.25em] text-dimmed uppercase mb-2">About</p>
          <p class="font-display text-lg text-highlighted tracking-widest">栖迟主人</p>
          <p class="text-xs text-muted leading-relaxed mt-2">
            写代码，也写下写代码时想到的事。衡门之下，可以栖迟。
          </p>
        </div>
        <span class="seal shrink-0" aria-hidden="true">栖迟</span>
      </div>

      <!-- 站点数据带 -->
      <div class="grid grid-cols-4 border-t border-default/60 mt-4 pt-3">
        <div v-for="item in statItems" :key="item.label" class="text-center">
          <p class="font-display text-base text-highlighted tabular-nums">{{ item.value }}</p>
          <p class="text-[10px] text-dimmed mt-0.5">{{ item.label }}</p>
        </div>
      </div>
    </section>

    <!-- 分类目录：点线连接名称与计数，像目录页 -->
    <section v-if="categories?.length">
      <h2 class="flex items-baseline gap-2 border-b border-default/60 pb-2 mb-3">
        <span class="font-display text-base text-highlighted tracking-widest">分类</span>
        <span class="font-mono text-[10px] tracking-[0.2em] text-dimmed uppercase">Categories</span>
      </h2>
      <ul>
        <li v-for="cat in categories" :key="cat.id">
          <NuxtLink
            :to="`/categories/${cat.slug}`"
            class="group flex items-baseline py-1.5 text-sm"
          >
            <span class="text-muted group-hover:text-primary transition-colors">{{ cat.name }}</span>
            <span class="dot-leader" aria-hidden="true" />
            <span class="font-mono text-xs text-dimmed tabular-nums">{{ cat.articleCount ?? 0 }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- 标签云 -->
    <section v-if="topTags.length">
      <div class="flex items-baseline justify-between gap-3 border-b border-default/60 pb-2 mb-3">
        <h2 class="flex items-baseline gap-2">
          <span class="font-display text-base text-highlighted tracking-widest">热门标签</span>
          <span class="font-mono text-[10px] tracking-[0.2em] text-dimmed uppercase">Top 10</span>
        </h2>
        <NuxtLink to="/tags" class="text-xs text-dimmed hover:text-primary transition-colors">全部</NuxtLink>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="tag in topTags"
          :key="tag.id"
          :to="`/tags/${tag.slug}`"
          class="inline-flex items-baseline gap-1 px-2.5 py-1 rounded-xs border border-default/70 bg-elevated/30 text-xs text-muted hover:text-primary hover:border-primary/50 transition-colors"
        >
          {{ tag.name }}
          <span class="font-mono text-[10px] text-dimmed tabular-nums">{{ tag.articleCount ?? 0 }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- 时间轴入口 -->
    <section class="border border-default/70 rounded-xs px-4 py-3 bg-elevated/20">
      <NuxtLink to="/timeline" class="group flex items-center justify-between text-sm">
        <span class="text-muted group-hover:text-primary transition-colors">按时间浏览全部文章</span>
        <span class="font-mono text-xs text-dimmed group-hover:text-primary transition-colors" aria-hidden="true">-&gt;</span>
      </NuxtLink>
    </section>
  </aside>
</template>
