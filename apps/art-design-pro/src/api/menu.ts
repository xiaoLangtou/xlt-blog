import request from '@/utils/http'
import { normalizeMenuResponse } from '@/utils/menu/transformMenu'

/** 获取 sys_menu 菜单树 */
export function fetchGetMenuTree() {
  return request.get<Api.Menu.IMenu[]>({ url: '/admin/menus' })
}

/** 获取当前登录后台的动态菜单 */
export async function fetchGetMenuList() {
  return normalizeMenuResponse(await fetchGetMenuTree())
}

/** 获取菜单详情 */
export function fetchGetMenuDetail(id: number | string) {
  return request.get<Api.Menu.IMenu>({ url: `/admin/menus/${id}` })
}

function toSysMenuPayload(data: Api.Menu.MenuFormParams) {
  const { isHide, isKeepAlive, ...payload } = data
  return {
    ...payload,
    menuType: String(data.menuType),
    visible: isHide === '1' ? '1' : '0',
    keepAlive: isKeepAlive ?? '0'
  }
}

/** 创建菜单 */
export function fetchCreateMenu(data: Api.Menu.MenuFormParams) {
  return request.post<Api.Menu.IMenu>({ url: '/admin/menus', params: toSysMenuPayload(data) })
}

/** 更新菜单 */
export function fetchUpdateMenu(data: Api.Menu.MenuFormParams & { id: number }) {
  const { id, ...payload } = data
  return request.put<Api.Menu.IMenu>({
    url: `/admin/menus/${id}`,
    params: toSysMenuPayload(payload)
  })
}

/** 删除菜单 */
export function fetchDeleteMenu(id: number | string) {
  return request.del<void>({ url: `/admin/menus/${id}` })
}
