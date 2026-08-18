<template>
  <div
    class="relative mb-5 overflow-hidden rounded-custom-sm max-sm:mb-4"
    :style="{
      background: `linear-gradient(135deg, var(--theme-color) 0%, color-mix(in srgb, var(--theme-color) 55%, #6366f1) 100%)`
    }"
  >
    <div class="relative z-10 box-border flex-cb px-6 py-6 max-sm:px-4">
      <div class="min-w-0">
        <h2 class="text-xl font-semibold text-white">{{ greeting }}，{{ displayName }}</h2>
        <p class="mt-1.5 text-sm text-white/75">{{ dateText }} · {{ slogan }}</p>
      </div>

      <div class="hidden items-center gap-2 md:flex">
        <div
          class="h-9 px-3.5 flex-cc rounded-full bg-white/15 text-xs text-white/90 backdrop-blur"
          v-for="item in quickStats"
          :key="item.label"
        >
          <ArtSvgIcon :icon="item.icon" class="mr-1.5 text-sm" />
          <span>{{ item.label }} <b class="ml-1 font-medium">{{ item.value }}</b></span>
        </div>
      </div>
    </div>

    <!-- 装饰元素 -->
    <div class="pointer-events-none absolute -top-12 -right-10 size-44 rounded-full bg-white/10"></div>
    <div class="pointer-events-none absolute -bottom-20 right-24 size-40 rounded-full bg-white/10"></div>
    <div class="pointer-events-none absolute right-56 -top-6 size-10 rounded-full bg-white/10"></div>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user'

  const userStore = useUserStore()
  const { getUserInfo } = storeToRefs(userStore)

  const displayName = computed(
    () => getUserInfo.value.nickname || getUserInfo.value.userName || '朋友'
  )

  const greeting = computed(() => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 12) return '早上好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  })

  const dateText = computed(() => {
    const now = new Date()
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekdays[now.getDay()]}`
  })

  const slogan = '愿你的一天充满效率'

  const quickStats = [
    { label: '今日访问', value: '1,284', icon: 'ri:eye-line' },
    { label: '新增用户', value: '+36', icon: 'ri:user-add-line' }
  ]
</script>
