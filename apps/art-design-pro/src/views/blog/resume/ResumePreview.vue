<script setup lang="ts">
  defineProps<{ resume: Api.Blog.Resume }>()

  function formatRange(start: string, end: string, current = false) {
    const tail = end || (current ? '至今' : '')
    return [start, tail].filter(Boolean).join(' — ')
  }
</script>

<template>
  <aside class="preview">
    <div class="preview__bar">
      <span class="preview__live"><i />实时预览</span>
      <span class="preview__label">Preview</span>
    </div>

    <div class="preview__scroll">
      <article class="paper">
        <header class="paper__header">
          <div class="paper__title">
            <h3 :class="{ ph: !resume.profile.name }">{{ resume.profile.name || '姓名' }}</h3>
            <p :class="{ ph: !resume.profile.headline }">{{
              resume.profile.headline || '职业标题'
            }}</p>
          </div>
          <span class="paper__seal" aria-hidden="true">履历</span>
        </header>

        <p class="paper__summary" :class="{ ph: !resume.profile.summary }">
          {{ resume.profile.summary || '暂无个人简介' }}
        </p>

        <div class="paper__meta">
          <div
            ><span>经验</span
            ><b :class="{ ph: !resume.profile.experience }">{{
              resume.profile.experience || '—'
            }}</b></div
          >
          <div
            ><span>学历</span
            ><b :class="{ ph: !resume.profile.education }">{{
              resume.profile.education || '—'
            }}</b></div
          >
          <div
            ><span>状态</span
            ><b :class="{ ph: !resume.profile.availability }">{{
              resume.profile.availability || '—'
            }}</b></div
          >
          <div
            ><span>所在地</span
            ><b :class="{ ph: !resume.profile.location }">{{
              resume.profile.location || '—'
            }}</b></div
          >
        </div>

        <section class="paper__section">
          <h4>求职意向<small>Objective</small></h4>
          <div class="paper__objective">
            <div
              ><span>期望职位</span
              ><b :class="{ ph: !resume.desiredPosition.position }">{{
                resume.desiredPosition.position || '—'
              }}</b></div
            >
            <div
              ><span>行业</span
              ><b :class="{ ph: !resume.desiredPosition.industry }">{{
                resume.desiredPosition.industry || '—'
              }}</b></div
            >
            <div
              ><span>期望薪资</span
              ><b :class="{ ph: !resume.desiredPosition.salary }">{{
                resume.desiredPosition.salary || '—'
              }}</b></div
            >
          </div>
        </section>

        <section class="paper__section">
          <h4>技能栈<small>Skills</small></h4>
          <div v-if="resume.skills.length" class="paper__skills">
            <span v-for="skill in resume.skills" :key="skill">{{ skill }}</span>
          </div>
          <p v-else class="paper__empty">暂无技能标签</p>
        </section>

        <section class="paper__section">
          <h4>工作经历<small>Experience</small></h4>
          <ol v-if="resume.experiences.length" class="paper__timeline">
            <li v-for="item in resume.experiences" :key="item.id">
              <div class="paper__row">
                <b :class="{ ph: !item.company }">{{ item.company || '公司' }}</b>
                <time>{{ formatRange(item.start, item.end, item.current) || '—' }}</time>
              </div>
              <p class="paper__sub" :class="{ ph: !item.title }">
                {{ [item.title, item.department].filter(Boolean).join(' · ') || '职位' }}
              </p>
              <div v-if="item.skills.length" class="paper__tags">
                <span v-for="skill in item.skills" :key="skill">{{ skill }}</span>
              </div>
              <div v-if="item.highlights" class="paper__list paper__rich" v-html="item.highlights" />
            </li>
          </ol>
          <p v-else class="paper__empty">暂无工作经历</p>
        </section>

        <section class="paper__section">
          <h4>项目经验<small>Projects</small></h4>
          <template v-if="resume.projects.length">
            <article v-for="item in resume.projects" :key="item.id" class="paper__project">
              <div class="paper__row">
                <b :class="{ ph: !item.name }">{{ item.name || '项目名称' }}</b>
                <time>{{ formatRange(item.start, item.end) || '—' }}</time>
              </div>
              <p v-if="item.role" class="paper__sub paper__sub--accent">{{ item.role }}</p>
              <p v-if="item.description" class="paper__desc paper__rich" v-html="item.description" />
              <div v-if="item.stack.length" class="paper__tags">
                <span v-for="tech in item.stack" :key="tech">{{ tech }}</span>
              </div>
              <div v-if="item.highlights" class="paper__list paper__rich" v-html="item.highlights" />
            </article>
          </template>
          <p v-else class="paper__empty">暂无项目经验</p>
        </section>

        <section class="paper__section">
          <h4>教育经历<small>Education</small></h4>
          <template v-if="resume.education.length">
            <article v-for="item in resume.education" :key="item.id" class="paper__edu">
              <div class="paper__row">
                <b :class="{ ph: !item.school }">{{ item.school || '学校' }}</b>
                <time>{{ formatRange(item.start, item.end) || '—' }}</time>
              </div>
              <p class="paper__sub" :class="{ ph: !item.degree && !item.major }">
                {{ [item.degree, item.major].filter(Boolean).join(' · ') || '学历 · 专业' }}
              </p>
              <p v-if="item.description" class="paper__desc">{{ item.description }}</p>
            </article>
          </template>
          <p v-else class="paper__empty">暂无教育经历</p>
        </section>
      </article>
    </div>
  </aside>
</template>

<style scoped>
  .preview {
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 32px);
    overflow: hidden;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: 12px;
  }

  .preview__bar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--art-card-border);
  }

  .preview__live {
    display: inline-flex;
    gap: 7px;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
  }

  .preview__live i {
    width: 6px;
    height: 6px;
    background: var(--art-success);
    border-radius: 50%;
    animation: live-pulse 1.6s ease-in-out infinite;
  }

  @keyframes live-pulse {
    50% {
      opacity: 0.3;
    }
  }

  .preview__label {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    color: var(--art-gray-500);
    text-transform: uppercase;
    letter-spacing: 0.2em;
  }

  .preview__scroll {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background: var(--default-bg-color);
  }

  .preview__scroll::-webkit-scrollbar {
    width: 5px;
  }

  .preview__scroll::-webkit-scrollbar-thumb {
    background: var(--art-gray-300);
    border-radius: 999px;
  }

  /* ---------- 纸张 ---------- */
  .paper {
    padding: 30px 28px 34px;
    font-size: 13px;
    line-height: 1.75;
    color: var(--art-gray-800);
    background: var(--default-box-color);
    border: 1px solid var(--default-border);
    border-radius: 10px;
    box-shadow: 0 2px 10px rgb(0 0 0 / 4%);
  }

  .ph {
    color: var(--art-gray-400) !important;
  }

  .paper__header {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .paper__title h3 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .paper__title p {
    margin: 4px 0 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--main-color);
  }

  .paper__seal {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 40px;
    height: 40px;
    font-size: 11px;
    color: var(--main-color);
    letter-spacing: 0.1em;
    background: color-mix(in srgb, var(--main-color) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--main-color) 30%, transparent);
    border-radius: 8px;
    writing-mode: vertical-lr;
  }

  .paper__summary {
    margin: 12px 0 0;
    font-size: 13px;
    color: var(--art-gray-600);
  }

  .paper__meta {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    padding-top: 14px;
    margin-top: 16px;
    border-top: 1px solid var(--default-border);
  }

  .paper__meta span,
  .paper__objective span {
    display: block;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: var(--art-gray-500);
    letter-spacing: 0.08em;
  }

  .paper__meta b,
  .paper__objective b {
    display: block;
    margin-top: 3px;
    overflow: hidden;
    font-size: 13px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ---------- 分区 ---------- */
  .paper__section {
    margin-top: 22px;
  }

  .paper__section h4 {
    display: flex;
    gap: 7px;
    align-items: baseline;
    padding-bottom: 7px;
    margin: 0 0 12px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.06em;
    border-bottom: 1px solid var(--default-border);
  }

  .paper__section h4 small {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    font-weight: 400;
    color: var(--art-gray-400);
    text-transform: uppercase;
    letter-spacing: 0.18em;
  }

  .paper__objective {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .paper__skills {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .paper__skills span {
    padding: 3px 11px;
    font-size: 12px;
    color: var(--art-gray-700);
    border: 1px solid var(--default-border);
    border-radius: 999px;
  }

  .paper__empty {
    margin: 0;
    font-size: 12.5px;
    color: var(--art-gray-400);
  }

  /* ---------- 时间轴 ---------- */
  .paper__timeline {
    padding-left: 16px;
    margin: 0;
    list-style: none;
    border-left: 1px solid var(--default-border);
  }

  .paper__timeline li {
    position: relative;
    padding-bottom: 16px;
  }

  .paper__timeline li:last-child {
    padding-bottom: 0;
  }

  .paper__timeline li::before {
    position: absolute;
    top: 7px;
    left: -22px;
    width: 7px;
    height: 7px;
    content: '';
    background: var(--main-color);
    border: 2px solid var(--default-box-color);
    border-radius: 50%;
  }

  .paper__row {
    display: flex;
    gap: 10px;
    align-items: baseline;
    justify-content: space-between;
  }

  .paper__row b {
    overflow: hidden;
    font-size: 14.5px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .paper__row time {
    flex-shrink: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: var(--art-gray-500);
  }

  .paper__sub {
    margin: 3px 0 0;
    font-size: 12.5px;
    color: var(--art-gray-600);
  }

  .paper__sub--accent {
    color: var(--main-color);
  }

  .paper__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 7px;
  }

  .paper__tags span {
    padding: 1px 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: var(--art-gray-500);
    border: 1px solid var(--default-border);
    border-radius: 4px;
  }

  .paper__list {
    padding: 0;
    margin: 7px 0 0;
    list-style: none;
  }

  .paper__list li {
    display: flex;
    gap: 7px;
    font-size: 12.5px;
    color: var(--art-gray-600);
  }

  .paper__list li::before {
    flex-shrink: 0;
    color: var(--main-color);
    content: '•';
  }

  /* ---------- 项目 / 教育 ---------- */
  .paper__project,
  .paper__edu {
    padding-bottom: 14px;
    margin-bottom: 14px;
    border-bottom: 1px dashed var(--default-border);
  }

  .paper__project:last-child,
  .paper__edu:last-child {
    padding-bottom: 0;
    margin-bottom: 0;
    border-bottom: 0;
  }

  .paper__desc {
    margin: 5px 0 0;
    font-size: 12.5px;
    color: var(--art-gray-600);
  }

  /* 富文本 HTML 渲染 */
  .paper__rich {
    font-size: 12.5px;
    color: var(--art-gray-600);
  }

  .paper__rich ul,
  .paper__rich ol {
    padding: 0;
    margin: 7px 0 0;
    list-style: none;
  }

  .paper__rich li {
    display: flex;
    gap: 7px;
  }

  .paper__rich ul li::before {
    flex-shrink: 0;
    color: var(--main-color);
    content: '•';
  }

  .paper__rich p {
    margin: 5px 0 0;
  }

  @media (width <= 480px) {
    .paper__meta,
    .paper__objective {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
