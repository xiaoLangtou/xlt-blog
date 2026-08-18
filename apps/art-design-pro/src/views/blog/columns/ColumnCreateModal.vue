<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { blogApi } from '@/api/blog'

  const visible = defineModel<boolean>('visible', { default: false })
  const emit = defineEmits<{ success: [] }>()

  const form = reactive<{
    name: string
    description: string
    status: Api.Blog.ArticleStatus
    sort: number
    cover: string | null
  }>({ name: '', description: '', status: 'draft', sort: 0, cover: null })

  const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
  const submitting = ref(false)

  const isDirty = computed(
    () =>
      form.name.trim() !== '' ||
      form.description.trim() !== '' ||
      form.cover !== null ||
      form.sort !== 0
  )

  function resetForm() {
    Object.assign(form, { name: '', description: '', status: 'draft', sort: 0, cover: null })
  }

  watch(visible, (value) => {
    if (value) resetForm()
  })

  async function handleClose() {
    if (isDirty.value) {
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

  async function submit() {
    if (!form.name.trim()) {
      ElMessage.warning('请输入专栏名称')
      return
    }
    submitting.value = true
    try {
      await blogApi.createColumn({
        name: form.name.trim(),
        description: form.description || null,
        cover: form.cover,
        status: form.status,
        sort: form.sort || 0
      })
      visible.value = false
      emit('success')
      ElMessage.success('专栏已创建')
    } finally {
      submitting.value = false
    }
  }
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-mask" @click.self="handleClose">
      <div class="modal">
        <div class="modal-header">
          <h2>新建专栏</h2>
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
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" @click="handleClose">取消</button>
          <button type="button" class="btn btn-primary" :disabled="submitting" @click="submit">
            创建
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
    width: 100%;
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
    width: 100%;
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
