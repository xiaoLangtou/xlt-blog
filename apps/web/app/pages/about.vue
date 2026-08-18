<script setup lang="ts">
import type { SiteStats } from '@xlt-blog/shared'

const { data: stats } = useApi<SiteStats>('/site/stats')

useSeoMeta({
  title: '关于',
  description: '关于栖迟与站长'
})

const statItems = computed(() => [
  { label: '文章', value: stats.value?.articleCount ?? 0 },
  { label: '分类', value: stats.value?.categoryCount ?? 0 },
  { label: '标签', value: stats.value?.tagCount ?? 0 },
  { label: '累计阅读', value: stats.value?.totalViews ?? 0 }
])

const techRows = [
  { part: '前台', stack: 'Nuxt 4 服务端渲染 + Nuxt UI', note: 'SEO 友好，源码可见正文' },
  { part: '后台', stack: 'Vue 3 + Vite + Nuxt UI Dashboard', note: '写作与审阅的工作台' },
  { part: '服务', stack: 'NestJS + MikroORM + MySQL', note: '统一响应，令牌鉴权' }
]
</script>

<template>
  <UContainer class="max-w-6xl py-12">
    <header class="mb-10 border-b border-default/60 pb-6">
      <p class="font-mono text-xs tracking-[0.25em] text-dimmed uppercase mb-3">About</p>
      <h1 class="font-display text-3xl text-highlighted tracking-wide">
        关于
      </h1>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-12">
      <div class="space-y-10">
        <!-- 刊名故事：书框装帧，左文右竖排 -->
        <section class="book-frame rounded-xs bg-elevated/20 p-7 sm:p-9 flex gap-8">
          <div class="space-y-5 text-default leading-loose min-w-0">
            <p>
              你好，这里是<strong class="font-display">栖迟</strong>。刊名取自《诗经·陈风·衡门》——
              「衡门之下，可以栖迟」，意为简陋的居所也可以安然栖息。
            </p>
            <p>
              这里主要记录 Web 开发相关的内容：Vue / Nuxt、Node.js / NestJS、数据库与各种工程实践，
              偶尔也写些代码之外的想法。文章支持 Markdown 与代码高亮，欢迎在文章底部留言交流（评论审核后展示）。
            </p>
          </div>
          <div class="hidden sm:flex items-start gap-3 shrink-0" aria-hidden="true">
            <p class="vertical-text font-display text-sm text-dimmed select-none">
              衡门之下可以栖迟
            </p>
            <span class="seal mt-1">栖迟</span>
          </div>
        </section>

        <!-- 站点计数 -->
        <section v-if="stats" class="grid grid-cols-2 sm:grid-cols-4 border border-default/70 rounded-xs divide-x divide-y sm:divide-y-0 divide-default/70 overflow-hidden">
          <div v-for="item in statItems" :key="item.label" class="text-center py-6 bg-elevated/20">
            <p class="font-display text-3xl text-highlighted tabular-nums">{{ item.value }}</p>
            <p class="text-xs text-dimmed mt-1.5 tracking-widest">{{ item.label }}</p>
          </div>
        </section>

        <!-- 技术栈：目录点线表 -->
        <section>
          <h2 class="flex items-baseline gap-2 border-b border-default/60 pb-2 mb-4">
            <span class="font-display text-lg text-highlighted tracking-widest">这座站是怎么搭起来的</span>
            <span class="font-mono text-[10px] tracking-[0.2em] text-dimmed uppercase">Colophon</span>
          </h2>
          <ul class="space-y-3">
            <li v-for="row in techRows" :key="row.part" class="flex items-baseline text-sm">
              <span class="font-mono text-xs text-dimmed shrink-0 w-10">{{ row.part }}</span>
              <span class="text-default shrink-0">{{ row.stack }}</span>
              <span class="dot-leader" aria-hidden="true" />
              <span class="text-xs text-muted shrink-0 hidden sm:inline">{{ row.note }}</span>
            </li>
          </ul>
        </section>
      </div>

      <div class="hidden lg:block">
        <div class="sticky top-24">
          <BlogSidebar />
        </div>
      </div>
    </div>
  </UContainer>
</template>
