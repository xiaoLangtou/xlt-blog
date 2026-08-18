import { AppRouteRecord } from '@/types/router'

/**
 * 公共路由（登录后始终注册，不依赖菜单权限）
 */
export const preferencesRoutes: AppRouteRecord = {
  path: '/preferences',
  name: 'Preferences',
  component: '/system/preferences',
  meta: {
    title: 'menus.system.preferences',
    keepAlive: true,
    isHide: true,
    isHideTab: true
  }
}

export const commonRoutes: AppRouteRecord[] = [preferencesRoutes]
