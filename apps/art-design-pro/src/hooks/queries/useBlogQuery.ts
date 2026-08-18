import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { computed, unref } from 'vue'
import { blogApi } from '@/api/blog'
import { queryKeys } from '@/utils/query'

export const blogKeys = queryKeys.blog

export function useBlogArticleListQuery(params: MaybeRef<Api.Blog.ArticleQuery>) {
  return useQuery({
    queryKey: computed(() => blogKeys.articles(unref(params))),
    queryFn: () => blogApi.listArticles(unref(params))
  })
}

export function useBlogArticleQuery(id: MaybeRef<number>) {
  return useQuery({
    queryKey: computed(() => blogKeys.article(unref(id))),
    queryFn: () => blogApi.getArticle(unref(id)),
    enabled: () => Boolean(unref(id))
  })
}

export function useBlogCategoriesQuery() {
  return useQuery({ queryKey: blogKeys.categories(), queryFn: blogApi.listCategories })
}

export function useBlogTagsQuery() {
  return useQuery({ queryKey: blogKeys.tags(), queryFn: blogApi.listAllTags })
}

export function useBlogCommentsQuery(params: MaybeRef<Api.Blog.CommentQuery>) {
  return useQuery({
    queryKey: computed(() => blogKeys.comments(unref(params))),
    queryFn: () => blogApi.listComments(unref(params))
  })
}

export function useBlogAttachmentsQuery(params: MaybeRef<Api.Blog.PageQuery>) {
  return useQuery({
    queryKey: computed(() => blogKeys.attachments(unref(params))),
    queryFn: () => blogApi.listAttachments(unref(params))
  })
}

function useBlogMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  invalidate: ReadonlyArray<readonly unknown[]> = [blogKeys.all]
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
    }
  })
}

export function useCreateBlogArticleMutation() {
  return useBlogMutation(blogApi.createArticle)
}

export function useUpdateBlogArticleMutation() {
  return useBlogMutation(({ id, payload }: { id: number; payload: Api.Blog.SaveArticle }) =>
    blogApi.updateArticle(id, payload)
  )
}

export function usePublishBlogArticleMutation() {
  return useBlogMutation(({ id, published }: { id: number; published: boolean }) =>
    published ? blogApi.publishArticle(id) : blogApi.unpublishArticle(id)
  )
}

export function useDeleteBlogArticleMutation() {
  return useBlogMutation(blogApi.deleteArticle)
}

export function useCreateBlogCategoryMutation() {
  return useBlogMutation(blogApi.createCategory, [blogKeys.categories(), blogKeys.all])
}

export function useUpdateBlogCategoryMutation() {
  return useBlogMutation(
    ({ id, payload }: { id: number; payload: Api.Blog.SaveCategory }) =>
      blogApi.updateCategory(id, payload),
    [blogKeys.categories(), blogKeys.all]
  )
}

export function useDeleteBlogCategoryMutation() {
  return useBlogMutation(blogApi.deleteCategory, [blogKeys.categories(), blogKeys.all])
}

export function useCreateBlogTagMutation() {
  return useBlogMutation(blogApi.createTag, [blogKeys.tags(), blogKeys.all])
}

export function useUpdateBlogTagMutation() {
  return useBlogMutation(
    ({ id, payload }: { id: number; payload: Api.Blog.SaveTag }) => blogApi.updateTag(id, payload),
    [blogKeys.tags(), blogKeys.all]
  )
}

export function useDeleteBlogTagMutation() {
  return useBlogMutation(blogApi.deleteTag, [blogKeys.tags(), blogKeys.all])
}

export function useChangeBlogCommentStatusMutation() {
  return useBlogMutation(({ id, approved }: { id: number; approved: boolean }) =>
    approved ? blogApi.approveComment(id) : blogApi.rejectComment(id)
  )
}

export function useDeleteBlogCommentMutation() {
  return useBlogMutation(blogApi.deleteComment)
}

export function useDeleteBlogAttachmentMutation() {
  return useBlogMutation(blogApi.deleteAttachment)
}
