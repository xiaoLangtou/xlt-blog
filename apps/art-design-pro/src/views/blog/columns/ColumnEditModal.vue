<script setup lang="ts">
  import { ElMessage, ElMessageBox, type UploadRequestOptions } from 'element-plus'
  import { blogApi } from '@/api/blog'

  const visible = defineModel<boolean>('visible', { default: false })
  const props = defineProps<{ columnId: number | null }>()
  const emit = defineEmits<{ success: [] }>()

  const form = reactive({
    name: '',
    description: '',
    status: 'draft' as Api.Blog.ArticleStatus,
    sort: 0,
    cover: null as string | null
  })
  const selectedArticles = ref<Api.Blog.ColumnArticleItem[]>([])
  const articleOptions = ref<Api.Blog.Article[]>([])
  const pendingArticleId = ref<number>()
  const loading = ref(false)
  const submitting = ref(false)
  const articleSearching = ref(false)
  const initialState = ref('')
  let loadVersion = 0

  const isDirty = computed(() => initialState.value !== snapshot())

  function snapshot() {
    return JSON.stringify({ ...form, articleIds: selectedArticles.value.map((article) => article.id) })
  }

  function resetForm() {
    Object.assign(form, { name: '', description: '', status: 'draft', sort: 0, cover: null })
    selectedArticles.value = []
    articleOptions.value = []
    pendingArticleId.value = undefined
    initialState.value = snapshot()
  }

  async function loadColumn() {
    if (!props.columnId) return
    const version = ++loadVersion
    loading.value = true
    try {
      const detail = await blogApi.getColumn(props.columnId)
      if (!visible.value || version !== loadVersion) return
      Object.assign(form, {
        name: detail.name,
        description: detail.description ?? '',
        status: detail.status,
        sort: detail.sort,
        cover: detail.cover ?? null
      })
      selectedArticles.value = (detail.articles ?? []).map((article) => ({ ...article }))
      await nextTick()
      initialState.value = snapshot()
    } finally {
      if (version === loadVersion) loading.value = false
    }
  }

  watch(visible, (value) => {
    if (value) void loadColumn()
    else loadVersion++
  })

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

  async function searchArticles(keyword: string) {
    const value = keyword.trim()
    if (!value) {
      articleOptions.value = []
      return
    }
    articleSearching.value = true
    try {
      const data = await blogApi.listArticles({ page: 1, pageSize: 20, keyword: value })
      articleOptions.value = data.items ?? []
    } finally {
      articleSearching.value = false
    }
  }

  function isSelected(articleId: number) {
    return selectedArticles.value.some((article) => article.id === articleId)
  }

  function addArticle(articleId?: number) {
    if (articleId == null || isSelected(articleId)) {
      pendingArticleId.value = undefined
      return
    }
    const article = articleOptions.value.find((item) => item.id === articleId)
    if (article) {
      selectedArticles.value.push({ id: article.id, title: article.title, sort: selectedArticles.value.length })
    }
    pendingArticleId.value = undefined
  }

  function removeArticle(index: number) {
    selectedArticles.value.splice(index, 1)
  }

  function moveArticle(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= selectedArticles.value.length) return
    const [article] = selectedArticles.value.splice(index, 1)
    selectedArticles.value.splice(target, 0, article)
  }

  async function submit() {
    if (!props.columnId) return
    const name = form.name.trim()
    if (!name) {
      ElMessage.warning('请输入专栏名称')
      return
    }

    submitting.value = true
    let metadataSaved = false
    try {
      await blogApi.updateColumn(props.columnId, {
        name,
        description: form.description.trim() || null,
        cover: form.cover,
        status: form.status,
        sort: Math.max(0, Math.floor(Number(form.sort) || 0))
      })
      metadataSaved = true
      await blogApi.setColumnArticles(props.columnId, selectedArticles.value.map((article) => article.id))
      visible.value = false
      emit('success')
      ElMessage.success('专栏已保存')
    } catch {
      if (metadataSaved) ElMessage.error('专栏信息已保存，但文章收录未保存，请检查后重试')
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
    title="编辑专栏"
    width="860px"
    @closed="resetForm"
  >
    <div v-loading="loading" class="column-editor">
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

      <ElDivider content-position="left">收录文章</ElDivider>
      <div class="article-editor">
        <ElSelect
          v-model="pendingArticleId"
          clearable
          filterable
          :loading="articleSearching"
          placeholder="搜索文章标题并添加"
          remote
          reserve-keyword
          @change="addArticle"
          @remote-method="searchArticles"
        >
          <ElOption
            v-for="article in articleOptions"
            :key="article.id"
            :disabled="isSelected(article.id)"
            :label="article.title"
            :value="article.id"
          >
            <div class="article-option">
              <span>{{ article.title }}</span>
              <ElTag :type="article.status === 'published' ? 'primary' : 'info'" size="small">
                {{ article.status === 'published' ? '已发布' : '草稿' }}
              </ElTag>
            </div>
          </ElOption>
        </ElSelect>
        <p class="form-hint">草稿文章可以收录，但不会出现在前台已发布专栏中。</p>

        <ElTable v-if="selectedArticles.length" :data="selectedArticles" border class="article-table" max-height="260" size="small">
          <ElTableColumn label="顺序" type="index" width="64" />
          <ElTableColumn label="文章标题" min-width="320" prop="title" show-overflow-tooltip />
          <ElTableColumn label="操作" width="170">
            <template #default="{ $index }">
              <ElButton :disabled="$index === 0" link size="small" @click="moveArticle($index, -1)">上移</ElButton>
              <ElButton :disabled="$index === selectedArticles.length - 1" link size="small" @click="moveArticle($index, 1)">下移</ElButton>
              <ElButton link size="small" type="danger" @click="removeArticle($index)">移除</ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
        <ElEmpty v-else :image-size="52" description="尚未收录文章" />
      </div>
    </div>

    <template #footer>
      <ElButton :disabled="submitting" @click="visible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="submit">保存</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
  .column-editor { min-height: 430px; }
  .cover-field { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  .cover-preview { display: grid; width: 96px; height: 54px; overflow: hidden; color: var(--art-gray-400); background: var(--default-bg-color); border: 1px solid var(--default-border); border-radius: 4px; place-items: center; }
  .cover-preview img { width: 100%; height: 100%; object-fit: cover; }
  .cover-preview :deep(.art-svg-icon) { font-size: 22px; }
  .form-hint { margin: 6px 0 0; color: var(--art-gray-500); font-size: 12px; line-height: 1.5; }
  .article-editor :deep(.el-select) { width: 100%; }
  .article-option { display: flex; gap: 12px; align-items: center; justify-content: space-between; min-width: 0; }
  .article-option > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .article-table { width: 100%; margin-top: 14px; }
  .article-editor :deep(.el-empty) { padding: 24px 0 4px; }
</style>
