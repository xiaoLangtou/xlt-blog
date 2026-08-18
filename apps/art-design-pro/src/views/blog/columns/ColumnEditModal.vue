<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { blogApi } from '@/api/blog'

  const visible = defineModel<boolean>('visible', { default: false })
  const props = defineProps<{ columnId: number | null }>()
  const emit = defineEmits<{ success: [] }>()

  const loading = ref(false)
  const submitting = ref(false)
  const dirty = ref(false)
  let suppressDirty = false

  const form = reactive<{
    name: string
    description: string
    status: Api.Blog.ArticleStatus
    sort: number
    cover: string | null
  }>({ name: '', description: '', status: 'draft', sort: 0, cover: null })

  const selectedArticles = ref<Api.Blog.ColumnArticleItem[]>([])
  const articleOptions = ref<Api.Blog.Article[]>([])
  const articleSearching = ref(false)
  const pendingArticleId = ref<number>()
  const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

  watch(
    [form, selectedArticles],
    () => {
      if (!suppressDirty) dirty.value = true
    },
    { deep: true }
  )

  async function loadColumn() {
    if (!props.columnId) return
    loading.value = true
    try {
      const detail = await blogApi.getColumn(props.columnId)
      suppressDirty = true
      Object.assign(form, {
        name: detail.name,
        description: detail.description ?? '',
        status: detail.status,
        sort: detail.sort,
        cover: detail.cover ?? null
      })
      selectedArticles.value = detail.articles ?? []
      await nextTick()
      suppressDirty = false
      dirty.value = false
    } finally {
      loading.value = false
    }
  }

  watch(visible, (value) => {
    if (value) loadColumn()
  })

  async function handleClose() {
    if (dirty.value) {
      try {
        await ElMessageBox.confirm('内容尚未保存，确定关闭吗？', '提示', { type: 'warning' })
      } catch {
        return
      }
    }
    visible.value = false
  }

  function onDescriptionInput() {
    if (form.description.length > 500) {
      form.description = form.description.slice(0, 500)
      ElMessage.warning('简介不能超过 500 字')
    }
  }

  function decrement() {
    if (form.sort > 0) form.sort--
  }

  function increment() {
    form.sort++
  }

  function onSortInput() {
    const value = Math.floor(Number(form.sort))
    form.sort = Number.isFinite(value) && value >= 0 ? value : 0
  }

  function triggerUpload() {
    fileInput.value?.click()
  }

  function onFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      ElMessage.error('仅支持 JPG / PNG 图片')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      ElMessage.error('图片大小不能超过 2MB')
      return
    }
    uploadCover(file)
  }

  async function uploadCover(file: File) {
    try {
      const { url } = await blogApi.upload(file)
      form.cover = url
    } catch {
      ElMessage.error('封面上传失败')
    }
  }

  function removeCover() {
    form.cover = null
  }

  async function searchArticles(keyword: string) {
    if (!keyword.trim()) {
      articleOptions.value = []
      return
    }
    articleSearching.value = true
    try {
      const data = await blogApi.listArticles({ page: 1, pageSize: 20, keyword: keyword.trim() })
      articleOptions.value = data.items ?? []
    } finally {
      articleSearching.value = false
    }
  }

  function addArticle(articleId?: number) {
    if (articleId == null) return
    if (selectedArticles.value.some((item) => item.id === articleId)) {
      pendingArticleId.value = undefined
      return
    }
    const article = articleOptions.value.find((item) => item.id === articleId)
    if (article) {
      selectedArticles.value.push({
        id: article.id,
        title: article.title,
        sort: selectedArticles.value.length
      })
    }
    pendingArticleId.value = undefined
  }

  function removeArticle(index: number) {
    selectedArticles.value.splice(index, 1)
  }

  function moveArticle(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= selectedArticles.value.length) return
    const list = selectedArticles.value
    const [item] = list.splice(index, 1)
    list.splice(target, 0, item)
  }

  async function submit() {
    if (!props.columnId) return
    if (!form.name.trim()) {
      ElMessage.warning('请输入专栏名称')
      return
    }
    submitting.value = true
    try {
      await blogApi.updateColumn(props.columnId, {
        name: form.name.trim(),
        description: form.description || null,
        cover: form.cover,
        status: form.status,
        sort: form.sort || 0
      })
      await blogApi.setColumnArticles(
        props.columnId,
        selectedArticles.value.map((item) => item.id)
      )
      visible.value = false
      emit('success')
      ElMessage.success('专栏已保存')
    } finally {
      submitting.value = false
    }
  }
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-mask" @click.self="handleClose">
      <div class="modal" v-loading="loading">
        <div class="modal-header">
          <h2>编辑专栏</h2>
          <button class="modal-close" type="button" aria-label="关闭" @click="handleClose">
            <ArtSvgIcon icon="ri:close-line" />
          </button>
        </div>

        <div class="modal-body">
          <div class="field">
            <label>专栏名称</label>
            <input
              v-model="form.name"
              class="input"
              type="text"
              maxlength="100"
              placeholder="例如：前端工程化漫谈"
            />
          </div>

          <div class="field">
            <label>简介</label>
            <div class="textarea-wrap">
              <textarea
                v-model="form.description"
                class="textarea"
                placeholder="用一两句话介绍这个专栏"
                @input="onDescriptionInput"
              />
              <span class="char-count">{{ form.description.length }} / 500</span>
            </div>
          </div>

          <div class="row-2col">
            <div class="field">
              <label>状态</label>
              <div class="segmented">
                <button
                  type="button"
                  :class="{ active: form.status === 'draft' }"
                  @click="form.status = 'draft'"
                >
                  草稿
                </button>
                <button
                  type="button"
                  :class="{ active: form.status === 'published' }"
                  @click="form.status = 'published'"
                >
                  发布
                </button>
              </div>
            </div>
            <div class="field">
              <label>排序</label>
              <div class="stepper">
                <button type="button" :disabled="form.sort <= 0" @click="decrement">−</button>
                <input v-model.number="form.sort" type="number" min="0" @input="onSortInput" />
                <button type="button" @click="increment">+</button>
              </div>
            </div>
          </div>

          <div class="field">
            <label>封面</label>
            <div v-if="!form.cover" class="cover-upload" @click="triggerUpload">
              <span class="plus-badge"><ArtSvgIcon icon="ri:add-line" /></span>
              <span class="upload-label">上传封面</span>
            </div>
            <div v-else class="cover-preview">
              <img :src="form.cover" alt="封面预览" />
              <div class="cover-preview__actions">
                <button type="button" class="cover-preview__btn" @click="triggerUpload"
                  >替换</button
                >
                <button
                  type="button"
                  class="cover-preview__btn cover-preview__btn--danger"
                  @click="removeCover"
                >
                  移除
                </button>
              </div>
            </div>
            <span class="cover-hint">建议尺寸 800×450，支持 JPG / PNG，不超过 2MB</span>
          </div>

          <div class="articles-divider" />

          <div class="field">
            <label>收录文章</label>
            <ElSelect
              v-model="pendingArticleId"
              filterable
              remote
              reserve-keyword
              clearable
              placeholder="搜索文章标题并添加"
              :remote-method="searchArticles"
              :loading="articleSearching"
              @change="addArticle"
            >
              <ElOption
                v-for="item in articleOptions"
                :key="item.id"
                :label="item.title"
                :value="item.id"
              />
            </ElSelect>
          </div>

          <div v-if="selectedArticles.length" class="article-list">
            <div v-for="(item, index) in selectedArticles" :key="item.id" class="article-item">
              <span class="article-item__index">{{ index + 1 }}</span>
              <span class="article-item__title">{{ item.title }}</span>
              <div class="article-item__actions">
                <button
                  type="button"
                  class="article-item__btn"
                  :disabled="index === 0"
                  @click="moveArticle(index, -1)"
                >
                  上移
                </button>
                <button
                  type="button"
                  class="article-item__btn"
                  :disabled="index === selectedArticles.length - 1"
                  @click="moveArticle(index, 1)"
                >
                  下移
                </button>
                <button
                  type="button"
                  class="article-item__btn article-item__btn--danger"
                  @click="removeArticle(index)"
                >
                  移除
                </button>
              </div>
            </div>
          </div>
          <div v-else class="article-empty">尚未收录文章</div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" @click="handleClose">取消</button>
          <button type="button" class="btn btn-primary" :disabled="submitting" @click="submit">
            保存
          </button>
        </div>
      </div>

      <input
        ref="fileInput"
        class="hidden-file-input"
        type="file"
        accept="image/jpeg,image/png"
        @change="onFileChange"
      />
    </div>
  </Teleport>
</template>

<style scoped>
  .modal-mask {
    position: fixed;
    inset: 0;
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(0 0 0 / 45%);
  }

  .modal {
    width: 560px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 48px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 12px 40px rgb(0 0 0 / 18%);
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding-right: 24px;
    padding-left: 24px;
  }

  .modal-header {
    flex: 0 0 auto;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #ebedf0;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    line-height: 1;
    color: #1f2329;
  }

  .modal-close {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    color: #8a8f99;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 6px;
  }

  .modal-close:hover {
    color: #1f2329;
    background: #f2f3f5;
  }

  .modal-close :deep(.art-svg-icon) {
    font-size: 16px;
  }

  .modal-body {
    flex: 1 1 auto;
    display: grid;
    padding-top: 24px;
    padding-bottom: 24px;
    row-gap: 24px;
    overflow-y: auto;
  }

  .field {
    display: grid;
    row-gap: 8px;
  }

  .field > label {
    font-size: 13px;
    font-weight: 600;
    line-height: 20px;
    color: #1f2329;
  }

  .input {
    width: 100%;
    height: 40px;
    padding: 0 12px;
    font-size: 14px;
    color: #1f2329;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    outline: none;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .input::placeholder {
    color: #b0b3bb;
  }

  .input:focus {
    border-color: #1662ff;
    box-shadow: 0 0 0 3px #eaf1ff;
  }

  .textarea-wrap {
    position: relative;
  }

  .textarea {
    display: block;
    width: 100%;
    height: 88px;
    padding: 10px 12px 26px;
    font-size: 14px;
    color: #1f2329;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    outline: none;
    resize: vertical;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .textarea::placeholder {
    color: #b0b3bb;
  }

  .textarea:focus {
    border-color: #1662ff;
    box-shadow: 0 0 0 3px #eaf1ff;
  }

  .char-count {
    position: absolute;
    right: 12px;
    bottom: 10px;
    font-size: 12px;
    line-height: 1;
    color: #b0b3bb;
    pointer-events: none;
  }

  .row-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 24px;
  }

  .segmented {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    height: 40px;
    padding: 3px;
    background: #f2f3f5;
    border-radius: 8px;
  }

  .segmented button {
    font-size: 14px;
    color: #8a8f99;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 6px;
    transition: all 0.15s ease;
  }

  .segmented button.active {
    font-weight: 600;
    color: #1662ff;
    background: #fff;
    box-shadow: 0 1px 2px rgb(0 0 0 / 8%);
  }

  .stepper {
    display: grid;
    grid-template-columns: 40px 1fr 40px;
    height: 40px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .stepper button {
    font-size: 16px;
    line-height: 1;
    color: #8a8f99;
    cursor: pointer;
    background: #fafafa;
    border: none;
  }

  .stepper button:hover:not(:disabled) {
    color: #1f2329;
    background: #f2f3f5;
  }

  .stepper button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .stepper input {
    width: 100%;
    font-size: 14px;
    color: #1f2329;
    text-align: center;
    border: none;
    border-right: 1px solid #e5e7eb;
    border-left: 1px solid #e5e7eb;
    outline: none;
    appearance: textfield;
  }

  .stepper input::-webkit-outer-spin-button,
  .stepper input::-webkit-inner-spin-button {
    margin: 0;
    appearance: none;
  }

  .cover-upload {
    width: 480px;
    height: 270px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: center;
    color: #8a8f99;
    cursor: pointer;
    background: #f7f8fa;
    border: 1.5px dashed #d3d6dc;
    border-radius: 8px;
    transition:
      border-color 0.15s ease,
      background 0.15s ease,
      color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .cover-upload:hover {
    color: #1662ff;
    background: #eaf1ff;
    border-color: #1662ff;
    box-shadow: 0 2px 8px rgb(22 98 255 / 12%);
  }

  .cover-upload .plus-badge {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #eceef1;
    border-radius: 50%;
    transition: background 0.15s ease;
  }

  .cover-upload:hover .plus-badge {
    background: #fff;
  }

  .cover-upload .plus-badge :deep(.art-svg-icon) {
    font-size: 16px;
  }

  .cover-upload .upload-label {
    font-size: 13px;
    font-weight: 500;
  }

  .cover-preview {
    position: relative;
    width: 480px;
    height: 270px;
    overflow: hidden;
    border-radius: 8px;
  }

  .cover-preview img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-preview__actions {
    position: absolute;
    right: 8px;
    bottom: 8px;
    display: flex;
    gap: 8px;
  }

  .cover-preview__btn {
    height: 28px;
    padding: 0 12px;
    font-size: 12px;
    color: #fff;
    cursor: pointer;
    background: rgb(0 0 0 / 50%);
    border: none;
    border-radius: 6px;
  }

  .cover-preview__btn:hover {
    background: rgb(0 0 0 / 65%);
  }

  .cover-preview__btn--danger:hover {
    background: rgb(220 38 38 / 75%);
  }

  .cover-hint {
    font-size: 12px;
    line-height: 1.6;
    color: #b0b3bb;
  }

  .articles-divider {
    height: 1px;
    background: #ebedf0;
  }

  .article-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .article-item {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 12px;
    background: #f7f8fa;
    border: 1px solid #ebedf0;
    border-radius: 8px;
  }

  .article-item__index {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 600;
    color: #1662ff;
    background: #eaf1ff;
    border-radius: 6px;
  }

  .article-item__title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: 14px;
    color: #1f2329;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .article-item__actions {
    display: flex;
    flex: 0 0 auto;
    gap: 4px;
  }

  .article-item__btn {
    padding: 4px 6px;
    font-size: 12px;
    color: #8a8f99;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 4px;
  }

  .article-item__btn:hover:not(:disabled) {
    color: #1662ff;
    background: #eaf1ff;
  }

  .article-item__btn:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .article-item__btn--danger:hover:not(:disabled) {
    color: #dc2626;
    background: #fef2f2;
  }

  .article-empty {
    padding: 16px;
    font-size: 13px;
    color: #b0b3bb;
    text-align: center;
    background: #f7f8fa;
    border: 1px dashed #ebedf0;
    border-radius: 8px;
  }

  .modal-footer {
    flex: 0 0 auto;
    height: 64px;
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: flex-end;
    border-top: 1px solid #ebedf0;
  }

  .btn {
    height: 36px;
    padding: 0 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 8px;
  }

  .btn-ghost {
    color: #1f2329;
    background: #fff;
    border-color: #e5e7eb;
  }

  .btn-ghost:hover {
    border-color: #8a8f99;
  }

  .btn-primary {
    color: #fff;
    background: #1662ff;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0d52e0;
  }

  .btn-primary:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .hidden-file-input {
    display: none;
  }
</style>
