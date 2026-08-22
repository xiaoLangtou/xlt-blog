import type { ApiResponse } from '@xlt-blog/shared'
import type { UseFetchOptions } from 'nuxt/app'

/**
 * 封装 useFetch：走 runtimeConfig.public.apiBase，
 * 自动剥离后端统一响应 { code, data, message } 中的 data
 */
export function useApi<T>(
  path: string | (() => string),
  options: UseFetchOptions<ApiResponse<T>, T> = {}
) {
  const config = useRuntimeConfig()
  return useFetch(path, {
    baseURL: import.meta.server ? config.apiBase : config.public.apiBase,
    ...options,
    transform: (res: ApiResponse<T>) => res.data
  } as any) as ReturnType<typeof useFetch<T>>
}

/** 客户端命令式请求（评论提交等），同样剥离 data */
export async function apiFetch<T>(path: string, options: Record<string, any> = {}): Promise<T> {
  const config = useRuntimeConfig()
  const res = await $fetch<ApiResponse<T>>(path, {
    baseURL: config.public.apiBase,
    ...options
  })
  return res.data
}
