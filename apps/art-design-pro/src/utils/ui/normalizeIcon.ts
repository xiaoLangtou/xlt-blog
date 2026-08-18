/**
 * 将后端 Lucide 图标名转换为 Iconify 格式
 *
 * @example Lucide-Gauge -> lucide:gauge
 * @example Lucide-ListTree -> lucide:list-tree
 * @module utils/ui/normalizeIcon
 */

/** PascalCase / camelCase 转 kebab-case */
function toKebabCase(value: string): string {
  return value
    .replace(/Icon$/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

/**
 * 统一图标名称为 Iconify 格式
 * - Lucide-Gauge -> lucide:gauge
 * - lucide:gauge / ri:home-line -> 原样返回
 */
export function normalizeIcon(icon?: string | null): string | undefined {
  if (!icon?.trim()) return undefined

  const value = icon.trim()

  if (value.includes(':')) return value

  if (/^lucide-/i.test(value)) {
    return `lucide:${toKebabCase(value.slice(7))}`
  }

  return `lucide:${toKebabCase(value)}`
}
