/**
 * 应用菜单 Query Hook
 *
 * 负责菜单数据的请求、缓存，并同步至 menuStore 供路由与其他组件使用。
 *
 * @module hooks/queries/useMenuQuery
 */
import { useQuery } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { computed, unref, watch } from 'vue'
import { useAppMode } from '@/hooks/core/useAppMode'
import { useMenuStore } from '@/store/modules/menu'
import { useUserStore } from '@/store/modules/user'
import { createMenuQueryKey, fetchAppMenuList } from '@/utils/menu'

export interface UseMenuQueryOptions {
  /** 是否启用请求 */
  enabled?: MaybeRef<boolean>
}

/** 获取应用侧边栏菜单 */
export function useMenuQuery(options?: UseMenuQueryOptions) {
  const userStore = useUserStore()
  const menuStore = useMenuStore()
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
    staleTime: 0,
    gcTime: 5 * 60 * 1000
  })

  watch(
    () => query.data.value,
    (menuList) => {
      if (menuList?.length) {
        menuStore.setMenuList(menuList)
      }
    },
    { immediate: true }
  )

  return query
}
