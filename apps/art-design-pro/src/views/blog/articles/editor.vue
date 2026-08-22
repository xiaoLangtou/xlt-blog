<script setup lang="ts">
  import { ElMessage, ElMessageBox, type UploadRequestOptions } from 'element-plus'
  import { blogApi } from '@/api/blog'
  import BlogMarkdownEditor from '@/components/blog/BlogMarkdownEditor.vue'
  import BlogTipTapEditor from '@/components/blog/BlogTipTapEditor.vue'
  import BlogDomternalEditor from '@/components/blog/BlogDomternalEditor.vue'
  import MediaLibraryPicker from '@/components/blog/MediaLibraryPicker.vue'
  import { useBlogAutoSave } from '@/hooks/blog/useBlogAutoSave'
  import { useBlogArticleStats } from '@/hooks/blog/useBlogArticleStats'

  const route = useRoute()
  const router = useRouter()
  const id = computed(() => Number(route.params.id) || 0)
  const isEditing = computed(() => Boolean(id.value))
  const loading = ref(false)
  const saving = ref(false)
  const categories = ref<Api.Blog.Category[]>([])
  const tags = ref<Api.Blog.Tag[]>([])
  const drawerOpen = ref(true)
  const coverPickerVisible = ref(false)
  /** 富文本编辑器输出的纯文本（字数统计 / 空内容校验用） */
  const contentText = ref('')
  const form = reactive<Api.Blog.SaveArticle>({
    title: '',
    slug: '',
    summary: '',
    rawContent: '',
    editorType: 'tiptap',
    codeTheme: 'github',
    cover: '',
    status: 'draft',
    categoryId: undefined,
    tagIds: []
  })

  // 切换编辑器不带入对方内容：确认后清空当前正文再切换类型。
  const editorTypeModel = computed<Api.Blog.EditorType>({
    get: () => form.editorType ?? 'tiptap',
    set: (next) => {
      void switchEditor(next)
    }
  })
 async function switchEditor(next: Api.Blog.EditorType) {
  if (next === form.editorType) return

  console.log('switchEditor', next)
  if (form.rawContent.trim()) {
    try {
      await ElMessageBox.confirm(
        '切换编辑器会清空当前正文（两种编辑器内容互不转换），确定切换吗？',
        '切换编辑器',
        { type: 'warning' }
      )
    } catch {
      return
    }
  }
  // 延迟到下一帧再切换组件，避开下拉选项点击事件的派发时序，
  // 防止新编辑器挂载后的 "+" 按钮恰好落在同一点击坐标上被误触
  await nextTick()
  form.rawContent = ''
  contentText.value = ''
  form.editorType = next
}

  /** 字数统计 / 空内容校验基于纯文本：Markdown 用原文，富文本用编辑器输出的纯文本 */
  const plainContent = () => (form.editorType === 'md' ? form.rawContent : contentText.value)
  const { words, readMinutes } = useBlogArticleStats(plainContent)
  const backupKey = computed(() => `blog-article-draft:${id.value || 'new'}`)

  function payload(status: Api.Blog.ArticleStatus = form.status ?? 'draft') {
    return {
      ...form,
      status,
      summary: form.summary || undefined,
      cover: form.cover || undefined,
      categoryId: form.categoryId || undefined,
      tagIds: form.tagIds ?? []
    }
  }

  async function persist(status?: Api.Blog.ArticleStatus) {
    if (!form.title.trim() || !plainContent().trim()) throw new Error('请填写标题和正文')
    const data = payload(status)
    if (id.value) await blogApi.updateArticle(id.value, data)
    else {
      const article = await blogApi.createArticle(data)
      await router.replace(`/blog/articles/${article.id}/edit`)
    }
  }

  const autoSave = useBlogAutoSave({
    source: () => ({ ...form }),
    enabled: () => isEditing.value && Boolean(form.title.trim() && plainContent().trim()),
    save: () => persist(),
    backupKey,
    backup: () => ({ ...form })
  })

  const saveHint = computed(
    () =>
      ({
        idle: '首次保存后自动保存',
        saving: '正在自动保存',
        saved: '已保存',
        error: '自动保存失败'
      })[autoSave.state.value]
  )

  async function load() {
    loading.value = true
    try {
      const [categoryData, tagData] = await Promise.all([
        blogApi.listCategories(),
        blogApi.listAllTags()
      ])
      categories.value = categoryData
      tags.value = tagData
      if (!id.value) return
      const article = await blogApi.getArticle(id.value)
      Object.assign(form, {
        title: article.title,
        slug: article.slug,
        summary: article.summary ?? '',
        rawContent: article.rawContent,
        editorType: article.editorType ?? 'tiptap',
        codeTheme: article.codeTheme ?? 'github',
        cover: article.cover ?? '',
        status: article.status,
        categoryId: article.category?.id,
        tagIds: article.tags.map((tag) => tag.id)
      })
      const backup = autoSave.readBackup()
      // 备份时间戳需明显晚于服务端更新时间才视为“有未保存的本地草稿”。
      // 容差 3 秒，规避 datetime 秒级精度与本地/服务端时钟偏差导致的误判。
      if (backup && backup.at - new Date(article.updatedAt).getTime() > 3000) {
        try {
          await ElMessageBox.confirm('检测到更新的本地草稿，是否恢复？', '恢复草稿', {
            type: 'info'
          })
          Object.assign(form, backup.data)
        } finally {
          // 无论恢复与否都清除已消费的本地草稿，避免下次进入重复提示
          autoSave.clearBackup()
        }
      }
    } catch (error) {
      if (error !== 'cancel') throw error
    } finally {
      loading.value = false
    }
  }

  async function saveDraft() {
    saving.value = true
    try {
      if (isEditing.value) {
        await autoSave.flush()
        if (autoSave.state.value === 'error') throw new Error('保存失败')
      } else {
        await persist('draft')
        form.status = 'draft'
      }
      ElMessage.success('草稿已保存')
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      saving.value = false
    }
  }

  async function publish() {
    saving.value = true
    try {
      await persist('published')
      form.status = 'published'
      ElMessage.success('文章已发布')
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '发布失败')
    } finally {
      saving.value = false
    }
  }

  async function close() {
    if (saving.value || autoSave.state.value === 'saving') {
      try {
        await ElMessageBox.confirm('内容仍在保存，确定要关闭编辑器吗？', '关闭编辑器', {
          type: 'warning'
        })
      } catch {
        return
      }
    }

    if (!isEditing.value && (form.title || form.rawContent)) {
      try {
        await ElMessageBox.confirm(
          '尚未创建文章，关闭后仅能从本地草稿恢复。确定关闭吗？',
          '关闭编辑器',
          {
            type: 'warning'
          }
        )
      } catch {
        return
      }
    }

    await router.push('/blog/articles')
  }

  async function uploadCover(options: UploadRequestOptions) {
    try {
      form.cover = (await blogApi.upload(options.file)).url
    } catch {
      ElMessage.error('封面上传失败')
    }
  }

  onMounted(load)
  onBeforeUnmount(autoSave.stop)
</script>

<template>
  <ElDrawer
    v-model="drawerOpen"
    size="100%"
    direction="rtl"
    :with-header="false"
    :append-to-body="true"
    :destroy-on-close="true"
    class="article-drawer"
    @close="close"
  >
    <div v-loading="loading" class="article-editor flex h-full min-h-0 flex-col bg-[var(--default-bg-color)] text-g-900">
      <header class="editor-header shrink-0 border-b border-[var(--default-border)] bg-box">
        <div class="editor-header__content flex min-h-16 items-center gap-5 px-7">
          <div class="header-main flex min-w-0 flex-1 items-center gap-2.5">
            <ElButton text class="back-button text-g-700" aria-label="返回文章列表" @click="close">
              <ArtSvgIcon icon="ri:arrow-left-line" />返回
            </ElButton>
            <span class="header-divider h-5 w-px bg-[var(--default-border)]" aria-hidden="true" />
            <ElInput
              v-model="form.title"
              class="masthead-title"
              placeholder="输入文章标题…"
              maxlength="200"
            />
          </div>
          <div class="header-actions flex shrink-0 items-center gap-3 [&_.el-button+.el-button]:ml-0 [&_.el-button_.art-svg-icon]:mr-[5px]">
            <ElSelect
              v-model="editorTypeModel"
              placeholder="选择编辑方式"
              class="editor-mode-select !w-20 [&_.el-select__wrapper]:px-2"
              aria-label="编辑方式"
            >
              <template #label="{ value }">
                <img
                  v-if="value === 'tiptap'"
                  class="size-5 object-contain"
                  src="https://cdn.prod.website-files.com/645a9acecda2e0594fac6126/657b062a9b2afac48c705261_favicon-32x32.png"
                  alt="TipTap"
                />
                <img
                  v-else-if="value === 'domternal'"
                  class="size-5 object-contain"
                  src="https://domternal.dev/favicon.svg"
                  alt="Domternal"
                />
                <img
                  v-else-if="value === 'md'"
                  class="size-5 object-contain"
                  src="https://raw.githubusercontent.com/dcurtis/markdown-mark/master/svg/markdown-mark.svg"
                  alt="Markdown"
                />
              </template>
              <ElOption label="TipTap 编辑器" value="tiptap">
                <span class="flex items-center gap-2">
                  <img
                    class="size-5 object-contain"
                    src="https://cdn.prod.website-files.com/645a9acecda2e0594fac6126/657b062a9b2afac48c705261_favicon-32x32.png"
                    alt=""
                  />
                  TipTap 编辑器
                </span>
              </ElOption>
              <ElOption label="Domternal 编辑器" value="domternal">
                <span class="flex items-center gap-2">
                  <img class="size-5 object-contain" src="https://domternal.dev/favicon.svg" alt="" />
                  Domternal 编辑器
                </span>
              </ElOption>
              <ElOption label="Markdown 编辑器" value="md">
                <span class="flex items-center gap-2">
                  <img
                    class="size-5 object-contain"
                    src="https://raw.githubusercontent.com/dcurtis/markdown-mark/master/svg/markdown-mark.svg"
                    alt=""
                  />
                  Markdown 编辑器
                </span>
              </ElOption>
            </ElSelect>
            <ElButton :loading="saving" @click="saveDraft">
              <ArtSvgIcon icon="ri:save-3-line" />保存
            </ElButton>
            <ElButton
              type="primary"
             
              :loading="saving"
              @click="publish"
            >
              <ArtSvgIcon icon="ri:send-plane-2-line" />{{
                form.status === 'published' ? '更新发布' : '发布'
              }}
            </ElButton>
          </div>
        </div>
      </header>
      <main class="editor-workspace min-h-0 flex-1 overflow-hidden">
        <div class="editor-grid grid h-full min-h-0 grid-cols-[minmax(0,1fr)_336px] overflow-hidden bg-box">
          <section class="writing min-w-0 overflow-hidden">
            <div class="document-column flex h-full min-h-0 flex-col">
              <BlogTipTapEditor
                v-if="form.editorType === 'tiptap'"
                v-model="form.rawContent"
                v-model:code-theme="form.codeTheme"
                v-model:text="contentText"
              />
              <BlogDomternalEditor
                v-else-if="form.editorType === 'domternal'"
                v-model="form.rawContent"
                v-model:code-theme="form.codeTheme"
                v-model:text="contentText"
              />
              <BlogMarkdownEditor
                v-else
                v-model="form.rawContent"
                v-model:code-theme="form.codeTheme"
              />
            </div>
          </section>
          <aside class="settings min-w-0 overflow-y-auto border-l border-[var(--default-border)] px-4.5 pt-4.5 pb-5.5">
            <section class="article-inspector border-b border-[var(--default-border)] pb-4">
              <header class="inspector-head flex items-center justify-between text-sm font-semibold text-g-900">
                <span class="inline-flex items-center gap-1.5 [&_.art-svg-icon]:text-theme"><ArtSvgIcon icon="ri:article-line" />发布设置</span>
                <ElTag
                  v-if="form.status"
                  effect="plain"
                  :type="form.status === 'published' ? 'primary' : 'info'"
                >
                  {{ form.status === 'published' ? '已发布' : '草稿' }}
                </ElTag>
              </header>
              <ElForm class="inspector-body pt-3" label-position="left" label-width="82px">
                <ElFormItem label="分类">
                  <ElSelect v-model="form.categoryId" clearable placeholder="选择分类" class="w-full">
                    <ElOption
                      v-for="category in categories"
                      :key="category.id"
                      :label="category.name"
                      :value="category.id"
                    />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="标签">
                  <ElSelect
                    v-model="form.tagIds"
                    multiple
                    filterable
                    placeholder="选择标签"
                    class="w-full"
                  >
                    <ElOption v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="代码主题">
                  <ElSelect v-model="form.codeTheme" class="w-full" placeholder="选择代码主题">
                    <ElOption label="GitHub（自动明暗）" value="github" />
                    <ElOption label="Atom One（自动明暗）" value="atom" />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="摘要">
                  <ElInput
                    v-model="form.summary"
                    type="textarea"
                    :rows="3"
                    maxlength="500"
                    show-word-limit
                  />
                </ElFormItem>
                <ElFormItem label="URL Slug" class="[&_input]:font-mono">
                  <ElInput v-model="form.slug" placeholder="文章 URL 标识" />
                </ElFormItem>
              </ElForm>
            </section>
            <section class="cover-card pt-4">
              <div class="cover-card__heading mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-g-900 [&_.art-svg-icon]:text-theme"><ArtSvgIcon icon="ri:image-line" />封面</div>
              <div class="cover-card__media relative aspect-[16/8] overflow-hidden rounded-[5px]">
                <img v-if="form.cover" :src="form.cover" class="block h-full w-full object-cover" alt="文章封面" />
                <ElTooltip v-if="form.cover" content="移除封面">
                  <ElButton
                    class="cover-card__remove absolute top-2 right-2"
                    circle
                    type="danger"
                    aria-label="移除封面"
                    @click="form.cover = ''"
                  >
                    <ArtSvgIcon icon="ri:close-line" />
                  </ElButton>
                </ElTooltip>
                <ElUpload
                  v-else
                  class="cover-upload"
                  drag
                  :show-file-list="false"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                  :http-request="uploadCover"
                >
                  <ArtSvgIcon icon="ri:image-add-line" />
                  <strong>添加封面</strong>
                  <small>PNG、JPG、WebP、GIF 或 SVG</small>
                </ElUpload>
              </div>
              <div class="cover-card__actions mt-2.5">
                <ElButton class="w-full [&_.art-svg-icon]:mr-1" @click="coverPickerVisible = true">
                  <ArtSvgIcon icon="ri:image-line" />{{ form.cover ? '更换封面' : '从媒体库选择' }}
                </ElButton>
              </div>
              <MediaLibraryPicker
                v-model:visible="coverPickerVisible"
                @select="form.cover = $event"
              />
            </section>
          </aside>
        </div>
      </main>
      <footer class="editor-footer flex min-h-7.5 items-center justify-between border-t border-[var(--default-border)] bg-[var(--default-bg-color)] px-3.5 text-xs tabular-nums text-g-600 max-[640px]:px-3">
        <span>{{ words }} 字，{{ readMinutes }} 分钟阅读</span>
        <span class="save-state inline-flex items-center gap-1.5" :class="`is-${autoSave.state.value}`"><i />{{ saveHint }}</span>
      </footer>
    </div>
  </ElDrawer>
</template>

<style scoped>
  .article-drawer :global(.el-drawer__body) {
    padding: 0 !important;
    overflow: hidden;
  }

  .masthead-title {
    min-width: 0;
    flex: 1;
  }
  .masthead-title :deep(.el-input__wrapper) {
    padding: 0;
    background: transparent;
    box-shadow: none !important;
  }
  .masthead-title :deep(input) {
    height: 62px;
    color: var(--art-gray-900);
    font-size: 22px;
    font-weight: 650;
  }
  .masthead-title :deep(input::placeholder) {
    color: var(--art-gray-600);
  }
  .save-state i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--art-gray-600);
  }
  .save-state.is-saved i {
    background: var(--el-color-success);
  }
  .save-state.is-saving i {
    background: var(--theme-color);
  }
  .save-state.is-error i {
    background: var(--el-color-danger);
  }
  .cover-upload,
  .cover-upload :deep(.el-upload),
  .cover-upload :deep(.el-upload-dragger) {
    width: 100%;
    height: 100%;
  }
  .cover-upload :deep(.el-upload-dragger) {
    display: flex;
    min-height: 0;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    color: var(--art-gray-600);
  }
  .cover-upload :deep(.art-svg-icon) {
    color: var(--theme-color);
    font-size: 20px;
  }
  .cover-upload :deep(strong) {
    color: var(--art-gray-700);
    font-size: 12px;
  }
  .cover-upload :deep(small) {
    font-size: 10px;
  }
  @media (max-width: 900px) {
    .article-drawer :deep(.el-drawer__body) {
      overflow-y: auto;
    }
    .article-editor {
      height: auto;
      min-height: 100%;
    }
    .editor-header__content {
      min-height: 0;
      flex-wrap: wrap;
      padding: 10px 14px;
    }
    .header-main {
      min-width: min(100%, 480px);
    }
    .editor-workspace {
      overflow: visible;
    }
    .editor-grid {
      display: block;
      height: auto;
    }
    .writing {
      min-height: 600px;
      overflow: visible;
    }
    .document-column {
      height: auto;
      min-height: 560px;
    }
    .settings {
      padding: 24px 16px 30px;
      overflow: visible;
      border-top: 1px solid var(--default-border);
      border-left: 0;
    }
  }

  @media (max-width: 640px) {
    .masthead-title :deep(input) {
      font-size: 20px;
    }
    .header-actions {
      width: 100%;
      flex-wrap: wrap;
    }
    .editor-mode-select {
      flex: 1 1 156px;
    }
    .header-actions :deep(.el-button) {
      flex: 1 0 auto;
    }
  }
</style>
