<script setup lang="ts">
useSeoMeta({
  title: '首页',
  description: '栖迟 —— 记录技术与生活的个人博客'
})
</script>

<template>
  <UContainer class="max-w-6xl">
    <!-- 刊头：竖排 slogan + 朱砂印，中文刊物的开篇 -->
    <section class="flex items-stretch justify-between gap-8 pt-14 pb-12 border-b border-default/60">
      <div class="flex flex-col justify-between">
        <h1 class="font-display text-4xl sm:text-5xl text-highlighted tracking-wide leading-tight">
          衡门之下<br>可以栖迟
        </h1>
        <p class="text-sm text-muted mt-6 leading-relaxed max-w-md">
          一份关于 Web 开发与日常思考的个人志。写代码，也写下写代码时想到的事。
        </p>
      </div>

      <div class="hidden sm:flex items-start gap-3 shrink-0" aria-hidden="true">
        <p class="vertical-text font-display text-sm text-dimmed select-none">
          诗经·陈风·衡门
        </p>
        <span class="seal mt-1">栖迟</span>
      </div>
    </section>

    <!-- 两栏：文章流 + 侧栏 -->
    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-12 pt-10 pb-4">
      <ArticleList featured-first />

      <div class="hidden lg:block">
        <div class="sticky top-24">
          <BlogSidebar />
        </div>
      </div>
    </div>
  </UContainer>
</template>
