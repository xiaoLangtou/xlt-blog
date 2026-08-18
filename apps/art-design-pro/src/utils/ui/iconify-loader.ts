/**
 * 离线图标加载器
 *
 * 用于在内网环境下支持 Iconify 图标的离线加载。
 * 通过预加载图标集数据，避免运行时从 CDN 获取图标。
 *
 * 使用方式：
 * 1. 安装所需图标集：pnpm add -D @iconify-json/[icon-set-name]
 * 2. 在此文件中导入并注册图标集
 * 3. 在组件中使用：<ArtSvgIcon icon="lucide:home" />
 *
 * 菜单 Lucide 图标默认走 Iconify CDN；内网环境可取消注释下方 lucide 预加载。
 *
 * @module utils/ui/iconify-loader
 */

// import { addCollection } from '@iconify/vue'
// import lucideIcons from '@iconify-json/lucide/icons.json'
// addCollection(lucideIcons)
