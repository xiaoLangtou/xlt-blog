<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { blogApi } from '@/api/blog'

  const loading = ref(false)
  const form = reactive<Api.Blog.Resume>({
    profile: { name: '', headline: '', summary: '', experience: '', education: '', availability: '', location: '' },
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
    items.splice(0, items.length, ...value.split(/[\n,，]/).map(item => item.trim()).filter(Boolean))
  }

  function move<T>(items: T[], index: number, offset: -1 | 1) {
    const nextIndex = index + offset
    if (nextIndex < 0 || nextIndex >= items.length) return
    const [item] = items.splice(index, 1)
    items.splice(nextIndex, 0, item!)
  }

  function addExperience() {
    form.experiences.push({
      id: createId('experience'), company: '', title: '', department: '', start: '', end: '', current: false,
      skills: [], highlights: [], responsibilities: []
    })
  }

  function addProject() {
    form.projects.push({
      id: createId('project'), name: '', role: '', start: '', end: '', description: '', stack: [], highlights: []
    })
  }

  function addEducation() {
    form.education.push({ id: createId('education'), school: '', degree: '', major: '', start: '', end: '', description: '' })
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
    if (!form.profile.name || !form.profile.headline) return ElMessage.warning('请填写姓名和职业标题')
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
  <div v-loading="loading" class="page-content">
    <div class="toolbar">
      <div><h2>个人简历</h2><p>维护前台“关于”页展示的个人资料、经历与项目成果</p></div>
      <ElButton type="primary" :loading="loading" @click="save">保存简历</ElButton>
    </div>

    <ElForm label-position="top" class="resume-form">
      <section class="form-section">
        <div class="section-heading"><span>01</span><h3>基本资料</h3></div>
        <div class="form-grid">
          <ElFormItem label="姓名"><ElInput v-model="form.profile.name" /></ElFormItem>
          <ElFormItem label="职业标题"><ElInput v-model="form.profile.headline" placeholder="例如：前端开发工程师" /></ElFormItem>
          <ElFormItem label="工作年限"><ElInput v-model="form.profile.experience" placeholder="例如：7 年经验" /></ElFormItem>
          <ElFormItem label="最高学历"><ElInput v-model="form.profile.education" /></ElFormItem>
          <ElFormItem label="当前状态"><ElInput v-model="form.profile.availability" /></ElFormItem>
          <ElFormItem label="所在地"><ElInput v-model="form.profile.location" /></ElFormItem>
        </div>
        <ElFormItem label="个人简介"><ElInput v-model="form.profile.summary" type="textarea" :rows="3" maxlength="2000" show-word-limit /></ElFormItem>
      </section>

      <section class="form-section">
        <div class="section-heading"><span>02</span><h3>求职意向与技能</h3></div>
        <div class="form-grid">
          <ElFormItem label="期望职位"><ElInput v-model="form.desiredPosition.position" /></ElFormItem>
          <ElFormItem label="行业"><ElInput v-model="form.desiredPosition.industry" /></ElFormItem>
          <ElFormItem label="期望薪资"><ElInput v-model="form.desiredPosition.salary" /></ElFormItem>
        </div>
        <ElFormItem label="技能（使用逗号或换行分隔）"><ElInput :model-value="textList(form.skills)" type="textarea" :rows="2" @update:model-value="setTextList(form.skills, $event)" /></ElFormItem>
      </section>

      <section class="form-section">
        <div class="section-heading"><span>03</span><h3>工作经历</h3><ElButton text type="primary" @click="addExperience">添加经历</ElButton></div>
        <div v-for="(item, index) in form.experiences" :key="item.id" class="entry-card">
          <div class="entry-toolbar"><strong>经历 {{ String(index + 1).padStart(2, '0') }}</strong><div><ElButton text :disabled="index === 0" @click="move(form.experiences, index, -1)">上移</ElButton><ElButton text :disabled="index === form.experiences.length - 1" @click="move(form.experiences, index, 1)">下移</ElButton><ElButton text type="danger" @click="form.experiences.splice(index, 1)">删除</ElButton></div></div>
          <div class="form-grid"><ElFormItem label="公司"><ElInput v-model="item.company" /></ElFormItem><ElFormItem label="职位"><ElInput v-model="item.title" /></ElFormItem><ElFormItem label="部门"><ElInput v-model="item.department" /></ElFormItem><ElFormItem label="开始时间"><ElInput v-model="item.start" placeholder="2022.05" /></ElFormItem><ElFormItem label="结束时间"><ElInput v-model="item.end" placeholder="至今" /></ElFormItem><ElFormItem label="仍在职"><ElSwitch v-model="item.current" /></ElFormItem></div>
          <ElFormItem label="技术标签（逗号或换行分隔）"><ElInput :model-value="textList(item.skills)" @update:model-value="setTextList(item.skills, $event)" /></ElFormItem>
          <ElFormItem label="主要业绩（每行一条）"><ElInput :model-value="textList(item.highlights)" type="textarea" :rows="3" @update:model-value="setTextList(item.highlights, $event)" /></ElFormItem>
          <ElFormItem label="职责内容（每行一条）"><ElInput :model-value="textList(item.responsibilities)" type="textarea" :rows="3" @update:model-value="setTextList(item.responsibilities, $event)" /></ElFormItem>
        </div>
      </section>

      <section class="form-section">
        <div class="section-heading"><span>04</span><h3>项目经验</h3><ElButton text type="primary" @click="addProject">添加项目</ElButton></div>
        <div v-for="(item, index) in form.projects" :key="item.id" class="entry-card">
          <div class="entry-toolbar"><strong>项目 {{ String(index + 1).padStart(2, '0') }}</strong><div><ElButton text :disabled="index === 0" @click="move(form.projects, index, -1)">上移</ElButton><ElButton text :disabled="index === form.projects.length - 1" @click="move(form.projects, index, 1)">下移</ElButton><ElButton text type="danger" @click="form.projects.splice(index, 1)">删除</ElButton></div></div>
          <div class="form-grid"><ElFormItem label="项目名称"><ElInput v-model="item.name" /></ElFormItem><ElFormItem label="担任角色"><ElInput v-model="item.role" /></ElFormItem><ElFormItem label="开始时间"><ElInput v-model="item.start" /></ElFormItem><ElFormItem label="结束时间"><ElInput v-model="item.end" /></ElFormItem></div>
          <ElFormItem label="项目描述"><ElInput v-model="item.description" type="textarea" :rows="3" /></ElFormItem>
          <ElFormItem label="技术栈（逗号或换行分隔）"><ElInput :model-value="textList(item.stack)" @update:model-value="setTextList(item.stack, $event)" /></ElFormItem>
          <ElFormItem label="项目成果（每行一条）"><ElInput :model-value="textList(item.highlights)" type="textarea" :rows="3" @update:model-value="setTextList(item.highlights, $event)" /></ElFormItem>
        </div>
      </section>

      <section class="form-section">
        <div class="section-heading"><span>05</span><h3>教育经历</h3><ElButton text type="primary" @click="addEducation">添加教育经历</ElButton></div>
        <div v-for="(item, index) in form.education" :key="item.id" class="entry-card">
          <div class="entry-toolbar"><strong>教育 {{ String(index + 1).padStart(2, '0') }}</strong><div><ElButton text :disabled="index === 0" @click="move(form.education, index, -1)">上移</ElButton><ElButton text :disabled="index === form.education.length - 1" @click="move(form.education, index, 1)">下移</ElButton><ElButton text type="danger" @click="form.education.splice(index, 1)">删除</ElButton></div></div>
          <div class="form-grid"><ElFormItem label="学校"><ElInput v-model="item.school" /></ElFormItem><ElFormItem label="学历"><ElInput v-model="item.degree" /></ElFormItem><ElFormItem label="专业"><ElInput v-model="item.major" /></ElFormItem><ElFormItem label="开始时间"><ElInput v-model="item.start" /></ElFormItem><ElFormItem label="结束时间"><ElInput v-model="item.end" /></ElFormItem></div>
          <ElFormItem label="补充说明"><ElInput v-model="item.description" /></ElFormItem>
        </div>
      </section>
    </ElForm>
  </div>
</template>

<style scoped>
  .page-content { padding: 20px; }
  .toolbar, .section-heading, .entry-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .toolbar { margin-bottom: 20px; }
  h2, h3, p { margin: 0; }
  h2 { font-size: 18px; }
  h3 { font-size: 15px; }
  .toolbar p { margin-top: 5px; color: var(--el-text-color-secondary); font-size: 13px; }
  .resume-form { max-width: 1020px; }
  .form-section { padding: 22px 0; border-top: 1px solid var(--el-border-color-lighter); }
  .form-section:first-child { border-top: 0; padding-top: 0; }
  .section-heading { justify-content: flex-start; margin-bottom: 16px; }
  .section-heading span { color: var(--el-color-primary); font-family: ui-monospace, monospace; font-size: 12px; }
  .section-heading .el-button { margin-left: auto; }
  .form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 14px; }
  .entry-card { margin-top: 14px; padding: 16px; border: 1px solid var(--el-border-color-lighter); border-radius: 6px; background: var(--el-fill-color-lighter); }
  .entry-toolbar { margin-bottom: 12px; font-size: 13px; }
  @media (max-width: 760px) { .toolbar { align-items: flex-start; flex-direction: column; } .form-grid { grid-template-columns: 1fr; } .entry-toolbar { align-items: flex-start; flex-direction: column; gap: 4px; } }
</style>
