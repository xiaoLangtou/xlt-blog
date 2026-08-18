/**
 * 菜单 Query Key 工具
 *
 * @module utils/menu/queryKey
 */
import { queryKeys } from '@/utils/query'

export interface MenuQueryKeyParams {
  userId?: number | string
  mode: string
}

/** 创建菜单 Query Key */
export function createMenuQueryKey(params: MenuQueryKeyParams) {
  return queryKeys.menu.list(params)
}
