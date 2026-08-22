// https://nuxt.com/docs/api/configuration/nuxt-config

// 后端服务地址：开发默认本机；生产通过 NUXT_API_SERVER 指向容器内 http://server:3000
const apiServer = process.env.NUXT_API_SERVER ?? 'http://localhost:3000'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  // 关闭 SSR（Nitro 服务端渲染），改为 SPA 模式：仅构建客户端产物，
  // 不再生成内存占用巨大的 Nitro 服务端渲染包（含全部 iconify 图标集合，构建期 OOM）。
  // web 容器仍运行 Nitro node-server 托管 SPA 壳与 /api/__sitemap__/urls 等服务端路由。
  ssr: false,

  modules: ['@nuxt/ui', '@nuxtjs/sitemap', '@vueuse/motion/nuxt'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL ?? 'http://localhost:3001',
    name: 'xlt-blog'
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls']
  },

  // 禁用 @nuxt/fonts 在线字体提供商（避免无外网时启动报错），使用系统字体
  ui: {
    fonts: false
  },

  css: ['~/assets/css/main.css'],

  devServer: {
    port: 3001
  },

  runtimeConfig: {
    // 仅服务端可见：SSR 内部直连后端（生产容器内 http://server:3000/api）
    apiBase: process.env.NUXT_API_BASE ?? `${apiServer}/api`,
    public: {
      // 浏览器端：生产走同源 /api（由 nginx 反代到后端）
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3000/api'
    }
  },

  // 上传图片走 Nitro 代理，前台统一使用 /uploads/xxx 相对路径
  routeRules: {
    '/uploads/**': { proxy: `${apiServer}/uploads/**` }
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      title: 'xlt-blog',
      meta: [
        { name: 'description', content: '一个基于 Nuxt 的个人博客' }
      ]
    }
  }
})
