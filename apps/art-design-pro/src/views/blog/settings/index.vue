<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { blogApi } from '@/api/blog'

  const loading = ref(false)
  const form = reactive<Api.Blog.SiteSettings>({ themeColor: '', menus: [] })

  async function load() {
    loading.value = true
    try {
      Object.assign(form, await blogApi.getSettings())
    } finally {
      loading.value = false
    }
  }

  async function save() {
    loading.value = true
    try {
      await blogApi.updateSettings({
        themeColor: form.themeColor,
        menus: form.menus.map((menu, index) => ({ ...menu, sort: index }))
      })
      ElMessage.success('站点设置已保存')
    } finally {
      loading.value = false
    }
  }

  function addMenu() {
    form.menus.push({ label: '', url: '', sort: form.menus.length })
  }

  onMounted(load)
</script>

<template>
  <div v-loading="loading" class="page-content">
    <div class="toolbar"
      ><div><h2>站点设置</h2><p>配置公开博客的主题色和导航菜单</p></div
      ><ElButton type="primary" :loading="loading" @click="save">保存设置</ElButton></div
    >
    <ElForm label-position="top" class="settings-form"
      ><ElFormItem label="主题色"
        ><ElSelect v-model="form.themeColor" placeholder="选择主题色"
          ><ElOption label="黛蓝" value="dai" /><ElOption label="竹青" value="zhuqing" /><ElOption
            label="紫棠"
            value="zitang" /><ElOption label="赭石" value="zheshi" /><ElOption
            label="黛绿"
            value="dailv" /></ElSelect></ElFormItem
      ><ElFormItem label="公开导航"
        ><div class="navigation-list"
          ><div v-for="(menu, index) in form.menus" :key="index" class="navigation-row"
            ><ElInput v-model="menu.label" placeholder="显示名称" /><ElInput
              v-model="menu.url"
              placeholder="链接地址"
            /><ElButton type="danger" text @click="form.menus.splice(index, 1)">删除</ElButton></div
          ><ElButton @click="addMenu">添加导航项</ElButton></div
        ></ElFormItem
      ></ElForm
    >
  </div>
</template>

<style scoped>
  .page-content {
    padding: 20px;
  }
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }
  h2 {
    margin: 0;
    font-size: 18px;
  }
  p {
    margin: 5px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
  .settings-form {
    max-width: 760px;
  }
  .navigation-list {
    width: 100%;
  }
  .navigation-row {
    display: grid;
    grid-template-columns: minmax(120px, 1fr) minmax(220px, 2fr) auto;
    gap: 10px;
    margin-bottom: 10px;
  }
  @media (max-width: 640px) {
    .toolbar {
      align-items: flex-start;
      flex-direction: column;
    }
    .navigation-row {
      grid-template-columns: 1fr;
    }
  }
</style>
