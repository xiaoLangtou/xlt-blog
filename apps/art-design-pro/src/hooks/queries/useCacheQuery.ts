/**
 * 缓存监控 Query Hook
 *
 * @module hooks/queries/useCacheQuery
 */
import { useQuery } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { unref } from 'vue'
import { fetchGetRedisCacheInfo } from '@/api/cache'
import { queryKeys } from '@/utils/query'

// -------- Query Keys --------
const cacheKeys = queryKeys.cache

/** 获取 Redis 缓存信息 */
export function useCacheInfoQuery(options?: { enabled?: MaybeRef<boolean> }) {
  return useQuery({
    queryKey: cacheKeys.info(),
    queryFn: fetchGetRedisCacheInfo,
    enabled: () => unref(options?.enabled) ?? true,
    refetchInterval: 10 * 1000
  })
}

export { cacheKeys }
