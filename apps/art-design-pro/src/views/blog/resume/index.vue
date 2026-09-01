<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { blogApi } from '@/api/blog'
  import ResumePreview from './ResumePreview.vue'

  const loading = ref(false)
  const form = reactive<Api.Blog.Resume>({
    profile: {
      name: '',
      headline: '',
      summary: '',
      experience: '',
      education: '',
      availability: '',
      location: ''
    },
    desiredPosition: { position: '', industry: '', salary: '' },
    skills: [],
    experiences: [],
    projects: [],
    education: []
  })

  function createId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  function textList(items: string[]) {
    return items.join('\n')
  }

  function setTextList(items: string[], value: string) {
    items.splice(
      0,
      items.length,
      ...value
        .split(/[\n,，]/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  }

  function move<T>(items: T[], index: number, offset: -1 | 1) {
    const nextIndex = index + offset
    if (nextIndex < 0 || nextIndex >= items.length) return
    const [item] = items.splice(index, 1)
    items.splice(nextIndex, 0, item!)
  }

  function addExperience() {
    form.experiences.push({
      id: createId('experience'),
      company: '',
      title: '',
      department: '',
      start: '',
      end: '',
      current: false,
      skills: [],
      highlights: [],
      responsibilities: []
    })
  }

  function addProject() {
    form.projects.push({
      id: createId('project'),
      name: '',
      role: '',
      start: '',
      end: '',
      description: '',
      stack: [],
      highlights: []
    })
  }

  function addEducation() {
    form.education.push({
      id: createId('education'),
      school: '',
      degree: '',
      major: '',
      start: '',
      end: '',
      description: ''
    })
  }

  async function load() {
    loading.value = true
    try {
      Object.assign(form, await blogApi.getResume())
    } finally {
      loading.value = false
    }
  }

  async function save() {
    if (!form.profile.name || !form.profile.headline)
      return ElMessage.warning('请填写姓名和职业标题')
    loading.value = true
    try {
      Object.assign(form, await blogApi.updateResume(JSON.parse(JSON.stringify(form))))
      ElMessage.success('个人简历已保存，前台“关于”页已同步更新')
    } finally {
      loading.value = false
    }
  }

  onMounted(load)
</script>

<template>
  <div v-loading="loading" class="resume-page page-content">
    <header class="hero">
      <div class="hero__info">
        <span class="hero__icon"><ArtSvgIcon icon="ri:profile-line" :size="26" /></span>
        <div class="hero__text">
          <h2>个人简历</h2>
          <p>维护前台“关于”页展示的个人资料、经历与项目成果</p>
          <div class="hero__meta">
            <span class="hero__chip"><i />技能 {{ form.skills.length }}</span>
            <span class="hero__chip"><i />工作经历 {{ form.experiences.length }}</span>
            <span class="hero__chip"><i />项目经验 {{ form.projects.length }}</span>
            <span class="hero__chip"><i />教育经历 {{ form.education.length }}</span>
          </div>
        </div>
      </div>
      <ElButton type="primary" class="hero__save" :loading="loading" @click="save">
        <ArtSvgIcon icon="ri:save-3-line" />保存简历
      </ElButton>
    </header>

    <div class="resume-layout">
      <ElForm label-position="top" class="resume-form">
        <section class="form-section">
          <div class="section-heading">
            <span class="section-badge">01</span>
            <div class="section-title">
              <h3><ArtSvgIcon icon="ri:id-card-line" :size="16" />基本资料</h3>
              <p>Basic Information</p>
            </div>
          </div>
          <div class="section-body">
            <div class="form-grid">
              <ElFormItem label="姓名"><ElInput v-model="form.profile.name" /></ElFormItem>
              <ElFormItem label="职业标题"
                ><ElInput v-model="form.profile.headline" placeholder="例如：前端开发工程师"
              /></ElFormItem>
              <ElFormItem label="工作年限"
                ><ElInput v-model="form.profile.experience" placeholder="例如：7 年经验"
              /></ElFormItem>
              <ElFormItem label="最高学历"><ElInput v-model="form.profile.education" /></ElFormItem>
              <ElFormItem label="当前状态"
                ><ElInput v-model="form.profile.availability"
              /></ElFormItem>
              <ElFormItem label="所在地"><ElInput v-model="form.profile.location" /></ElFormItem>
            </div>
            <ElFormItem label="个人简介" class="form-item--flush"
              ><ElInput
                v-model="form.profile.summary"
                type="textarea"
                :rows="3"
                maxlength="2000"
                show-word-limit
            /></ElFormItem>
          </div>
        </section>

        <section class="form-section">
          <div class="section-heading">
            <span class="section-badge">02</span>
            <div class="section-title">
              <h3><ArtSvgIcon icon="ri:flag-2-line" :size="16" />求职意向与技能</h3>
              <p>Career Objective & Skills</p>
            </div>
          </div>
          <div class="section-body">
            <div class="form-grid">
              <ElFormItem label="期望职位"
                ><ElInput v-model="form.desiredPosition.position"
              /></ElFormItem>
              <ElFormItem label="行业"
                ><ElInput v-model="form.desiredPosition.industry"
              /></ElFormItem>
              <ElFormItem label="期望薪资"
                ><ElInput v-model="form.desiredPosition.salary"
              /></ElFormItem>
            </div>
            <ElFormItem label="技能（使用逗号或换行分隔）" class="form-item--flush"
              ><ElInput
                :model-value="textList(form.skills)"
                type="textarea"
                :rows="2"
                @update:model-value="setTextList(form.skills, $event)"
            /></ElFormItem>
          </div>
        </section>

        <section class="form-section">
          <div class="section-heading">
            <span class="section-badge">03</span>
            <div class="section-title">
              <h3><ArtSvgIcon icon="ri:briefcase-4-line" :size="16" />工作经历</h3>
              <p>Work Experience</p>
            </div>
            <ElButton class="section-action" @click="addExperience"
              ><ArtSvgIcon icon="ri:add-line" />添加经历</ElButton
            >
          </div>
          <div class="section-body">
            <div v-if="!form.experiences.length" class="empty-state">
              <ArtSvgIcon icon="ri:briefcase-line" :size="30" />
              <p>还没有工作经历</p>
              <ElButton text type="primary" @click="addExperience"
                ><ArtSvgIcon icon="ri:add-line" />添加第一段经历</ElButton
              >
            </div>
            <div v-for="(item, index) in form.experiences" :key="item.id" class="entry-card">
              <div class="entry-toolbar">
                <div class="entry-label">
                  <span class="entry-index">{{ String(index + 1).padStart(2, '0') }}</span>
                  <span class="entry-name">{{ item.company || item.title || '未命名经历' }}</span>
                  <span v-if="item.current" class="entry-tag">在职</span>
                </div>
                <div class="entry-actions">
                  <button
                    type="button"
                    class="icon-btn"
                    title="上移"
                    :disabled="index === 0"
                    @click="move(form.experiences, index, -1)"
                    ><ArtSvgIcon icon="ri:arrow-up-line" :size="14"
                  /></button>
                  <button
                    type="button"
                    class="icon-btn"
                    title="下移"
                    :disabled="index === form.experiences.length - 1"
                    @click="move(form.experiences, index, 1)"
                    ><ArtSvgIcon icon="ri:arrow-down-line" :size="14"
                  /></button>
                  <button
                    type="button"
                    class="icon-btn icon-btn--danger"
                    title="删除"
                    @click="form.experiences.splice(index, 1)"
                    ><ArtSvgIcon icon="ri:delete-bin-line" :size="14"
                  /></button>
                </div>
              </div>
              <div class="entry-body">
                <div class="form-grid">
                  <ElFormItem label="公司"><ElInput v-model="item.company" /></ElFormItem>
                  <ElFormItem label="职位"><ElInput v-model="item.title" /></ElFormItem>
                  <ElFormItem label="部门"><ElInput v-model="item.department" /></ElFormItem>
                  <ElFormItem label="开始时间"
                    ><ElInput v-model="item.start" placeholder="2022.05"
                  /></ElFormItem>
                  <ElFormItem label="结束时间"
                    ><ElInput v-model="item.end" placeholder="至今"
                  /></ElFormItem>
                  <ElFormItem label="仍在职"
                    ><div class="switch-field"><ElSwitch v-model="item.current" /></div
                  ></ElFormItem>
                </div>
                <ElFormItem label="技术标签（逗号或换行分隔）"
                  ><ElInput
                    :model-value="textList(item.skills)"
                    @update:model-value="setTextList(item.skills, $event)"
                /></ElFormItem>
                <ElFormItem label="主要业绩（每行一条）"
                  ><ElInput
                    :model-value="textList(item.highlights)"
                    type="textarea"
                    :rows="3"
                    @update:model-value="setTextList(item.highlights, $event)"
                /></ElFormItem>
                <ElFormItem label="职责内容（每行一条）" class="form-item--flush"
                  ><ElInput
                    :model-value="textList(item.responsibilities)"
                    type="textarea"
                    :rows="3"
                    @update:model-value="setTextList(item.responsibilities, $event)"
                /></ElFormItem>
              </div>
            </div>
          </div>
        </section>

        <section class="form-section">
          <div class="section-heading">
            <span class="section-badge">04</span>
            <div class="section-title">
              <h3><ArtSvgIcon icon="ri:code-box-line" :size="16" />项目经验</h3>
              <p>Featured Projects</p>
            </div>
            <ElButton class="section-action" @click="addProject"
              ><ArtSvgIcon icon="ri:add-line" />添加项目</ElButton
            >
          </div>
          <div class="section-body">
            <div v-if="!form.projects.length" class="empty-state">
              <ArtSvgIcon icon="ri:code-box-line" :size="30" />
              <p>还没有项目经验</p>
              <ElButton text type="primary" @click="addProject"
                ><ArtSvgIcon icon="ri:add-line" />添加第一个项目</ElButton
              >
            </div>
            <div v-for="(item, index) in form.projects" :key="item.id" class="entry-card">
              <div class="entry-toolbar">
                <div class="entry-label">
                  <span class="entry-index">{{ String(index + 1).padStart(2, '0') }}</span>
                  <span class="entry-name">{{ item.name || '未命名项目' }}</span>
                </div>
                <div class="entry-actions">
                  <button
                    type="button"
                    class="icon-btn"
                    title="上移"
                    :disabled="index === 0"
                    @click="move(form.projects, index, -1)"
                    ><ArtSvgIcon icon="ri:arrow-up-line" :size="14"
                  /></button>
                  <button
                    type="button"
                    class="icon-btn"
                    title="下移"
                    :disabled="index === form.projects.length - 1"
                    @click="move(form.projects, index, 1)"
                    ><ArtSvgIcon icon="ri:arrow-down-line" :size="14"
                  /></button>
                  <button
                    type="button"
                    class="icon-btn icon-btn--danger"
                    title="删除"
                    @click="form.projects.splice(index, 1)"
                    ><ArtSvgIcon icon="ri:delete-bin-line" :size="14"
                  /></button>
                </div>
              </div>
              <div class="entry-body">
                <div class="form-grid">
                  <ElFormItem label="项目名称"><ElInput v-model="item.name" /></ElFormItem>
                  <ElFormItem label="担任角色"><ElInput v-model="item.role" /></ElFormItem>
                  <ElFormItem label="开始时间"><ElInput v-model="item.start" /></ElFormItem>
                  <ElFormItem label="结束时间"><ElInput v-model="item.end" /></ElFormItem>
                </div>
                <ElFormItem label="项目描述"
                  ><ElInput v-model="item.description" type="textarea" :rows="3"
                /></ElFormItem>
                <ElFormItem label="技术栈（逗号或换行分隔）"
                  ><ElInput
                    :model-value="textList(item.stack)"
                    @update:model-value="setTextList(item.stack, $event)"
                /></ElFormItem>
                <ElFormItem label="项目成果（每行一条）" class="form-item--flush"
                  ><ElInput
                    :model-value="textList(item.highlights)"
                    type="textarea"
                    :rows="3"
                    @update:model-value="setTextList(item.highlights, $event)"
                /></ElFormItem>
              </div>
            </div>
          </div>
        </section>

        <section class="form-section">
          <div class="section-heading">
            <span class="section-badge">05</span>
            <div class="section-title">
              <h3><ArtSvgIcon icon="ri:graduation-cap-line" :size="16" />教育经历</h3>
              <p>Education</p>
            </div>
            <ElButton class="section-action" @click="addEducation"
              ><ArtSvgIcon icon="ri:add-line" />添加教育经历</ElButton
            >
          </div>
          <div class="section-body">
            <div v-if="!form.education.length" class="empty-state">
              <ArtSvgIcon icon="ri:graduation-cap-line" :size="30" />
              <p>还没有教育经历</p>
              <ElButton text type="primary" @click="addEducation"
                ><ArtSvgIcon icon="ri:add-line" />添加教育经历</ElButton
              >
            </div>
            <div v-for="(item, index) in form.education" :key="item.id" class="entry-card">
              <div class="entry-toolbar">
                <div class="entry-label">
                  <span class="entry-index">{{ String(index + 1).padStart(2, '0') }}</span>
                  <span class="entry-name">{{ item.school || '未填写学校' }}</span>
                </div>
                <div class="entry-actions">
                  <button
                    type="button"
                    class="icon-btn"
                    title="上移"
                    :disabled="index === 0"
                    @click="move(form.education, index, -1)"
                    ><ArtSvgIcon icon="ri:arrow-up-line" :size="14"
                  /></button>
                  <button
                    type="button"
                    class="icon-btn"
                    title="下移"
                    :disabled="index === form.education.length - 1"
                    @click="move(form.education, index, 1)"
                    ><ArtSvgIcon icon="ri:arrow-down-line" :size="14"
                  /></button>
                  <button
                    type="button"
                    class="icon-btn icon-btn--danger"
                    title="删除"
                    @click="form.education.splice(index, 1)"
                    ><ArtSvgIcon icon="ri:delete-bin-line" :size="14"
                  /></button>
                </div>
              </div>
              <div class="entry-body">
                <div class="form-grid">
                  <ElFormItem label="学校"><ElInput v-model="item.school" /></ElFormItem>
                  <ElFormItem label="学历"><ElInput v-model="item.degree" /></ElFormItem>
                  <ElFormItem label="专业"><ElInput v-model="item.major" /></ElFormItem>
                  <ElFormItem label="开始时间"><ElInput v-model="item.start" /></ElFormItem>
                  <ElFormItem label="结束时间"><ElInput v-model="item.end" /></ElFormItem>
                </div>
                <ElFormItem label="补充说明" class="form-item--flush"
                  ><ElInput v-model="item.description"
                /></ElFormItem>
              </div>
            </div>
          </div>
        </section>
      </ElForm>

      <div class="preview-column">
        <ResumePreview :resume="form" />
      </div>
    </div>

    <footer class="page-footer">
      <span class="page-footer__tip"
        ><ArtSvgIcon icon="ri:information-line" :size="14" />保存后将同步更新前台“关于”页</span
      >
      <ElButton type="primary" :loading="loading" @click="save"
        ><ArtSvgIcon icon="ri:save-3-line" />保存简历</ElButton
      >
    </footer>
  </div>
</template>

<style scoped>
  .resume-page {
    padding: 20px;
  }

  /* ---------- 顶部横幅 ---------- */
  .hero {
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: space-between;
    padding: 24px 28px;
    margin-bottom: 16px;
    overflow: hidden;
    background:
      radial-gradient(
        circle at 88% -30%,
        color-mix(in srgb, var(--main-color) 14%, transparent),
        transparent 46%
      ),
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--main-color) 7%, var(--default-box-color)),
        var(--default-box-color) 62%
      );
    border: 1px solid var(--art-card-border);
    border-radius: 12px;
  }

  .hero__info {
    display: flex;
    gap: 18px;
    align-items: flex-start;
    min-width: 0;
  }

  .hero__icon {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 52px;
    height: 52px;
    color: var(--main-color);
    background: color-mix(in srgb, var(--main-color) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--main-color) 22%, transparent);
    border-radius: 14px;
  }

  .hero__text h2 {
    margin: 2px 0 0;
    font-size: 19px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .hero__text > p {
    margin: 5px 0 0;
    font-size: 13px;
    color: var(--art-gray-600);
  }

  .hero__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .hero__chip {
    display: inline-flex;
    gap: 7px;
    align-items: center;
    height: 24px;
    padding: 0 10px;
    font-size: 12px;
    color: var(--art-gray-700);
    background: color-mix(in srgb, var(--main-color) 6%, var(--default-box-color));
    border: 1px solid color-mix(in srgb, var(--main-color) 14%, transparent);
    border-radius: 999px;
  }

  .hero__chip i {
    width: 5px;
    height: 5px;
    background: var(--main-color);
    border-radius: 50%;
  }

  .hero__save {
    flex-shrink: 0;
  }

  .hero__save :deep(.art-svg-icon) {
    margin-right: 4px;
  }

  /* ---------- 左右布局 ---------- */
  .resume-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }

  .preview-column {
    position: sticky;
    top: 16px;
  }

  /* ---------- 分区卡片 ---------- */
  .resume-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .form-section {
    overflow: hidden;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: 12px;
    transition: border-color 0.2s ease;
  }

  .form-section:hover {
    border-color: color-mix(in srgb, var(--main-color) 30%, var(--art-card-border));
  }

  .section-heading {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 18px 24px;
    border-bottom: 1px solid var(--art-card-border);
  }

  .section-badge {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 38px;
    height: 38px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
    font-weight: 600;
    color: var(--main-color);
    letter-spacing: 0.04em;
    background: color-mix(in srgb, var(--main-color) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--main-color) 18%, transparent);
    border-radius: 10px;
  }

  .section-title {
    min-width: 0;
  }

  .section-title h3 {
    display: flex;
    gap: 7px;
    align-items: center;
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }

  .section-title h3 :deep(.art-svg-icon) {
    color: var(--main-color);
  }

  .section-title p {
    margin: 3px 0 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: var(--art-gray-500);
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }

  .section-action {
    margin-left: auto;
  }

  .section-action :deep(.art-svg-icon) {
    margin-right: 2px;
  }

  .section-body {
    padding: 4px 24px 22px;
  }

  /* ---------- 表单 ---------- */
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 2px 18px;
  }

  .resume-form :deep(.el-form-item__label) {
    padding-bottom: 4px;
    font-size: 13px;
    font-weight: 500;
    color: var(--art-gray-700);
  }

  .form-item--flush {
    margin-bottom: 0;
  }

  .switch-field {
    display: flex;
    align-items: center;
    height: 32px;
  }

  /* ---------- 条目卡片 ---------- */
  .entry-card {
    margin-top: 16px;
    overflow: hidden;
    border: 1px solid var(--default-border);
    border-radius: 10px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .entry-card:hover {
    border-color: color-mix(in srgb, var(--main-color) 32%, var(--default-border));
    box-shadow: 0 4px 16px rgb(0 0 0 / 4%);
  }

  .entry-toolbar {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: var(--default-bg-color);
    border-bottom: 1px solid var(--default-border);
  }

  .entry-label {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  .entry-index {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 28px;
    height: 22px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    font-weight: 600;
    color: var(--main-color);
    background: color-mix(in srgb, var(--main-color) 10%, transparent);
    border-radius: 6px;
  }

  .entry-name {
    overflow: hidden;
    font-size: 13px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entry-tag {
    flex-shrink: 0;
    padding: 1px 8px;
    font-size: 11px;
    color: var(--art-success);
    background: color-mix(in srgb, var(--art-success) 12%, transparent);
    border-radius: 999px;
  }

  .entry-actions {
    display: flex;
    flex-shrink: 0;
    gap: 6px;
  }

  .icon-btn {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    padding: 0;
    color: var(--art-gray-600);
    cursor: pointer;
    background: var(--default-box-color);
    border: 1px solid var(--default-border);
    border-radius: 7px;
    transition: all 0.15s ease;
  }

  .icon-btn:hover:not(:disabled) {
    color: var(--main-color);
    border-color: color-mix(in srgb, var(--main-color) 45%, var(--default-border));
  }

  .icon-btn:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .icon-btn--danger:hover:not(:disabled) {
    color: var(--art-danger);
    border-color: color-mix(in srgb, var(--art-danger) 45%, var(--default-border));
  }

  .entry-body {
    padding: 2px 18px 18px;
  }

  /* ---------- 空状态 ---------- */
  .empty-state {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    padding: 34px 20px;
    margin-top: 16px;
    color: var(--art-gray-500);
    background: var(--default-bg-color);
    border: 1px dashed var(--default-border-dashed);
    border-radius: 10px;
  }

  .empty-state p {
    margin: 0 0 4px;
    font-size: 13px;
  }

  /* ---------- 底部操作栏 ---------- */
  .page-footer {
    position: sticky;
    bottom: 14px;
    z-index: 10;
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    margin-top: 16px;
    background: color-mix(in srgb, var(--default-box-color) 88%, transparent);
    backdrop-filter: blur(10px);
    border: 1px solid var(--art-card-border);
    border-radius: 12px;
  }

  .page-footer__tip {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    font-size: 12px;
    color: var(--art-gray-500);
  }

  .page-footer :deep(.el-button .art-svg-icon) {
    margin-right: 4px;
  }

  /* ---------- 响应式 ---------- */
  @media (width <= 1280px) {
    .resume-layout {
      grid-template-columns: minmax(0, 1fr);
    }

    .preview-column {
      position: static;
    }

    .preview-column :deep(.preview) {
      max-height: none;
    }
  }

  @media (width <= 760px) {
    .resume-page {
      padding: 14px;
    }

    .hero {
      align-items: flex-start;
      padding: 20px;
    }

    .hero__info {
      flex-direction: column;
      gap: 14px;
    }

    .hero__save {
      align-self: flex-end;
    }

    .section-heading {
      padding: 14px 16px;
    }

    .section-body {
      padding: 4px 16px 18px;
    }

    .entry-body {
      padding: 2px 14px 14px;
    }

    .entry-name {
      max-width: 130px;
    }

    .page-footer__tip {
      display: none;
    }
  }
</style>
