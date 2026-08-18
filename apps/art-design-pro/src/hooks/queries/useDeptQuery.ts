/**
 * 部门管理 Query / Mutation Hooks
 *
 * @module hooks/queries/useDeptQuery
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { computed, unref } from 'vue'
import {
  fetchGetDeptList,
  fetchGetDeptTree,
  fetchGetDeptDetail,
  fetchAddDept,
  fetchEditDept,
  fetchRemoveDept,
  fetchChangeDeptStatus,
  fetchGenerateDeptConstants
} from '@/api/dept'
import { queryKeys } from '@/utils/query'

// -------- Query Keys --------
const deptKeys = queryKeys.dept

// -------- 部门查询 --------

/** 获取部门列表 */
export function useDeptListQuery(
  params?: MaybeRef<Api.Dept.DeptSearchParams>,
  options?: { enabled?: MaybeRef<boolean> }
) {
  return useQuery({
    queryKey: computed(() => deptKeys.list(unref(params))),
    queryFn: () => fetchGetDeptList(unref(params)!),
    enabled: () => unref(options?.enabled) ?? true
  })
}

/** 获取部门树 */
export function useDeptTreeQuery(options?: { enabled?: MaybeRef<boolean> }) {
  return useQuery({
    queryKey: deptKeys.tree(),
    queryFn: fetchGetDeptTree,
    enabled: () => unref(options?.enabled) ?? true,
    staleTime: 30 * 1000
  })
}

/** 获取部门详情 */
export function useDeptDetailQuery(
  id: MaybeRef<number | string>,
  options?: { enabled?: MaybeRef<boolean> }
) {
  return useQuery({
    queryKey: computed(() => deptKeys.detail(unref(id))),
    queryFn: () => fetchGetDeptDetail(unref(id)),
    enabled: () => !!unref(id) && (unref(options?.enabled) ?? true)
  })
}

/** 生成部门常量 */
export function useGenerateDeptConstantsQuery(options?: { enabled?: MaybeRef<boolean> }) {
  return useQuery({
    queryKey: [...deptKeys.all, 'constants'] as const,
    queryFn: fetchGenerateDeptConstants,
    enabled: () => unref(options?.enabled) ?? false,
    staleTime: 0
  })
}

// -------- 部门变更 --------

/** 新增部门 */
export function useAddDeptMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchAddDept,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deptKeys.all })
    }
  })
}

/** 编辑部门 */
export function useEditDeptMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: Api.Dept.DeptFormParams & { id: number }) => fetchEditDept(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deptKeys.all })
    }
  })
}

/** 删除部门 */
export function useRemoveDeptMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchRemoveDept,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deptKeys.all })
    }
  })
}

/** 修改部门状态 */
export function useChangeDeptStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchChangeDeptStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deptKeys.all })
    }
  })
}

export { deptKeys }
