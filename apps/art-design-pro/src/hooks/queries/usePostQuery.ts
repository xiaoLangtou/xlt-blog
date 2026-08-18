/**
 * 岗位管理 Query / Mutation Hooks
 *
 * @module hooks/queries/usePostQuery
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { computed, unref } from 'vue'
import {
  fetchGetPostList,
  fetchGetPostDetail,
  fetchAddPost,
  fetchEditPost,
  fetchRemovePost,
  fetchChangePostStatus
} from '@/api/post'
import { queryKeys } from '@/utils/query'

// -------- Query Keys --------
const postKeys = queryKeys.post

// -------- 岗位查询 --------

/** 获取岗位列表 */
export function usePostListQuery(
  params?: MaybeRef<Api.Post.PostSearchParams>,
  options?: { enabled?: MaybeRef<boolean> }
) {
  return useQuery({
    queryKey: computed(() => postKeys.list(unref(params))),
    queryFn: () => fetchGetPostList(unref(params)!),
    enabled: () => unref(options?.enabled) ?? true
  })
}

/** 获取岗位详情 */
export function usePostDetailQuery(
  id: MaybeRef<number | string>,
  options?: { enabled?: MaybeRef<boolean> }
) {
  return useQuery({
    queryKey: computed(() => postKeys.detail(unref(id))),
    queryFn: () => fetchGetPostDetail(unref(id)),
    enabled: () => !!unref(id) && (unref(options?.enabled) ?? true)
  })
}

// -------- 岗位变更 --------

/** 新增岗位 */
export function useAddPostMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchAddPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all })
    }
  })
}

/** 编辑岗位 */
export function useEditPostMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: Api.Post.PostFormParams & { id: number | string }) =>
      fetchEditPost(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all })
    }
  })
}

/** 删除岗位 */
export function useRemovePostMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchRemovePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all })
    }
  })
}

/** 修改岗位状态 */
export function useChangePostStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchChangePostStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all })
    }
  })
}

export { postKeys }
