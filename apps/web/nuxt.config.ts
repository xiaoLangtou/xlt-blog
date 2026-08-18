// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  modules: ['@nuxt/ui', '@nuxtjs/sitemap', '@vueuse/motion/nuxt'],

  site: {
    url: 'http://localhost:3001',
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
    public: {
      // SSR 与客户端都直连后端（后端已开 CORS）
      apiBase: 'http://localhost:3000/api'
    }
  },

  // 上传图片走 Nitro 代理，前台统一使用 /uploads/xxx 相对路径
  routeRules: {
    '/uploads/**': { proxy: 'http://localhost:3000/uploads/**' }
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
