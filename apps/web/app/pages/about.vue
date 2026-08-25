<script setup lang="ts">
import type { ResumeDto, SiteStats } from '@xlt-blog/shared'

const { data: resume } = useApi<ResumeDto>('/site/resume')
const { data: stats } = useApi<SiteStats>('/site/stats')

useSeoMeta({
  title: () => resume.value?.profile.name ? `关于 ${resume.value.profile.name}` : '关于',
  description: () => resume.value?.profile.summary ?? '关于栖迟与站长'
})

const statItems = computed(() => [
  { label: '文章', value: stats.value?.articleCount ?? 0 },
  { label: '分类', value: stats.value?.categoryCount ?? 0 },
  { label: '标签', value: stats.value?.tagCount ?? 0 },
  { label: '累计阅读', value: stats.value?.totalViews ?? 0 }
])

function formatRange(start: string, end: string) {
  return [start, end].filter(Boolean).join(' — ')
}
</script>

<template>
  <UContainer class="max-w-6xl py-12">
    <header class="mb-10 border-b border-default/60 pb-6">
      <p class="font-mono text-xs tracking-[0.25em] text-dimmed uppercase mb-3">Resume</p>
      <h1 class="font-display text-3xl text-highlighted tracking-wide">关于我</h1>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-12">
      <div v-if="resume" class="space-y-12">
        <section class="book-frame rounded-xs bg-elevated/20 p-7 sm:p-9">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-7">
            <div>
              <p class="font-mono text-[10px] tracking-[0.25em] text-dimmed uppercase mb-3">Profile</p>
              <h2 class="font-display text-3xl text-highlighted tracking-widest">{{ resume.profile.name }}</h2>
              <p class="text-primary mt-2">{{ resume.profile.headline }}</p>
              <p v-if="resume.profile.summary" class="text-sm text-muted leading-relaxed mt-5 max-w-2xl">{{ resume.profile.summary }}</p>
            </div>
            <span class="seal shrink-0 self-start" aria-hidden="true">履历</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 border-t border-default/60 mt-7 pt-5 gap-y-4">
            <div><p class="font-mono text-[10px] text-dimmed tracking-widest">经验</p><p class="text-sm text-default mt-1">{{ resume.profile.experience }}</p></div>
            <div><p class="font-mono text-[10px] text-dimmed tracking-widest">学历</p><p class="text-sm text-default mt-1">{{ resume.profile.education }}</p></div>
            <div><p class="font-mono text-[10px] text-dimmed tracking-widest">状态</p><p class="text-sm text-default mt-1">{{ resume.profile.availability }}</p></div>
            <div><p class="font-mono text-[10px] text-dimmed tracking-widest">所在地</p><p class="text-sm text-default mt-1">{{ resume.profile.location }}</p></div>
          </div>
        </section>

        <section class="grid grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)] border-y border-default/60 py-6 gap-4">
          <p class="font-mono text-[10px] tracking-[0.25em] text-dimmed uppercase">Opportunity</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div><p class="text-xs text-dimmed">期望职位</p><p class="text-sm text-highlighted mt-1">{{ resume.desiredPosition.position }}</p></div>
            <div><p class="text-xs text-dimmed">行业</p><p class="text-sm text-highlighted mt-1">{{ resume.desiredPosition.industry }}</p></div>
            <div><p class="text-xs text-dimmed">期望薪资</p><p class="text-sm text-highlighted mt-1">{{ resume.desiredPosition.salary }}</p></div>
          </div>
        </section>

        <section>
          <h2 class="section-title"><span>技能栈</span><small>Skills</small></h2>
          <div class="flex flex-wrap gap-2">
            <span v-for="skill in resume.skills" :key="skill" class="px-3 py-1.5 rounded-xs border border-default/70 bg-elevated/20 text-sm text-muted">{{ skill }}</span>
          </div>
        </section>

        <section>
          <h2 class="section-title"><span>工作经历</span><small>Experience</small></h2>
          <ol class="border-l border-default/60 pl-6 space-y-9">
            <li v-for="experience in resume.experiences" :key="experience.id" class="relative">
              <span class="absolute -left-[29px] top-1.5 size-2.5 rounded-full border-2 border-(--ui-bg) bg-(--color-cinnabar)" />
              <div class="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2">
                <div><h3 class="font-display text-xl text-highlighted tracking-wide">{{ experience.company }}</h3><p class="text-sm text-primary mt-1">{{ experience.title }}<template v-if="experience.department"> · {{ experience.department }}</template></p></div>
                <time class="font-mono text-xs text-dimmed shrink-0">{{ formatRange(experience.start, experience.end) }}</time>
              </div>
              <div v-if="experience.skills.length" class="flex flex-wrap gap-x-2 mt-4 font-mono text-[11px] text-dimmed"><span v-for="skill in experience.skills" :key="skill">{{ skill }}</span></div>
              <ul v-if="experience.highlights.length" class="mt-4 space-y-2 text-sm text-muted leading-relaxed"><li v-for="item in experience.highlights" :key="item" class="flex gap-2"><span class="text-(--color-cinnabar)" aria-hidden="true">•</span><span>{{ item }}</span></li></ul>
              <details v-if="experience.responsibilities.length" class="mt-4 text-sm"><summary class="cursor-pointer text-dimmed hover:text-primary">查看职责内容</summary><ul class="mt-3 space-y-2 text-muted leading-relaxed"><li v-for="item in experience.responsibilities" :key="item">{{ item }}</li></ul></details>
            </li>
          </ol>
        </section>

        <section>
          <h2 class="section-title"><span>项目经验</span><small>Projects</small></h2>
          <div class="space-y-5">
            <article v-for="project in resume.projects" :key="project.id" class="rounded-xs border border-default/70 bg-elevated/20 p-5 sm:p-6">
              <div class="flex flex-col sm:flex-row sm:justify-between gap-2"><div><h3 class="font-display text-xl text-highlighted tracking-wide">{{ project.name }}</h3><p class="text-sm text-primary mt-1">{{ project.role }}</p></div><time class="font-mono text-xs text-dimmed">{{ formatRange(project.start, project.end) }}</time></div>
              <p class="text-sm text-muted leading-relaxed mt-4">{{ project.description }}</p>
              <div class="flex flex-wrap gap-2 mt-4"><span v-for="item in project.stack" :key="item" class="font-mono text-[10px] text-dimmed px-2 py-1 border border-default/60">{{ item }}</span></div>
              <ul v-if="project.highlights.length" class="mt-5 space-y-2 text-sm text-muted leading-relaxed"><li v-for="item in project.highlights" :key="item" class="flex gap-2"><span class="text-(--color-cinnabar)" aria-hidden="true">•</span><span>{{ item }}</span></li></ul>
            </article>
          </div>
        </section>

        <section>
          <h2 class="section-title"><span>教育经历</span><small>Education</small></h2>
          <div class="divide-y divide-default/60 border-y border-default/60"><article v-for="item in resume.education" :key="item.id" class="py-4 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:justify-between"><div><h3 class="text-base text-highlighted">{{ item.school }}</h3><p class="text-sm text-muted mt-1">{{ item.degree }} · {{ item.major }}</p><p v-if="item.description" class="text-xs text-dimmed mt-2">{{ item.description }}</p></div><time class="font-mono text-xs text-dimmed shrink-0">{{ formatRange(item.start, item.end) }}</time></article></div>
        </section>

        <section v-if="stats" class="grid grid-cols-2 sm:grid-cols-4 border border-default/70 rounded-xs divide-x divide-y sm:divide-y-0 divide-default/70 overflow-hidden">
          <div v-for="item in statItems" :key="item.label" class="text-center py-6 bg-elevated/20"><p class="font-display text-3xl text-highlighted tabular-nums">{{ item.value }}</p><p class="text-xs text-dimmed mt-1.5 tracking-widest">{{ item.label }}</p></div>
        </section>
      </div>

      <div class="hidden lg:block"><div class="sticky top-24"><BlogSidebar /></div></div>
    </div>
  </UContainer>
</template>

<style scoped>
.section-title { display: flex; align-items: baseline; gap: .5rem; padding-bottom: .5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--ui-border); color: var(--ui-text-highlighted); font-family: var(--font-display); font-size: 1.125rem; letter-spacing: .1em; }
.section-title small { color: var(--ui-text-dimmed); font-family: var(--font-mono); font-size: .625rem; font-weight: 400; letter-spacing: .2em; text-transform: uppercase; }
</style>
