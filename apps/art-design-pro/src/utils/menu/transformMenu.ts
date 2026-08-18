/**
 * 后端菜单数据转换为路由格式
 *
 * @module utils/menu/transformMenu
 */
import type { AppRouteRecord } from '@/types/router'
import { RoutesAlias } from '@/router/routesAlias'
import { normalizeIcon } from '@/utils/ui/normalizeIcon'
import { resolveViewComponent } from './componentPath'

type BackendMenu = Api.Menu.IMenu

function parseBool(value?: string | boolean): boolean {
  if (typeof value === 'boolean') return value
  return value === '1' || value === 'true'
}

function isExternalPath(path: string): boolean {
  return (
    path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/outside/iframe/')
  )
}

function isBackendMenuFormat(menu: BackendMenu | AppRouteRecord): menu is BackendMenu {
  return 'menuType' in menu && menu.menuType !== undefined && menu.menuType !== null
}

function sanitizeComponent(component?: string | null): string | undefined {
  if (!component) return undefined
  const value = component.trim()
  if (!value || value === '无') return undefined
  return value
}

function formatRouteName(name?: string): string {
  if (!name) return 'Unknown'
  return name.replace(/\s+/g, '')
}

function resolveFullPath(path: string, parentPath: string): string {
  if (!path || isExternalPath(path)) return path

  if (path.startsWith('/')) {
    return path.replace(/\/$/, '') || '/'
  }

  if (parentPath) {
    return `${parentPath.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  }

  return `/${path.replace(/^\//, '')}`
}

/** 将子路由绝对路径转为相对路径 */
function toRelativePath(childPath: string, parentFullPath: string): string {
  if (!childPath.startsWith('/') || isExternalPath(childPath)) {
    return childPath
  }

  const normalizedParent = parentFullPath.replace(/\/$/, '')
  const normalizedChild = childPath.replace(/\/$/, '')

  if (normalizedParent && normalizedChild.startsWith(`${normalizedParent}/`)) {
    return normalizedChild.slice(normalizedParent.length + 1)
  }

  const parentSegments = normalizedParent.split('/').filter(Boolean)
  const childSegments = normalizedChild.split('/').filter(Boolean)

  let index = 0
  while (
    index < parentSegments.length &&
    index < childSegments.length &&
    parentSegments[index] === childSegments[index]
  ) {
    index++
  }

  const relative = childSegments.slice(index).join('/')
  return relative || childSegments[childSegments.length - 1] || ''
}

/** 将后端菜单转为 AppRouteRecord */
export function transformBackendMenuToRoute(menu: BackendMenu): AppRouteRecord {
  const meta = menu.meta ?? {}
  const rawPath = menu.path ?? ''
  const isIframe = parseBool(menu.isIframe) || parseBool(meta.isIframe)
  const isDirectory = String(menu.menuType) === '0'
  const isExternalUrl = isExternalPath(rawPath)
  const component = sanitizeComponent(menu.component)

  let path = rawPath
  let link: string | undefined

  if (isIframe) {
    link = meta.iframeUrl || (isExternalUrl ? rawPath : undefined) || undefined
    if (isExternalUrl) {
      path = `/outside/iframe/${formatRouteName(menu.name)}`
    }
  } else if (isExternalUrl) {
    link = rawPath
    path = `/outside/link/${menu.id ?? formatRouteName(menu.name)}`
  }

  const authList: Array<{ title: string; authMark: string; sort: number }> | undefined =
    menu.buttons?.length
      ? menu.buttons.map((btn, idx) => ({
          title: btn.name || '',
          authMark: btn.permission || '',
          sort: btn.sortOrder ?? idx + 1
        }))
      : undefined

  const route: AppRouteRecord = {
    id: menu.id,
    path,
    name: formatRouteName(menu.name),
    component,
    meta: {
      title: meta.title || menu.name || '',
      icon: normalizeIcon(meta.icon || menu.icon),
      isHide: parseBool(meta.isHide ?? menu.isHide),
      keepAlive: parseBool(meta.isKeepAlive ?? menu.isKeepAlive),
      isIframe,
      link,
      fixedTab: parseBool(meta.isAffix),
      authMark: menu.permission || undefined,
      authList
    }
  }

  if (menu.children?.length) {
    route.children = menu.children.map(transformBackendMenuToRoute)
    return route
  }

  // menuType=0 且无子节点：包装为 Layout + 单页面（如 dashboard）
  if (isDirectory && component) {
    route.component = RoutesAlias.Layout
    route.children = [
      {
        path: 'index',
        name: `${formatRouteName(menu.name)}Page`,
        component,
        meta: { ...route.meta }
      }
    ]
  }

  return route
}

/** 适配单条后端菜单为前端路由规范 */
function adaptBackendMenuItem(
  menu: AppRouteRecord,
  parentFullPath: string,
  level: number
): AppRouteRecord {
  const fullPath = resolveFullPath(menu.path || '', parentFullPath)
  let path = menu.path || ''

  if (level > 1 && path.startsWith('/') && !isExternalPath(path)) {
    path = toRelativePath(path, parentFullPath)
  }

  const hasChildren = Boolean(menu.children?.length)
  const isTopLevel = level === 1
  const isExternalMenu = Boolean(menu.meta?.link?.trim()) || menu.meta?.isIframe === true
  let component = sanitizeComponent(menu.component as string | undefined)

  if (hasChildren) {
    component = isTopLevel && !isExternalMenu ? RoutesAlias.Layout : ''
  } else if (menu.meta?.isIframe) {
    component = undefined
  } else if (component && component !== RoutesAlias.Layout) {
    component = resolveViewComponent(component, fullPath)
  } else if (!isExternalMenu) {
    component = resolveViewComponent(undefined, fullPath)
  }

  const adapted: AppRouteRecord = {
    ...menu,
    path,
    component,
    children: menu.children?.map((child) => adaptBackendMenuItem(child, fullPath, level + 1))
  }

  return adapted
}

/** 批量适配后端菜单，修正 component 与相对路径 */
export function adaptBackendMenus(menus: AppRouteRecord[]): AppRouteRecord[] {
  return menus.map((menu) => adaptBackendMenuItem(menu, '', 1))
}

/** 兼容后端 IMenu 与已转换的路由格式 */
export function normalizeMenuResponse(
  menus: Array<BackendMenu | AppRouteRecord>
): AppRouteRecord[] {
  if (!menus.length) return []

  if (isBackendMenuFormat(menus[0])) {
    return (menus as BackendMenu[]).map(transformBackendMenuToRoute)
  }

  return menus as AppRouteRecord[]
}

/** @deprecated 使用 transformBackendMenuToRoute */
export function transformMenuToRoute(menu: BackendMenu): AppRouteRecord {
  return transformBackendMenuToRoute(menu)
}
