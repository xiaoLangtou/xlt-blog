/**
 * API 管理 Query / Mutation Hooks
 *
 * @module hooks/queries/useApiQuery
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { computed, unref } from 'vue'
import {
  fetchGetApiList,
  fetchGetAllApis,
  fetchGetApiDetail,
  fetchGetApiGroups,
  fetchSyncApis,
  fetchAddApi,
  fetchEditApi,
  fetchRemoveApi,
  fetchIgnoreApi,
  fetchBatchCreateApis
} from '@/api/api-manage'
import { queryKeys } from '@/utils/query'

// -------- Query Keys --------
const apiKeys = queryKeys.apiManage

// -------- API 查询 --------

/** 获取接口列表（分页） */
export function useApiListQuery(
  params?: MaybeRef<Api.Common.CommonSearchParams & Record<string, unknown>>,
  options?: { enabled?: MaybeRef<boolean> }
) {
  return useQuery({
    queryKey: computed(() => apiKeys.list(unref(params) as Record<string, unknown>)),
    queryFn: () => fetchGetApiList(unref(params)),
    enabled: () => unref(options?.enabled) ?? true
  })
}

/** 获取所有接口 */
export function useAllApisQuery(options?: { enabled?: MaybeRef<boolean> }) {
  return useQuery({
    queryKey: [...apiKeys.all, 'all'] as const,
    queryFn: fetchGetAllApis,
    enabled: () => unref(options?.enabled) ?? true
  })
}

/** 获取接口详情 */
export function useApiDetailQuery(
  id: MaybeRef<number | string>,
  options?: { enabled?: MaybeRef<boolean> }
) {
  return useQuery({
    queryKey: computed(() => apiKeys.detail(unref(id))),
    queryFn: () => fetchGetApiDetail(unref(id)),
    enabled: () => !!unref(id) && (unref(options?.enabled) ?? true)
  })
}

/** 获取接口分组 */
export function useApiGroupsQuery(options?: { enabled?: MaybeRef<boolean> }) {
  return useQuery({
    queryKey: apiKeys.groups(),
    queryFn: fetchGetApiGroups,
    enabled: () => unref(options?.enabled) ?? true,
    staleTime: 30 * 1000
  })
}

/** 同步接口 */
export function useSyncApisQuery(options?: { enabled?: MaybeRef<boolean> }) {
  return useQuery({
    queryKey: [...apiKeys.all, 'sync'] as const,
    queryFn: fetchSyncApis,
    enabled: () => unref(options?.enabled) ?? false,
    staleTime: 0
  })
}

// -------- API 变更 --------

/** 新增接口 */
export function useAddApiMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchAddApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeys.all })
    }
  })
}

/** 编辑接口 */
export function useEditApiMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: Api.ApiManage.ApiFormParams & { id: number }) => fetchEditApi(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeys.all })
    }
  })
}

/** 删除接口 */
export function useRemoveApiMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchRemoveApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeys.all })
    }
  })
}

/** 忽略接口 */
export function useIgnoreApiMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchIgnoreApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeys.all })
    }
  })
}

/** 批量创建接口 */
export function useBatchCreateApisMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchBatchCreateApis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeys.all })
    }
  })
}

export { apiKeys }
