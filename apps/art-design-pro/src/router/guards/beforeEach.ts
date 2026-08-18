/**
 * 路由全局前置守卫模块
 *
 * 处理登录状态、动态路由注册、菜单权限和页面导航。
 * 动态路由初始化由单个可等待任务管理，避免首次进入系统时丢弃并发导航。
 *
 * @module router/guards/beforeEach
 */
import type { Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import type { AppRouteRecord } from '@/types/router'
import { nextTick } from 'vue'
import NProgress from 'nprogress'
import { useSettingStore } from '@/store/modules/setting'
import { useUserStore } from '@/store/modules/user'
import { useMenuStore } from '@/store/modules/menu'
import { setWorktab } from '@/utils/navigation'
import { setPageTitle } from '@/utils/router'
import { RoutesAlias } from '../routesAlias'
import { staticRoutes } from '../routes/staticRoutes'
import { loadingService } from '@/utils/ui'
import { useCommon } from '@/hooks/core/useCommon'
import { useWorktabStore } from '@/store/modules/worktab'
import { fetchGetUserInfo } from '@/api/auth'
import { ApiStatus } from '@/utils/http/status'
import { isHttpError } from '@/utils/http/error'
import { queryClient } from '@/utils/query'
import { createMenuQueryKey, fetchAppMenuList } from '@/utils/menu'
import { RouteRegistry, IframeRouteManager, RoutePermissionValidator } from '../core'
import { setGuardNavigating } from './navigationState'

let routeRegistry: RouteRegistry | null = null
let pendingLoading = false
let routeInitFailed = false
let routeInitPromise: Promise<AppRouteRecord[]> | null = null
let routeInitEpoch = 0

class StaleRouteInitializationError extends Error {
  constructor() {
    super('路由初始化已被新的会话替代')
  }
}

export function getPendingLoading(): boolean {
  return pendingLoading
}

export function resetPendingLoading(): void {
  pendingLoading = false
}

export function getRouteInitFailed(): boolean {
  return routeInitFailed
}

/** 重置初始化状态；登出时会同时递增会话版本以使旧请求失效。 */
export function resetRouteInitState(): void {
  routeInitEpoch++
  routeInitFailed = false
  routeInitPromise = null
}

export function setupBeforeEachGuard(router: Router): void {
  routeRegistry = new RouteRegistry(router)

  router.beforeEach(
    async (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      setGuardNavigating(true)
      try {
        await handleRouteGuard(to, next, router)
      } catch (error) {
        console.error('[RouteGuard] 路由守卫处理失败:', error)
        closeLoading()
        next({ name: 'Exception500' })
      } finally {
        setGuardNavigating(false)
      }
    }
  )
}

function closeLoading(): void {
  if (pendingLoading) {
    nextTick(() => {
      loadingService.hideLoading()
      pendingLoading = false
    })
  }
}

async function handleRouteGuard(
  to: RouteLocationNormalized,
  next: NavigationGuardNext,
  router: Router
): Promise<void> {
  const settingStore = useSettingStore()
  const userStore = useUserStore()

  if (settingStore.showNprogress) {
    NProgress.start()
  }

  if (!handleLoginStatus(to, userStore, next)) {
    return
  }

  if (routeInitFailed) {
    if (to.matched.length > 0) {
      next()
    } else {
      next({ name: 'Exception500', replace: true })
    }
    return
  }

  if (!routeRegistry?.isRegistered() && userStore.isLogin) {
    await handleDynamicRoutes(to, next, router)
    return
  }

  if (handleRootPathRedirect(to, next)) {
    return
  }

  if (to.matched.length > 0) {
    setWorktab(to)
    setPageTitle(to)
    next()
    return
  }

  next({ name: 'Exception404' })
}

function handleLoginStatus(
  to: RouteLocationNormalized,
  userStore: ReturnType<typeof useUserStore>,
  next: NavigationGuardNext
): boolean {
  if (userStore.isLogin || to.path === RoutesAlias.Login || isStaticRoute(to.path)) {
    return true
  }

  // 未登录访问受保护路由：由守卫直接重定向到登录页，避免在守卫内调用 router.replace 与 next(false) 竞争。
  next({
    name: 'Login',
    query: { redirect: to.fullPath }
  })
  return false
}

function isStaticRoute(path: string): boolean {
  const checkRoute = (routes: any[], targetPath: string): boolean => {
    return routes.some((route) => {
      if (route.name === 'Exception404') {
        return false
      }

      const pattern = route.path.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*')
      const regex = new RegExp(`^${pattern}$`)

      if (regex.test(targetPath)) {
        return true
      }
      if (route.children && route.children.length > 0) {
        return checkRoute(route.children, targetPath)
      }
      return false
    })
  }

  return checkRoute(staticRoutes, path)
}

/**
 * 保证当前会话只执行一次动态路由初始化；所有并发导航等待同一任务。
 */
function ensureDynamicRoutes(router: Router): Promise<AppRouteRecord[]> {
  if (routeRegistry?.isRegistered()) {
    return Promise.resolve(useMenuStore().menuList)
  }

  if (routeInitPromise) {
    return routeInitPromise
  }

  const epoch = routeInitEpoch
  const initialization = (async () => {
    const assertCurrentSession = () => {
      if (epoch !== routeInitEpoch || !useUserStore().isLogin) {
        throw new StaleRouteInitializationError()
      }
    }

    pendingLoading = true
    loadingService.showLoading()

    await fetchUserInfo()
    assertCurrentSession()

    const userStore = useUserStore()
    const menuList = await queryClient.fetchQuery({
      queryKey: createMenuQueryKey({
        userId: userStore.info?.userId,
        mode: import.meta.env.VITE_ACCESS_MODE
      }),
      queryFn: fetchAppMenuList
    })
    assertCurrentSession()

    if (!menuList.length) {
      throw new Error('获取菜单列表失败，请重新登录')
    }

    routeRegistry?.register(menuList)
    assertCurrentSession()

    const menuStore = useMenuStore()
    menuStore.setMenuList(menuList)
    IframeRouteManager.getInstance().save()
    useWorktabStore().validateWorktabs(router)

    return menuList
  })()

  routeInitPromise = initialization
  initialization.then(
    () => {
      if (routeInitPromise === initialization) {
        routeInitPromise = null
      }
    },
    () => {
      if (routeInitPromise === initialization) {
        routeInitPromise = null
      }
    }
  )

  return initialization
}

async function handleDynamicRoutes(
  to: RouteLocationNormalized,
  next: NavigationGuardNext,
  router: Router
): Promise<void> {
  try {
    const menuList = await ensureDynamicRoutes(router)

    if (isStaticRoute(to.path)) {
      next({
        path: to.path,
        query: to.query,
        hash: to.hash,
        replace: true
      })
      return
    }

    const { homePath } = useCommon()
    const { path: validatedPath, hasPermission } = RoutePermissionValidator.validatePath(
      to.path,
      menuList,
      homePath.value || '/'
    )

    if (!hasPermission) {
      console.warn(`[RouteGuard] 用户无权限访问路径: ${to.path}，已跳转到首页`)
    }

    next({
      path: validatedPath,
      query: hasPermission ? to.query : undefined,
      hash: hasPermission ? to.hash : undefined,
      replace: true
    })
  } catch (error) {
    closeLoading()

    if (error instanceof StaleRouteInitializationError) {
      next(false)
      return
    }

    if (isUnauthorizedError(error)) {
      // 拦截器已同步清理会话（clearSession）。守卫内不调用 router.replace，改为通过 next() 重定向到登录页，
      // 避免 router.replace 与守卫导航竞争导致跳转丢失。
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }

    routeInitFailed = true
    if (isHttpError(error)) {
      console.error(`[RouteGuard] 错误码: ${error.code}, 消息: ${error.message}`)
    } else {
      console.error('[RouteGuard] 动态路由注册失败:', error)
    }
    next({ name: 'Exception500', replace: true })
  }
}

async function fetchUserInfo(): Promise<void> {
  const userStore = useUserStore()
  const data = await fetchGetUserInfo()
  userStore.setUserInfo(data)
  userStore.checkAndClearWorktabs()
}

/** 同步清理动态路由及其关联会话状态。 */
export function resetRouterState(): void {
  resetRouteInitState()
  routeRegistry?.unregister()
  IframeRouteManager.getInstance().clear()

  const menuStore = useMenuStore()
  menuStore.clearRemoveRouteFns()
  menuStore.setMenuList([])
}

function handleRootPathRedirect(to: RouteLocationNormalized, next: NavigationGuardNext): boolean {
  if (to.path !== '/') {
    return false
  }

  const { homePath } = useCommon()
  if (homePath.value && homePath.value !== '/') {
    next({ path: homePath.value, replace: true })
    return true
  }

  return false
}

function isUnauthorizedError(error: unknown): boolean {
  return isHttpError(error) && error.code === ApiStatus.unauthorized
}
