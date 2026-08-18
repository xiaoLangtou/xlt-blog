/**
 * 后端 component 路径解析为前端 views 路径
 *
 * @module utils/menu/componentPath
 */

/** 精确映射：后端 component -> 前端 views 路径 */
const COMPONENT_ALIASES: Record<string, string> = {
  '/dashboard/index': '/dashboard/console',
  '/dashboard': '/dashboard/console',
  '/admin/user/index': '/system/user',
  '/admin/user': '/system/user',
  '/admin/menu/index': '/system/menu',
  '/admin/menu': '/system/menu',
  '/admin/role/index': '/system/role',
  '/admin/role': '/system/role',
  '/admin/dept/index': '/system/dept',
  '/admin/dept': '/system/dept',
  '/admin/post/index': '/system/post',
  '/admin/post': '/system/post',
  '/admin/api/index': '/system/api',
  '/admin/api': '/system/api',
  '/admin/file/index': '/system/file',
  '/admin/file': '/system/file',
  '/admin/param/index': '/system/param',
  '/admin/param': '/system/param',
  '/admin/client/index': '/system/client',
  '/admin/client': '/system/client',
  '/admin/token/index': '/system/token',
  '/admin/token': '/system/token',
  '/system/dict/index': '/system/dict',
  '/system/dict': '/system/dict',
  '/daemon/job-manage/index': '/daemon/job-manage',
  '/daemon/logs/index': '/daemon/logs',
  '/daemon/logs': '/daemon/logs',
  '/daemon/cache/index': '/daemon/cache',
  '/daemon/cache': '/daemon/cache',
  '/gen/field-type/index': '/gen/field-type',
  '/gen/gener/index': '/gen/gener',
  '/gen/datasource/index': '/gen/datasource',
  '/gen/table/index': '/gen/table',
  '/gen/design/index': '/gen/design',
  '/gen/template/index': '/gen/template',
  '/gen/group/index': '/gen/group',
  '/admin/user-center/index': '/system/user-center',
  '/admin/user-center': '/system/user-center'
}

/** 前缀替换规则 */
const PREFIX_REPLACEMENTS: Array<[RegExp, string]> = [[/^\/admin\//, '/system/']]

const viewModules = import.meta.glob('../../views/**/*.vue')

/** 构建候选 views 路径 */
export function buildViewCandidates(componentPath: string): string[] {
  const paths = new Set<string>()
  const raw = componentPath.startsWith('/') ? componentPath : `/${componentPath}`

  paths.add(raw)
  paths.add(normalizeComponentPath(raw))

  if (raw.endsWith('/index')) {
    paths.add(raw.slice(0, -'/index'.length))
    paths.add(normalizeComponentPath(raw.slice(0, -'/index'.length)))
  }

  return [...paths]
}

/** 规范化 component 路径 */
export function normalizeComponentPath(componentPath: string): string {
  let path = componentPath.trim()
  if (!path) return path
  if (!path.startsWith('/')) path = `/${path}`

  if (COMPONENT_ALIASES[path]) {
    return COMPONENT_ALIASES[path]
  }

  for (const [pattern, replacement] of PREFIX_REPLACEMENTS) {
    if (pattern.test(path)) {
      path = path.replace(pattern, replacement)
      break
    }
  }

  if (COMPONENT_ALIASES[path]) {
    return COMPONENT_ALIASES[path]
  }

  if (path.endsWith('/index')) {
    const withoutIndex = path.slice(0, -'/index'.length)
    if (COMPONENT_ALIASES[withoutIndex]) {
      return COMPONENT_ALIASES[withoutIndex]
    }
    return withoutIndex || path
  }

  return path
}

/** 判断 views 组件是否存在 */
export function viewExists(componentPath: string): boolean {
  return buildViewCandidates(componentPath).some((candidate) => {
    const direct = `../../views${candidate}.vue`
    const withIndex = `../../views${candidate}/index.vue`
    return Boolean(viewModules[direct] || viewModules[withIndex])
  })
}

/** 解析可用的 component 路径，找不到则返回 undefined */
export function resolveViewComponent(
  componentPath?: string,
  routePath?: string
): string | undefined {
  const candidates = [
    ...(componentPath ? buildViewCandidates(componentPath) : []),
    ...(routePath ? buildViewCandidates(routePath) : [])
  ]

  for (const candidate of candidates) {
    if (viewExists(candidate)) {
      return normalizeComponentPath(candidate)
    }
  }

  return undefined
}
