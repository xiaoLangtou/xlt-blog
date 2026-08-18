import type { AppRouteRecord } from '@/types/router'
import { fetchGetMenuList } from '@/api/menu'
import { MenuProcessor } from '@/router/core/MenuProcessor'
import { commonRoutes } from '@/router/modules/common'
import { adaptBackendMenus } from './transformMenu'

const menuProcessor = new MenuProcessor()

/** 获取处理后的应用菜单（含公共路由） */
export async function fetchAppMenuList(): Promise<AppRouteRecord[]> {
  const routes = adaptBackendMenus(await fetchGetMenuList())
  const list = menuProcessor.processMenuList(routes)

  if (!menuProcessor.validateMenuList(list)) {
    throw new Error('获取菜单列表失败，请重新登录')
  }

  return [...list, ...commonRoutes]
}

/** 校验菜单列表是否有效 */
export function validateAppMenuList(menuList: AppRouteRecord[]): boolean {
  return menuProcessor.validateMenuList(menuList)
}
