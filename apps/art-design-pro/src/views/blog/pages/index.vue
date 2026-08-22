<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { blogApi } from '@/api/blog'

  const pages = ref<Api.Blog.Page[]>([])
  const dialogVisible = ref(false)
  const editingId = ref<number>()
  const form = reactive<Api.Blog.SavePage>({
    title: '',
    slug: '',
    rawContent: '',
    editorType: 'md',
    status: 'draft'
  })

  async function load() {
    pages.value = await blogApi.listPages()
  }

  function open(item?: unknown) {
    const page = item as Api.Blog.Page | undefined
    editingId.value = page?.id
    Object.assign(
      form,
      page
        ? {
            title: page.title,
            slug: page.slug,
            rawContent: page.rawContent,
            editorType: page.editorType ?? 'md',
            status: page.status
          }
        : { title: '', slug: '', rawContent: '', editorType: 'md', status: 'draft' }
    )
    dialogVisible.value = true
  }

  async function save() {
    if (!form.title || !form.slug || !form.rawContent)
      return ElMessage.warning('请填写标题、Slug 和内容')
    if (editingId.value) await blogApi.updatePage(editingId.value, form)
    else await blogApi.createPage(form)
    dialogVisible.value = false
    await load()
    ElMessage.success('页面已保存')
  }

  async function remove(item: unknown) {
    const page = item as Api.Blog.Page
    await ElMessageBox.confirm(`确认删除「${page.title}」？`, '删除页面', { type: 'warning' })
    await blogApi.deletePage(page.id)
    await load()
    ElMessage.success('页面已删除')
  }

  onMounted(load)
</script>

<template>
  <div class="page-content">
    <div class="toolbar">
      <div><h2>独立页面</h2><p>管理网站中的关于、说明等独立内容</p></div>
      <ElButton type="primary" @click="open()">新建页面</ElButton>
    </div>
    <ElTable :data="pages">
      <ElTableColumn prop="title" label="标题" min-width="180" />
      <ElTableColumn prop="slug" label="Slug" min-width="160" />
      <ElTableColumn label="状态" width="100"
        ><template #default="{ row }"
          ><ElTag :type="row.status === 'published' ? 'success' : 'info'">{{
            row.status === 'published' ? '已发布' : '草稿'
          }}</ElTag></template
        ></ElTableColumn
      >
      <ElTableColumn label="更新时间" min-width="160"
        ><template #default="{ row }">{{
          new Date(row.updatedAt).toLocaleString('zh-CN')
        }}</template></ElTableColumn
      >
      <ElTableColumn label="操作" width="140" fixed="right"
        ><template #default="{ row }"
          ><ElButton link type="primary" @click="open(row)">编辑</ElButton
          ><ElButton link type="danger" @click="remove(row)">删除</ElButton></template
        ></ElTableColumn
      >
    </ElTable>
    <ElDialog
      v-model="dialogVisible"
      :title="editingId ? '编辑页面' : '新建页面'"
      width="min(780px, 94vw)"
    >
      <ElForm label-position="top"
        ><ElFormItem label="标题"><ElInput v-model="form.title" maxlength="200" /></ElFormItem
        ><ElFormItem label="Slug"><ElInput v-model="form.slug" /></ElFormItem
        ><ElFormItem label="状态"
          ><ElSelect v-model="form.status"
            ><ElOption label="草稿" value="draft" /><ElOption
              label="已发布"
              value="published" /></ElSelect></ElFormItem
        ><ElFormItem label="内容（Markdown）"
          ><ElInput v-model="form.rawContent" type="textarea" :rows="14" /></ElFormItem
      ></ElForm>
      <template #footer
        ><ElButton @click="dialogVisible = false">取消</ElButton
        ><ElButton type="primary" @click="save">保存</ElButton></template
      >
    </ElDialog>
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
    margin-bottom: 16px;
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
</style>
