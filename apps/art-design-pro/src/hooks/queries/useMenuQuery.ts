/**
 * 应用菜单 Query Hook
 *
 * 负责菜单数据的请求、缓存，并同步至 menuStore 供路由与其他组件使用。
 *
 * @module hooks/queries/useMenuQuery
 */
import { useQuery } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { computed, unref } from 'vue'
import { useAppMode } from '@/hooks/core/useAppMode'
import { useUserStore } from '@/store/modules/user'
import { createMenuQueryKey, fetchAppMenuList } from '@/utils/menu'

export interface UseMenuQueryOptions {
  /** 是否启用请求 */
  enabled?: MaybeRef<boolean>
}

/** 获取应用侧边栏菜单 */
export function useMenuQuery(options?: UseMenuQueryOptions) {
  const userStore = useUserStore()
  const { currentMode } = useAppMode()

  const queryKey = computed(() =>
    createMenuQueryKey({
      userId: userStore.info?.userId,
      mode: currentMode.value
    })
  )

  const query = useQuery({
    queryKey,
    queryFn: fetchAppMenuList,
    enabled: () => userStore.isLogin && (unref(options?.enabled) ?? true),
    // 动态路由守卫先通过 queryClient.fetchQuery() 拉取并注册该菜单；布局仅订阅同一缓存，
    // 不在挂载时发起第二次请求，也不回写 menuStore。
    staleTime: Infinity,
    refetchOnMount: false,
    gcTime: 5 * 60 * 1000
  })

  return query
}
