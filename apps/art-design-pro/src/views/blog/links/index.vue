<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { blogApi } from '@/api/blog'

  const links = ref<Api.Blog.FriendLink[]>([])
  const dialogVisible = ref(false)
  const editingId = ref<number>()
  const form = reactive<Api.Blog.SaveFriendLink>({
    name: '',
    url: '',
    logo: '',
    description: '',
    sort: 0
  })

  async function load() {
    links.value = await blogApi.listLinks()
  }

  function open(item?: unknown) {
    const link = item as Api.Blog.FriendLink | undefined
    editingId.value = link?.id
    Object.assign(
      form,
      link
        ? {
            name: link.name,
            url: link.url,
            logo: link.logo ?? '',
            description: link.description ?? '',
            sort: link.sort
          }
        : { name: '', url: '', logo: '', description: '', sort: 0 }
    )
    dialogVisible.value = true
  }

  async function save() {
    if (!form.name || !form.url) return ElMessage.warning('请填写名称和链接')
    if (editingId.value) await blogApi.updateLink(editingId.value, form)
    else await blogApi.createLink(form)
    dialogVisible.value = false
    await load()
    ElMessage.success('友情链接已保存')
  }

  async function remove(item: unknown) {
    const link = item as Api.Blog.FriendLink
    await ElMessageBox.confirm(`确认删除「${link.name}」？`, '删除友情链接', { type: 'warning' })
    await blogApi.deleteLink(link.id)
    await load()
    ElMessage.success('友情链接已删除')
  }

  onMounted(load)
</script>

<template>
  <div class="page-content">
    <div class="toolbar"
      ><div><h2>友情链接</h2><p>维护公开站点展示的推荐链接</p></div
      ><ElButton type="primary" @click="open()">新建友链</ElButton></div
    >
    <ElTable :data="links"
      ><ElTableColumn prop="name" label="名称" width="170" /><ElTableColumn
        prop="url"
        label="链接"
        min-width="260"
        show-overflow-tooltip
      /><ElTableColumn
        prop="description"
        label="描述"
        min-width="180"
        show-overflow-tooltip
      /><ElTableColumn prop="sort" label="排序" width="90" /><ElTableColumn
        label="操作"
        width="140"
        fixed="right"
        ><template #default="{ row }"
          ><ElButton link type="primary" @click="open(row)">编辑</ElButton
          ><ElButton link type="danger" @click="remove(row)">删除</ElButton></template
        ></ElTableColumn
      ></ElTable
    >
    <ElDialog
      v-model="dialogVisible"
      :title="editingId ? '编辑友链' : '新建友链'"
      width="min(560px, 94vw)"
      ><ElForm label-position="top"
        ><ElFormItem label="名称"><ElInput v-model="form.name" /></ElFormItem
        ><ElFormItem label="链接"><ElInput v-model="form.url" /></ElFormItem
        ><ElFormItem label="图标 URL"><ElInput v-model="form.logo" /></ElFormItem
        ><ElFormItem label="描述"><ElInput v-model="form.description" type="textarea" /></ElFormItem
        ><ElFormItem label="排序"
          ><ElInputNumber v-model="form.sort" :min="0" /></ElFormItem></ElForm
      ><template #footer
        ><ElButton @click="dialogVisible = false">取消</ElButton
        ><ElButton type="primary" @click="save">保存</ElButton></template
      ></ElDialog
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
