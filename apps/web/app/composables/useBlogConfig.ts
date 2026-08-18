import { DEFAULT_MENUS, DEFAULT_THEME_COLOR, type SiteConfig } from '@xlt-blog/shared'

/** 站点配置（主题色 + 菜单），SSR 阶段由 app.vue 拉取填充，默认值兜底 */
export function useBlogConfig() {
  return useState<SiteConfig>('blog-config', () => ({
    themeColor: DEFAULT_THEME_COLOR,
    menus: DEFAULT_MENUS
  }))
}
