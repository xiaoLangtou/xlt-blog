/**
 * 字典管理 Query / Mutation Hooks
 *
 * @module hooks/queries/useDictQuery
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { computed, unref } from 'vue'
import {
  fetchGetDictTypeList,
  fetchAddDictType,
  fetchUpdateDictType,
  fetchRemoveDictType,
  fetchGetDictDataList,
  fetchAddDictData,
  fetchUpdateDictData,
  fetchRemoveDictData
} from '@/api/dict'
import { queryKeys } from '@/utils/query'

// -------- Query Keys --------

const dictKeys = {
  all: [...queryKeys.system.all, 'dict'] as const,
  types: (params?: Api.Dict.DictTypeSearchParams) =>
    [...dictKeys.all, 'types', params] as const,
  dataList: (params: Api.Dict.DictDataSearchParams) =>
    [...dictKeys.all, 'data', params] as const
}

export { dictKeys }

// -------- 字典类型 --------

/** 获取字典类型列表 */
export function useDictTypeListQuery(
  params?: MaybeRef<Api.Dict.DictTypeSearchParams>,
  options?: { enabled?: MaybeRef<boolean> }
) {
  return useQuery({
    queryKey: computed(() => dictKeys.types(unref(params))),
    queryFn: () => fetchGetDictTypeList(unref(params)),
    enabled: () => unref(options?.enabled) ?? true
  })
}

/** 新增字典类型 */
export function useAddDictTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchAddDictType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dictKeys.all })
  })
}

/** 更新字典类型 */
export function useUpdateDictTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: Api.Dict.DictTypeFormParams & { id: number }) =>
      fetchUpdateDictType(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dictKeys.all })
  })
}

/** 删除字典类型 */
export function useRemoveDictTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => fetchRemoveDictType(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dictKeys.all })
  })
}

// -------- 字典数据 --------

/** 获取字典数据列表 */
export function useDictDataListQuery(
  params: MaybeRef<Api.Dict.DictDataSearchParams>,
  options?: { enabled?: MaybeRef<boolean> }
) {
  return useQuery({
    queryKey: computed(() => dictKeys.dataList(unref(params))),
    queryFn: () => fetchGetDictDataList(unref(params)),
    enabled: () => unref(options?.enabled) ?? true
  })
}

/** 新增字典数据 */
export function useAddDictDataMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchAddDictData,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dictKeys.all })
  })
}

/** 更新字典数据 */
export function useUpdateDictDataMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: Api.Dict.DictDataFormParams & { id: number }) =>
      fetchUpdateDictData(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dictKeys.all })
  })
}

/** 删除字典数据 */
export function useRemoveDictDataMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => fetchRemoveDictData(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dictKeys.all })
  })
}
