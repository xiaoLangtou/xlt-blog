<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value: boolean) => {
    colorMode.preference = value ? 'dark' : 'light'
  }
})

const route = useRoute()

const siteConfig = useBlogConfig()

const columnMenu = { label: '专栏', url: '/columns', sort: 2 }

// 导航菜单来自后台配置；为兼容已保存的旧配置，缺少专栏时在前台补入入口。
const links = computed(() => {
  const menus = siteConfig.value.menus.some(menu => menu.url === columnMenu.url)
    ? siteConfig.value.menus
    : [...siteConfig.value.menus, columnMenu]

  return [...menus]
    .sort((a, b) => a.sort - b.sort)
    .map(menu => ({
      label: menu.label,
      to: menu.url,
      external: /^https?:\/\//.test(menu.url)
    }))
})

function isActive(to: string) {
  if (/^https?:\/\//.test(to)) return false
  if (to === '/') {
    return route.path === '/' || route.path.startsWith('/posts')
  }
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- 朱砂顶带：翻开封面的第一道颜色 -->
    <div class="h-0.75 bg-(--color-cinnabar)" aria-hidden="true" />

    <header class="sticky top-0 z-50 backdrop-blur-sm bg-default/85 border-b border-default/60">
      <UContainer class="max-w-6xl flex items-center justify-between h-16">
        <NuxtLink to="/" class="flex items-baseline gap-3 select-none">
          <span class="font-display text-xl tracking-widest text-highlighted">
            栖<span class="text-(--color-cinnabar)">迟</span>
          </span>
          <span class="hidden sm:inline font-mono text-[10px] tracking-[0.2em] text-dimmed uppercase">
            xlt-blog · 个人志
          </span>
        </NuxtLink>

        <nav class="flex items-center gap-6">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            :target="link.external ? '_blank' : undefined"
            class="relative text-sm tracking-widest transition-colors pb-1"
            :class="isActive(link.to)
              ? 'text-highlighted after:absolute after:left-0 after:right-0 after:-bottom-px after:h-px after:bg-(--color-cinnabar)'
              : 'text-muted hover:text-highlighted'"
          >
            {{ link.label }}
          </NuxtLink>

          <ClientOnly>
            <button
              class="text-muted hover:text-highlighted transition-colors cursor-pointer"
              aria-label="切换深浅色"
              @click="isDark = !isDark"
            >
              <UIcon :name="isDark ? 'i-lucide-moon' : 'i-lucide-sun'" class="size-4.5 block" />
            </button>
            <template #fallback>
              <div class="size-4.5" />
            </template>
          </ClientOnly>
        </nav>
      </UContainer>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <!-- 版权页式页脚：三栏，像书的最后一页 -->
    <footer class="mt-20 border-t border-default/60 bg-elevated/20">
      <UContainer class="max-w-6xl py-12">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <p class="font-display text-lg tracking-widest text-highlighted mb-3">
              栖<span class="text-(--color-cinnabar)">迟</span>
            </p>
            <p class="text-xs text-muted leading-relaxed max-w-60">
              一份关于 Web 开发与日常思考的个人志。刊名取自《诗经·陈风·衡门》：衡门之下，可以栖迟。
            </p>
          </div>

          <div>
            <p class="font-mono text-[10px] tracking-[0.25em] text-dimmed uppercase mb-3">Index</p>
            <ul class="space-y-2 text-sm">
              <li v-for="link in links" :key="link.to">
                <NuxtLink
                  :to="link.to"
                  :target="link.external ? '_blank' : undefined"
                  class="text-muted hover:text-primary transition-colors"
                >
                  {{ link.label }}
                </NuxtLink>
              </li>
              <li>
                <a href="/sitemap.xml" class="text-muted hover:text-primary transition-colors">站点地图</a>
              </li>
            </ul>
          </div>

          <div class="flex sm:flex-col sm:items-end justify-between">
            <div class="font-mono text-[10px] tracking-[0.2em] text-dimmed uppercase sm:text-right leading-loose">
              <p>Nuxt / NestJS / MySQL</p>
              <p>© {{ new Date().getFullYear() }} XLT-BLOG</p>
            </div>
            <span class="seal sm:mt-4" aria-hidden="true">栖迟</span>
          </div>
        </div>
      </UContainer>
    </footer>
  </div>
</template>
