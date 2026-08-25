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
    // 后台菜单可能由站点设置或迁移新增，重新挂载时校验远端数据，避免长期使用旧路由树。
    staleTime: 0,
    refetchOnMount: 'always',
    gcTime: 5 * 60 * 1000
  })

  return query
}
