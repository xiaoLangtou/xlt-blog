<script setup lang="ts">
  import { extractTableFragments, restoreTableFragments } from '@xlt-blog/shared'
  import DOMPurify from 'dompurify'
  import MarkdownIt from 'markdown-it'
  import hljs from 'highlight.js'
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
  const previewVisible = ref(false)
  const drawerOpen = ref(true)
  const coverPickerVisible = ref(false)
  const markdown = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: true,
    highlight(code, language) {
      const lang = language && hljs.getLanguage(language) ? language : 'plaintext'
      return `<pre><code class="hljs language-${lang}">${hljs.highlight(code, { language: lang }).value}</code></pre>`
    }
  })
  const defaultImageRenderer =
    markdown.renderer.rules.image ??
    ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options))
  markdown.renderer.rules.image = (tokens, index, options, env, self) => {
    const token = tokens[index]
    const titleIndex = token.attrIndex('title')
    const title = titleIndex >= 0 ? token.attrs?.[titleIndex]?.[1] : null
    const match = title ? /^width=(\d+)$/.exec(String(title).trim()) : null
    const width = match ? Number(match[1]) : null
    if (width && width >= 120 && width <= 1600) token.attrSet('width', String(width))
    if (match) token.attrSet('title', '')
    return defaultImageRenderer(tokens, index, options, env, self)
  }
  const form = reactive<Api.Blog.SaveArticle>({
    title: '',
    slug: '',
    summary: '',
    content: '',
    contentFormat: 'html',
    codeTheme: 'github',
    cover: '',
    status: 'draft',
    categoryId: undefined,
    tagIds: []
  })

  // 切换编辑器不带入对方内容：确认后清空当前正文再切换格式。
  const editorFormat = computed<Api.Blog.ContentFormat>({
    get: () => form.contentFormat ?? 'html',
    set: (next) => {
      void switchFormat(next)
    }
  })
  async function switchFormat(next: Api.Blog.ContentFormat) {
    if (next === form.contentFormat) return
    if (form.content.trim()) {
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
    form.content = ''
    form.contentFormat = next
  }
  const { words, readMinutes } = useBlogArticleStats(() => form.content)
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
    if (!form.title.trim() || !form.content.trim()) throw new Error('请填写标题和正文')
    const data = payload(status)
    if (id.value) await blogApi.updateArticle(id.value, data)
    else {
      const article = await blogApi.createArticle(data)
      await router.replace(`/blog/articles/${article.id}/edit`)
    }
  }

  const autoSave = useBlogAutoSave({
    source: () => ({ ...form }),
    enabled: () => isEditing.value && Boolean(form.title.trim() && form.content.trim()),
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
  const purifyOptions = {
    ADD_TAGS: ['table', 'colgroup', 'col', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td'],
    ADD_ATTR: [
      'width',
      'target',
      'rel',
      'colspan',
      'rowspan',
      'class',
      'checked',
      'disabled',
      'data-blog-table',
      'data-fit',
      'data-width',
      'data-align',
      'data-background',
      'data-colwidth',
      'data-type',
      'data-checked',
      'data-color'
    ]
  }
  const previewHtml = computed(() => {
    if (form.contentFormat === 'markdown') {
      const { markdown: safeMarkdown, fragments } = extractTableFragments(form.content)
      const rendered = restoreTableFragments(markdown.render(safeMarkdown), fragments)
      return DOMPurify.sanitize(rendered, purifyOptions)
    }
    return DOMPurify.sanitize(form.content, purifyOptions)
  })

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
        content: article.content,
        contentFormat: article.contentFormat ?? 'html',
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

    if (!isEditing.value && (form.title || form.content)) {
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
    <div v-loading="loading" class="article-editor">
      <header class="editor-header">
        <div class="editor-header__content">
          <div class="header-main">
            <ElButton text class="back-button" aria-label="返回文章列表" @click="close">
              <ArtSvgIcon icon="ri:arrow-left-line" />返回
            </ElButton>
            <span class="header-divider" aria-hidden="true" />
            <ElInput
              v-model="form.title"
              class="masthead-title"
              placeholder="输入文章标题…"
              maxlength="200"
            />
          </div>
          <div class="header-actions">
            <ElSelect
              v-model="editorFormat"
              class="editor-mode-select"
              popper-class="editor-mode-popper"
              aria-label="编辑方式"
            >
              <ElOption label="TipTap 编辑器" value="html" />
              <ElOption label="Domternal 编辑器" value="domternal" />
              <ElOption label="Markdown 编辑器" value="markdown" />
            </ElSelect>
            <ElTooltip content="预览文章">
              <ElButton
                circle
                aria-label="预览文章"
                :loading="saving"
                @click="previewVisible = true"
              >
                <ArtSvgIcon icon="ri:eye-line" />
              </ElButton>
            </ElTooltip>
            <ElButton class="header-action-button" :loading="saving" @click="saveDraft">
              <ArtSvgIcon icon="ri:save-3-line" />保存
            </ElButton>
            <ElButton
              class="header-action-button header-action-button--publish"
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
      <main class="editor-workspace">
        <div class="editor-grid">
          <section class="writing">
            <div class="document-column">
              <BlogTipTapEditor
                v-if="form.contentFormat === 'html'"
                v-model="form.content"
                v-model:code-theme="form.codeTheme"
              />
              <BlogDomternalEditor
                v-else-if="form.contentFormat === 'domternal'"
                v-model="form.content"
                v-model:code-theme="form.codeTheme"
              />
              <BlogMarkdownEditor
                v-else
                v-model="form.content"
                v-model:code-theme="form.codeTheme"
              />
            </div>
          </section>
          <aside class="settings">
            <section class="article-inspector">
              <header class="inspector-head">
                <span><ArtSvgIcon icon="ri:article-line" />发布设置</span>
                <ElTag
                  size="small"
                  effect="plain"
                  :type="form.status === 'published' ? 'primary' : 'info'"
                >
                  {{ form.status === 'published' ? '已发布' : '草稿' }}
                </ElTag>
              </header>
              <ElForm class="inspector-body" label-position="left" label-width="82px">
                <ElFormItem label="分类">
                  <ElSelect v-model="form.categoryId" clearable placeholder="选择分类" class="full">
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
                    class="full"
                  >
                    <ElOption v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="代码主题">
                  <ElSelect v-model="form.codeTheme" class="full" placeholder="选择代码主题">
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
                <ElFormItem label="URL Slug" class="field-slug">
                  <ElInput v-model="form.slug" placeholder="文章 URL 标识" />
                </ElFormItem>
              </ElForm>
            </section>
            <section class="cover-card">
              <div class="cover-card__heading"><ArtSvgIcon icon="ri:image-line" />封面</div>
              <div class="cover-card__media">
                <img v-if="form.cover" :src="form.cover" class="cover" alt="文章封面" />
                <ElTooltip v-if="form.cover" content="移除封面">
                  <ElButton
                    class="cover-card__remove"
                    circle
                    size="small"
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
              <div class="cover-card__actions">
                <ElButton size="small" @click="coverPickerVisible = true">
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
      <footer class="editor-footer">
        <span>{{ words }} 字，{{ readMinutes }} 分钟阅读</span>
        <span class="save-state" :class="`is-${autoSave.state.value}`"><i />{{ saveHint }}</span>
      </footer>
      <ElDrawer
        v-model="previewVisible"
        direction="rtl"
        size="100%"
        :with-header="false"
        :append-to-body="true"
        class="article-preview-drawer"
      >
        <div class="preview-drawer">
          <header class="preview-drawer__header">
            <ElButton
              text
              class="back-button"
              aria-label="返回编辑"
              @click="previewVisible = false"
            >
              <ArtSvgIcon icon="ri:arrow-left-line" />返回编辑
            </ElButton>
            <span>文章预览</span>
          </header>
          <main class="preview-drawer__body">
            <article class="article-preview">
              <img v-if="form.cover" :src="form.cover" :alt="form.title" />
              <h1>{{ form.title || '未命名文章' }}</h1>
              <p v-if="form.summary" class="summary">{{ form.summary }}</p>
              <div
                v-highlight
                class="markdown-body markdown-preview"
                :class="`code-theme-${form.codeTheme}`"
                v-html="previewHtml"
              />
            </article>
          </main>
        </div>
      </ElDrawer>
    </div>
  </ElDrawer>
</template>

<style scoped>
  .article-drawer {
    overflow: hidden;
    background: var(--default-box-color);
  }

  .article-drawer :global(.el-drawer__body) {
    box-sizing: border-box;
    padding: 0 !important;
    overflow: hidden;
    background: var(--default-box-color);
  }

  .article-editor {
    --article-surface: var(--default-box-color);
    --article-canvas: var(--default-bg-color);
    --article-border: var(--default-border);
    --article-subtle: var(--art-card-border);
    --article-ink: var(--art-gray-900);
    --article-secondary: var(--art-gray-700);
    --article-muted: var(--art-gray-600);
    --article-accent: var(--theme-color);

    display: flex;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    color: var(--article-ink);
    background: var(--article-canvas);
  }

  .editor-header {
    position: relative;
    z-index: 1;
    flex: 0 0 auto;
    background: var(--article-surface);
    border-bottom: 1px solid var(--article-border);
  }
  .editor-header__content {
    display: flex;
    min-height: 64px;
    align-items: center;
    gap: 20px;
    padding: 0 28px;
  }
  .header-main,
  .header-actions,
  .settings-heading,
  .cover-upload :deep(.el-upload-dragger) {
    display: flex;
    align-items: center;
  }
  .header-main {
    min-width: 0;
    flex: 1;
    gap: 10px;
  }
  .back-button {
    flex: 0 0 auto;
    color: var(--article-secondary);
  }
  .back-button :deep(.art-svg-icon) {
    margin-right: 4px;
  }
  .header-divider {
    width: 1px;
    height: 20px;
    flex: 0 0 auto;
    background: var(--article-border);
  }
  .header-actions {
    flex: 0 0 auto;
    gap: 12px;
  }
  .editor-mode-select {
    width: 152px;
  }
  .editor-mode-select :deep(.el-select__wrapper) {
    box-sizing: border-box;
    height: 40px;
    min-height: 40px;
    padding: 0 12px;
    border-radius: 4px;
    font-size: 13px;
    box-shadow: 0 0 0 1px var(--article-border) inset;
  }
  :global(.editor-mode-popper) {
    min-width: 152px !important;
    padding: 4px;
  }
  :global(.editor-mode-popper .el-select-dropdown__item) {
    min-height: 32px;
    padding: 0 10px;
    font-size: 13px;
    line-height: 32px;
  }
  .header-actions :deep(.el-button) {
    box-sizing: border-box;
    height: 40px;
    min-height: 40px;
    padding: 0 16px;
    border-radius: 4px;
    font-size: 13px;
  }
  .header-actions :deep(.el-button + .el-button) {
    margin-left: 0;
  }
  .header-actions :deep(.el-button.is-circle) {
    width: 40px;
    padding: 0;
  }
  .header-actions :deep(.el-button--primary) {
    min-width: 128px;
  }
  .header-action-button {
    min-width: 92px;
  }
  .header-actions :deep(.art-svg-icon) {
    margin-right: 5px;
  }
  .header-actions :deep(.el-button.is-circle .art-svg-icon) {
    margin-right: 0;
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
    color: var(--article-ink);
    font-size: 22px;
    font-weight: 650;
  }
  .masthead-title :deep(input::placeholder) {
    color: var(--article-muted);
    opacity: 0.75;
  }
  .editor-metrics,
  .save-state,
  .editor-footer {
    color: var(--article-muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
  .save-state {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .save-state i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--article-muted);
  }
  .save-state.is-saved i {
    background: var(--el-color-success);
  }
  .save-state.is-saving i {
    background: var(--article-accent);
  }
  .save-state.is-error i {
    background: var(--el-color-danger);
  }
  .editor-workspace {
    min-height: 0;
    flex: 1;
    padding: 0;
    overflow: hidden;
  }
  .editor-grid {
    display: grid;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    grid-template-columns: minmax(0, 1fr) 336px;
    background: var(--article-surface);
  }
  .writing {
    min-width: 0;
    overflow: hidden;
    background: var(--article-surface);
  }
  .document-column {
    display: flex;
    height: 100%;
    min-height: 0;
    flex-direction: column;
  }
  .writing-toolbar {
    display: none;
  }

  .settings {
    min-width: 0;
    padding: 18px 18px 22px;
    overflow-y: auto;
    border-left: 1px solid var(--article-border);
  }
  .article-inspector,
  .cover-card {
    background: transparent;
  }
  .article-inspector {
    padding-bottom: 16px;
    border-bottom: 1px solid var(--article-border);
  }
  .inspector-head {
    display: flex;
    min-height: 24px;
    align-items: center;
    justify-content: space-between;
    padding: 0;
    color: var(--article-ink);
    font-size: 14px;
    font-weight: 650;
  }
  .inspector-head > span,
  .cover-card__heading {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .inspector-head :deep(.art-svg-icon),
  .cover-card__heading :deep(.art-svg-icon) {
    color: var(--article-accent);
  }
  .inspector-body {
    padding: 12px 0 0;
  }
  .settings :deep(.el-form-item) {
    display: flex;
    align-items: center;
    margin-bottom: 9px;
  }
  .settings :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
  .settings :deep(.el-form-item__label) {
    height: 36px;
    padding: 0 12px 0 0;
    color: var(--article-secondary);
    font-size: 14px;
    font-weight: 600;
    line-height: 36px;
    letter-spacing: 0;
  }
  .settings :deep(.el-form-item__content) {
    min-width: 0;
    flex: 1;
    margin-left: 0 !important;
    line-height: 1;
  }
  .settings :deep(.el-form-item:has(.el-textarea)) {
    align-items: flex-start;
  }
  .settings :deep(.el-form-item:has(.el-textarea) .el-form-item__label) {
    line-height: 36px;
  }
  .settings :deep(.el-input__wrapper),
  .settings :deep(.el-select__wrapper),
  .settings :deep(.el-textarea__inner) {
    border-radius: 4px;
    background: var(--article-surface);
    font-size: 14px;
    box-shadow: 0 0 0 1px var(--article-border) inset;
  }
  .settings :deep(.el-input__wrapper),
  .settings :deep(.el-select__wrapper) {
    min-height: 36px;
  }
  .settings :deep(.el-textarea__inner) {
    min-height: 68px !important;
    padding: 7px 9px;
  }
  .field-slug :deep(.el-input__wrapper) {
    background: var(--article-surface);
  }
  .field-slug :deep(input) {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 14px;
  }
  .full {
    width: 100%;
  }
  .cover-card {
    padding-top: 16px;
  }
  .cover-card__heading {
    margin-bottom: 8px;
    color: var(--article-ink);
    font-size: 14px;
    font-weight: 650;
  }
  .cover-card__media {
    position: relative;
    aspect-ratio: 16 / 8;
    overflow: hidden;
    border-radius: 5px;
    background: var(--article-surface);
  }
  .cover {
    display: block;
    width: 100%;
    height: 100%;
    margin: 0;
    object-fit: cover;
  }
  .cover-card__remove {
    position: absolute;
    top: 8px;
    right: 8px;
  }
  .cover-card__actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }
  .cover-card__actions :deep(.el-button) {
    width: 100%;
    height: 32px;
    margin: 0;
    font-size: 13px;
    color: var(--theme-color);
    background: transparent;
    border: 1px dashed color-mix(in srgb, var(--theme-color) 45%, transparent);
    border-radius: 6px;
  }
  .cover-card__actions :deep(.el-button:hover) {
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 7%, transparent);
    border-color: var(--theme-color);
  }
  .cover-card__actions :deep(.art-svg-icon) {
    margin-right: 4px;
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
    color: var(--article-muted);
    border-radius: 6px;
  }
  .cover-upload :deep(.art-svg-icon) {
    color: var(--article-accent);
    font-size: 20px;
  }
  .cover-upload :deep(strong) {
    color: var(--article-secondary);
    font-size: 12px;
  }
  .cover-upload :deep(small) {
    font-size: 10px;
  }

  .editor-footer {
    display: flex;
    min-height: 30px;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    border-top: 1px solid var(--article-border);
    background: var(--default-bg-color);
  }
  .article-preview-drawer :global(.el-drawer__body) {
    padding: 0;
    overflow: hidden;
  }
  .preview-drawer {
    display: flex;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    background: var(--default-box-color);
  }
  .preview-drawer__header {
    display: flex;
    min-height: 58px;
    align-items: center;
    gap: 16px;
    padding: 0 22px;
    border-bottom: 1px solid var(--article-border);
    color: var(--article-secondary);
    font-size: 14px;
    font-weight: 650;
  }
  .preview-drawer__body {
    min-height: 0;
    flex: 1;
    padding: 48px 24px 80px;
    overflow-y: auto;
  }
  .article-preview {
    max-width: 760px;
    margin: auto;
    color: var(--article-ink);
    line-height: 1.8;
  }
  .article-preview img {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 0 0 32px;
    border-radius: 6px;
  }
  .article-preview h1 {
    margin: 0 0 16px;
    font-size: 32px;
    line-height: 1.35;
  }
  .summary {
    margin-bottom: 28px;
    color: var(--article-muted);
    font-size: 16px;
  }
  .article-preview :deep(.markdown-preview) {
    color: var(--article-secondary);
    font-size: 16px;
    line-height: 1.85;
  }
  .article-preview :deep(.markdown-preview > :first-child) {
    margin-top: 0;
  }
  .article-preview :deep(.markdown-preview p),
  .article-preview :deep(.markdown-preview ul),
  .article-preview :deep(.markdown-preview ol) {
    margin: 0 0 1.2em;
  }
  .article-preview :deep(.markdown-preview h1),
  .article-preview :deep(.markdown-preview h2),
  .article-preview :deep(.markdown-preview h3),
  .article-preview :deep(.markdown-preview h4) {
    margin: 1.5em 0 0.6em;
    color: var(--article-ink);
    line-height: 1.35;
  }
  .article-preview :deep(.markdown-preview h2) {
    font-size: 1.5em;
  }
  .article-preview :deep(.markdown-preview h3) {
    font-size: 1.25em;
  }
  .article-preview :deep(.markdown-preview ul),
  .article-preview :deep(.markdown-preview ol) {
    padding-left: 1.5em;
  }
  .article-preview :deep(.markdown-preview li + li) {
    margin-top: 0.3em;
  }
  .article-preview :deep(.markdown-preview a) {
    color: var(--article-accent);
    text-decoration: underline;
  }
  .article-preview :deep(.markdown-preview mark) {
    padding: 0 2px;
    border-radius: 3px;
    background-color: #fff1a8;
    color: #1f2937;
  }
  .article-preview :deep(.markdown-preview u) {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .article-preview :deep(.markdown-preview sub) {
    font-size: 0.8em;
    vertical-align: sub;
  }
  .article-preview :deep(.markdown-preview sup) {
    font-size: 0.8em;
    vertical-align: super;
  }
  .article-preview :deep(.markdown-preview blockquote) {
    margin: 1.4em 0;
    padding-left: 1em;
    color: var(--article-muted);
    border-left: 3px solid var(--article-accent);
  }
  .article-preview :deep(.markdown-preview :not(pre) > code) {
    padding: 2px 5px;
    border-radius: 3px;
    background: var(--article-subtle);
    font-size: 0.9em;
  }
  .article-preview :deep(.markdown-preview pre) {
    position: relative;
    overflow: auto;
    margin: 1.4em 0;
    padding: 16px;
    border-radius: 6px;
    background: var(--code-bg);
    color: var(--code-fg);
  }
  .article-preview :deep(.markdown-preview pre code) {
    display: block;
    min-width: max-content;
    padding: 0;
    background: transparent;
    font-family: var(--art-font-family-code, monospace);
    font-size: 13px;
    line-height: 1.7;
  }
  .article-preview :deep(.markdown-preview img) {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 1.5em auto;
    border-radius: 6px;
  }
  .article-preview :deep(.markdown-preview table) {
    display: block;
    width: 100%;
    margin: 1.4em 0;
    overflow-x: auto;
    border-collapse: collapse;
  }
  .article-preview :deep(.markdown-preview th),
  .article-preview :deep(.markdown-preview td) {
    min-width: 100px;
    padding: 8px 10px;
    border: 1px solid var(--article-border);
  }
  .article-preview :deep(.markdown-preview ul.contains-task-list) {
    padding-left: 0;
    list-style: none;
  }
  .article-preview :deep(.markdown-preview .code-wrapper) {
    overflow-x: auto;
  }
  .article-preview :deep(.markdown-preview .copy-button) {
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
    color: var(--code-muted);
  }
  .article-preview :deep(.markdown-preview .line-number) {
    display: inline-block;
    width: 2.5em;
    margin-right: 0.75em;
    color: var(--code-muted);
    user-select: none;
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
      border-top: 1px solid var(--article-border);
      border-left: 0;
    }
    .preview-drawer__body {
      padding: 32px 20px 64px;
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
    .header-actions :deep(.el-button.is-circle) {
      flex: 0 0 32px;
    }
    .preview-drawer__header {
      padding: 0 14px;
    }
    .preview-drawer__body {
      padding: 28px 16px 56px;
    }
    .article-preview h1 {
      font-size: 26px;
    }
    .editor-metrics {
      display: none;
    }
    .editor-footer {
      padding: 0 12px;
    }
  }
</style>
