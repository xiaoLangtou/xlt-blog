import request from '@/utils/http'

/** 文件上传超时时间（毫秒）：大文件上传耗时较长，需比常规请求的全局超时更长 */
const UPLOAD_TIMEOUT = 5 * 60 * 1000

export const blogApi = {
  listArticles(params: Api.Blog.ArticleQuery) {
    return request.get<Api.Blog.Paginated<Api.Blog.Article>>({
      url: '/admin/articles',
      params
    })
  },
  getArticle(id: number) {
    return request.get<Api.Blog.ArticleDetail>({ url: `/admin/articles/${id}` })
  },
  createArticle(params: Api.Blog.SaveArticle) {
    return request.post<Api.Blog.ArticleDetail>({ url: '/admin/articles', params })
  },
  updateArticle(id: number, params: Api.Blog.SaveArticle) {
    return request.put<Api.Blog.ArticleDetail>({ url: `/admin/articles/${id}`, params })
  },
  publishArticle(id: number) {
    return request.put<Api.Blog.ArticleDetail>({ url: `/admin/articles/${id}/publish` })
  },
  unpublishArticle(id: number) {
    return request.put<Api.Blog.ArticleDetail>({ url: `/admin/articles/${id}/unpublish` })
  },
  deleteArticle(id: number) {
    return request.del<void>({ url: `/admin/articles/${id}` })
  },
  importArticles(
    files: File[],
    defaults: Api.Blog.ImportArticleDefaults,
    onProgress?: (percent: number) => void
  ) {
    const data = new FormData()
    files.forEach((file) => data.append('files', file))
    if (defaults.defaultCategoryId != null) {
      data.append('defaultCategoryId', String(defaults.defaultCategoryId))
    }
    defaults.defaultTagIds?.forEach((id) => data.append('defaultTagIds', String(id)))
    if (defaults.defaultStatus) data.append('defaultStatus', defaults.defaultStatus)

    return request.post<Api.Blog.ImportArticlesResult>({
      url: '/admin/articles/import',
      data,
      timeout: UPLOAD_TIMEOUT,
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      }
    })
  },
  listCategories() {
    return request.get<Api.Blog.Category[]>({ url: '/admin/categories' })
  },
  createCategory(params: Api.Blog.SaveCategory) {
    return request.post<Api.Blog.Category>({ url: '/admin/categories', params })
  },
  updateCategory(id: number, params: Api.Blog.SaveCategory) {
    return request.put<Api.Blog.Category>({ url: `/admin/categories/${id}`, params })
  },
  deleteCategory(id: number) {
    return request.del<void>({ url: `/admin/categories/${id}` })
  },
  listTags(params: Api.Blog.TagQuery) {
    return request.get<Api.Blog.Paginated<Api.Blog.Tag>>({ url: '/admin/tags', params })
  },
  listAllTags() {
    return request.get<Api.Blog.Tag[]>({ url: '/admin/tags/all' })
  },
  createTag(params: Api.Blog.SaveTag) {
    return request.post<Api.Blog.Tag>({ url: '/admin/tags', params })
  },
  updateTag(id: number, params: Api.Blog.SaveTag) {
    return request.put<Api.Blog.Tag>({ url: `/admin/tags/${id}`, params })
  },
  deleteTag(id: number) {
    return request.del<void>({ url: `/admin/tags/${id}` })
  },
  listColumns(params: Api.Blog.ColumnQuery) {
    return request.get<Api.Blog.Paginated<Api.Blog.Column>>({ url: '/admin/columns', params })
  },
  listAllColumns() {
    return request.get<Api.Blog.Column[]>({ url: '/admin/columns/all' })
  },
  getColumn(id: number) {
    return request.get<Api.Blog.ColumnDetail>({ url: `/admin/columns/${id}` })
  },
  createColumn(params: Api.Blog.SaveColumn) {
    return request.post<Api.Blog.Column>({ url: '/admin/columns', params })
  },
  updateColumn(id: number, params: Api.Blog.SaveColumn) {
    return request.put<Api.Blog.Column>({ url: `/admin/columns/${id}`, params })
  },
  deleteColumn(id: number) {
    return request.del<void>({ url: `/admin/columns/${id}` })
  },
  setColumnArticles(id: number, articleIds: number[]) {
    return request.put<Api.Blog.ColumnDetail>({
      url: `/admin/columns/${id}/articles`,
      params: { articleIds }
    })
  },
  listComments(params: Api.Blog.CommentQuery) {
    return request.get<Api.Blog.Paginated<Api.Blog.Comment>>({
      url: '/admin/comments',
      params
    })
  },
  approveComment(id: number) {
    return request.put<Api.Blog.Comment>({ url: `/admin/comments/${id}/approve` })
  },
  rejectComment(id: number) {
    return request.put<Api.Blog.Comment>({ url: `/admin/comments/${id}/reject` })
  },
  replyComment(id: number, content: string) {
    return request.post<Api.Blog.Comment>({
      url: `/admin/comments/${id}/reply`,
      params: { content }
    })
  },
  deleteComment(id: number) {
    return request.del<void>({ url: `/admin/comments/${id}` })
  },
  listAttachments(params: Api.Blog.AttachmentQuery) {
    return request.get<Api.Blog.Paginated<Api.Blog.Attachment>>({
      url: '/admin/attachments',
      params
    })
  },
  getAttachmentStats() {
    return request.get<Api.Blog.AttachmentStats>({ url: '/admin/attachments/stats' })
  },
  getStorageConfig() {
    return request.get<Api.Blog.StorageConfig>({ url: '/admin/storage/config' })
  },
  updateStorageConfig(defaultTargetId: string) {
    return request.put<Api.Blog.StorageConfig>({
      url: '/admin/storage/config',
      params: { defaultTargetId }
    })
  },
  createStorageRemote(params: Api.Blog.StorageRemoteConfigInput) {
    return request.post<Api.Blog.StorageRemoteConfig>({ url: '/admin/storage/remotes', params })
  },
  updateStorageRemote(id: string, params: Api.Blog.StorageRemoteUpdateInput) {
    return request.put<Api.Blog.StorageRemoteConfig>({ url: `/admin/storage/remotes/${id}`, params })
  },
  deleteStorageRemote(id: string) {
    return request.del<void>({ url: `/admin/storage/remotes/${id}` })
  },
  testStorageConfig(params: Api.Blog.StorageRemoteConfigInput, id?: string) {
    return request.post<Api.Blog.StorageTestResult>({
      url: id ? `/admin/storage/remotes/${id}/test` : '/admin/storage/remotes/test',
      params
    })
  },
  deleteAttachment(id: number) {
    return request.del<void>({ url: `/admin/attachments/${id}` })
  },
  listPages() {
    return request.get<Api.Blog.Page[]>({ url: '/admin/pages' })
  },
  createPage(params: Api.Blog.SavePage) {
    return request.post<Api.Blog.Page>({ url: '/admin/pages', params })
  },
  updatePage(id: number, params: Api.Blog.SavePage) {
    return request.put<Api.Blog.Page>({ url: `/admin/pages/${id}`, params })
  },
  deletePage(id: number) {
    return request.del<void>({ url: `/admin/pages/${id}` })
  },
  listLinks() {
    return request.get<Api.Blog.FriendLink[]>({ url: '/admin/links' })
  },
  createLink(params: Api.Blog.SaveFriendLink) {
    return request.post<Api.Blog.FriendLink>({ url: '/admin/links', params })
  },
  updateLink(id: number, params: Api.Blog.SaveFriendLink) {
    return request.put<Api.Blog.FriendLink>({ url: `/admin/links/${id}`, params })
  },
  deleteLink(id: number) {
    return request.del<void>({ url: `/admin/links/${id}` })
  },
  getSettings() {
    return request.get<Api.Blog.SiteSettings>({ url: '/admin/settings' })
  },
  updateSettings(params: Api.Blog.SiteSettings) {
    return request.put<Api.Blog.SiteSettings>({ url: '/admin/settings', params })
  },
  getResume() {
    return request.get<Api.Blog.Resume>({ url: '/admin/resume' })
  },
  updateResume(params: Api.Blog.Resume) {
    return request.put<Api.Blog.Resume>({ url: '/admin/resume', params })
  },
  upload(file: File, onProgress?: (percent: number) => void, storageId?: string) {
    const data = new FormData()
    data.append('file', file)
    if (storageId) data.append('storageId', storageId)
    return request.post<Api.Blog.UploadResult>({
      url: '/admin/upload',
      data,
      timeout: UPLOAD_TIMEOUT,
      showErrorMessage: true,
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      }
    })
  },

  /** 内容预览：与保存共用服务端渲染管线（转换 + 净化 + Shiki） */
  previewContent(params: Api.Blog.PreviewContentParams) {
    return request.post<Api.Blog.PreviewContentResult>({
      url: '/admin/content/preview',
      params
    })
  }
}
