<script setup lang="ts">
  import { ElMessage, ElMessageBox, type UploadRequestOptions } from 'element-plus'
  import { blogApi } from '@/api/blog'

  const visible = defineModel<boolean>('visible', { default: false })
  const emit = defineEmits<{ created: [id: number] }>()

  const form = reactive({
    name: '',
    description: '',
    status: 'draft' as Api.Blog.ArticleStatus,
    sort: 0,
    cover: null as string | null
  })
  const submitting = ref(false)

  const isDirty = computed(
    () =>
      form.name.trim() !== '' ||
      form.description.trim() !== '' ||
      form.cover !== null ||
      form.status !== 'draft' ||
      form.sort !== 0
  )

  function resetForm() {
    Object.assign(form, { name: '', description: '', status: 'draft', sort: 0, cover: null })
  }

  function beforeClose(done: () => void) {
    if (submitting.value) return
    if (!isDirty.value) {
      done()
      return
    }
    ElMessageBox.confirm('内容尚未保存，确定关闭吗？', '提示', { type: 'warning' })
      .then(() => done())
      .catch(() => undefined)
  }

  async function uploadCover(options: UploadRequestOptions) {
    try {
      const { url } = await blogApi.upload(options.file)
      form.cover = url
      options.onSuccess({ url })
    } catch (error) {
      options.onError(error as Error)
      ElMessage.error('封面上传失败')
    }
  }

  async function submit() {
    const name = form.name.trim()
    if (!name) {
      ElMessage.warning('请输入专栏名称')
      return
    }

    submitting.value = true
    try {
      const column = await blogApi.createColumn({
        name,
        description: form.description.trim() || null,
        cover: form.cover,
        status: form.status,
        sort: Math.max(0, Math.floor(Number(form.sort) || 0))
      })
      visible.value = false
      emit('created', column.id)
      ElMessage.success('专栏已创建，现在可以收录文章')
    } finally {
      submitting.value = false
    }
  }
</script>

<template>
  <ElDialog
    v-model="visible"
    :before-close="beforeClose"
    :close-on-click-modal="false"
    :close-on-press-escape="!submitting"
    title="新建专栏"
    width="560px"
    @closed="resetForm"
  >
    <ElForm label-position="top">
      <ElFormItem label="专栏名称" required>
        <ElInput v-model="form.name" maxlength="100" placeholder="例如：前端工程化漫谈" show-word-limit />
      </ElFormItem>
      <ElFormItem label="简介">
        <ElInput
          v-model="form.description"
          :autosize="{ minRows: 3, maxRows: 5 }"
          maxlength="500"
          placeholder="用一两句话介绍这个专栏"
          show-word-limit
          type="textarea"
        />
      </ElFormItem>
      <ElRow :gutter="16">
        <ElCol :span="12">
          <ElFormItem label="状态">
            <ElRadioGroup v-model="form.status">
              <ElRadioButton value="draft">草稿</ElRadioButton>
              <ElRadioButton value="published">已发布</ElRadioButton>
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="排序">
            <ElInputNumber v-model="form.sort" :min="0" :precision="0" />
            <div class="form-hint">数值越小，专栏越靠前。</div>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElFormItem label="封面">
        <div class="cover-field">
          <div class="cover-preview">
            <img v-if="form.cover" :src="form.cover" alt="专栏封面预览" />
            <ArtSvgIcon v-else icon="ri:image-line" />
          </div>
          <ElUpload :http-request="uploadCover" :show-file-list="false" accept="image/jpeg,image/png,image/webp">
            <ElButton size="small">{{ form.cover ? '更换封面' : '上传封面' }}</ElButton>
          </ElUpload>
          <ElButton v-if="form.cover" link size="small" type="danger" @click="form.cover = null">移除</ElButton>
          <span class="form-hint">建议尺寸 800×450，支持 JPG、PNG、WebP。</span>
        </div>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton :disabled="submitting" @click="visible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="submit">创建并继续编辑</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
  .cover-field { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  .cover-preview { display: grid; width: 96px; height: 54px; overflow: hidden; color: var(--art-gray-400); background: var(--default-bg-color); border: 1px solid var(--default-border); border-radius: 4px; place-items: center; }
  .cover-preview img { width: 100%; height: 100%; object-fit: cover; }
  .cover-preview :deep(.art-svg-icon) { font-size: 22px; }
  .form-hint { margin-top: 6px; color: var(--art-gray-500); font-size: 12px; line-height: 1.5; }
</style>
