/**
 * 系统日志 Query Hooks
 *
 * @module hooks/queries/useLoggerQuery
 */
import { useQuery } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { computed, unref } from 'vue'
import { fetchGetLogList, fetchGetLogDetail } from '@/api/logger'
import { queryKeys } from '@/utils/query'

// -------- Query Keys --------
const loggerKeys = queryKeys.logger

// -------- 日志查询 --------

/** 获取日志列表 */
export function useLogListQuery(
  params?: MaybeRef<Api.Logger.LogSearchParams>,
  options?: { enabled?: MaybeRef<boolean> }
) {
  return useQuery({
    queryKey: computed(() => loggerKeys.list(unref(params))),
    queryFn: () => fetchGetLogList(unref(params)!),
    enabled: () => unref(options?.enabled) ?? true
  })
}

/** 获取日志详情 */
export function useLogDetailQuery(
  id: MaybeRef<number | undefined>,
  options?: { enabled?: MaybeRef<boolean> }
) {
  return useQuery({
    queryKey: computed(() => loggerKeys.detail(unref(id)!)),
    queryFn: () => fetchGetLogDetail({ id: unref(id)! }),
    enabled: () => !!unref(id) && (unref(options?.enabled) ?? true)
  })
}

export { loggerKeys }
