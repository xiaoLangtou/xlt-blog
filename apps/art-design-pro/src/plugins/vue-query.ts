/**
 * TanStack Vue Query 插件
 *
 * @module plugins/vue-query
 */
import type { App } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient } from '@/utils/query'

/**
 * 初始化 Vue Query
 */
export function initVueQuery(app: App): void {
  app.use(VueQueryPlugin, { queryClient })
}
