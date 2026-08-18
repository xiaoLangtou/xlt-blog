<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { blogApi } from '@/api/blog'

  const categories = ref<Api.Blog.Category[]>([])
  const dialogVisible = ref(false)
  const editingId = ref<number>()
  const form = reactive<Api.Blog.SaveCategory>({ name: '', slug: '', description: '', sort: 0 })

  async function load() {
    categories.value = await blogApi.listCategories()
  }
  function open(item?: unknown) {
    const category = item as Api.Blog.Category | undefined
    editingId.value = category?.id
    Object.assign(
      form,
      category
        ? {
            name: category.name,
            slug: category.slug,
            description: category.description ?? '',
            sort: category.sort
          }
        : { name: '', slug: '', description: '', sort: 0 }
    )
    dialogVisible.value = true
  }
  async function save() {
    if (!form.name || !form.slug) return ElMessage.warning('请填写名称和 Slug')
    if (editingId.value) await blogApi.updateCategory(editingId.value, form)
    else await blogApi.createCategory(form)
    dialogVisible.value = false
    await load()
    ElMessage.success('分类已保存')
  }
  async function remove(item: unknown) {
    const category = item as Api.Blog.Category
    await ElMessageBox.confirm(`确认删除分类「${category.name}」？`, '删除分类', {
      type: 'warning'
    })
    await blogApi.deleteCategory(category.id)
    await load()
    ElMessage.success('分类已删除')
  }
  onMounted(load)
</script>
<template>
  <div class="page-content"
    ><div class="toolbar"
      ><h2>分类管理</h2><ElButton type="primary" @click="open()">新建分类</ElButton></div
    ><ElTable :data="categories"
      ><ElTableColumn prop="name" label="名称" /><ElTableColumn
        prop="slug"
        label="Slug"
      /><ElTableColumn prop="description" label="描述" /><ElTableColumn
        prop="sort"
        label="排序"
        width="90"
      /><ElTableColumn label="文章" width="90"
        ><template #default="{ row }">{{ row.articleCount ?? 0 }}</template></ElTableColumn
      ><ElTableColumn label="操作" width="140"
        ><template #default="{ row }"
          ><ElButton link type="primary" @click="open(row)">编辑</ElButton
          ><ElButton link type="danger" @click="remove(row)">删除</ElButton></template
        ></ElTableColumn
      ></ElTable
    ><ElDialog v-model="dialogVisible" :title="editingId ? '编辑分类' : '新建分类'" width="460px"
      ><ElForm label-position="top"
        ><ElFormItem label="名称"><ElInput v-model="form.name" /></ElFormItem
        ><ElFormItem label="Slug"><ElInput v-model="form.slug" /></ElFormItem
        ><ElFormItem label="描述"><ElInput v-model="form.description" type="textarea" /></ElFormItem
        ><ElFormItem label="排序"
          ><ElInputNumber v-model="form.sort" :min="0" /></ElFormItem></ElForm
      ><template #footer
        ><ElButton @click="dialogVisible = false">取消</ElButton
        ><ElButton type="primary" @click="save">保存</ElButton></template
      ></ElDialog
    ></div
  >
</template>
<style scoped>
  .page-content {
    padding: 20px;
  }
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .toolbar h2 {
    margin: 0;
    font-size: 18px;
  }
</style>
