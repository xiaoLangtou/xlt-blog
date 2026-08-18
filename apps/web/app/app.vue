<script setup lang="ts">
import { THEME_COLORS, type SiteConfig } from '@xlt-blog/shared'

const siteConfig = useBlogConfig()

// SSR 阶段拉取站点配置，主题色随首屏 HTML 注入，无闪烁
const { data } = await useApi<SiteConfig>('/site/config')
if (data.value) siteConfig.value = data.value

const themeStyle = computed(() => {
  const palette
    = THEME_COLORS.find(p => p.name === siteConfig.value.themeColor) ?? THEME_COLORS[0]!
  const vars = Object.entries(palette.colors)
    .map(([step, hex]) => `--ui-color-primary-${step}: ${hex};`)
    .join(' ')
  return `:root { ${vars} }`
})

useHead({
  titleTemplate: title => title ? `${title} - xlt-blog` : 'xlt-blog',
  style: [{ innerHTML: themeStyle }]
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
