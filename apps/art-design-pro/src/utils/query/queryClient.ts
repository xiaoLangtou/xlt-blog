/**
 * TanStack Query 客户端配置
 *
 * @module utils/query/queryClient
 */
import { QueryClient } from '@tanstack/vue-query'
import { HttpError } from '@/utils/http/error'
import { ApiStatus } from '@/utils/http/status'

/** 判断是否为不应重试的错误 */
function isNonRetryableError(error: unknown): boolean {
  if (!(error instanceof HttpError)) return false

  return error.code === ApiStatus.unauthorized || (error.code >= 400 && error.code < 500)
}

/** 创建 QueryClient 实例 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isNonRetryableError(error)) return false
          return failureCount < 2
        }
      },
      mutations: {
        retry: false
      }
    }
  })
}

/** 全局 QueryClient 单例 */
export const queryClient = createQueryClient()

/** 清空所有 Query 缓存（登出时调用） */
export function clearQueryCache() {
  queryClient.clear()
}
