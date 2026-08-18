<template>
  <ElRow :gutter="20">
    <ElCol v-for="(item, index) in dataList" :key="index" :sm="12" :md="6" :lg="6">
      <div class="art-card relative flex flex-col justify-center h-35 px-5 mb-5 max-sm:mb-4">
        <span class="pr-18 text-sm text-g-500">{{ item.des }}</span>

        <ArtCountTo
          class="mt-2.5 text-[28px] font-semibold leading-none text-g-900"
          :target="item.num"
          :duration="1300"
        />

        <div class="flex-c mt-2.5">
          <span class="text-xs text-g-500">较上周</span>
          <span
            class="ml-2 inline-flex h-5 px-1.5 flex-c rounded-full text-xs font-medium"
            :class="isRise(item.change) ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'"
          >
            {{ item.change }}
          </span>
        </div>

        <div
          class="absolute top-0 bottom-0 right-5 my-auto size-11 rounded-xl flex-cc"
          :style="{
            background: `color-mix(in srgb, ${item.color} 12%, transparent)`,
            color: item.color
          }"
        >
          <ArtSvgIcon :icon="item.icon" class="text-xl" />
        </div>
      </div>
    </ElCol>
  </ElRow>
</template>

<script setup lang="ts">
  interface CardDataItem {
    des: string
    icon: string
    num: number
    change: string
    color: string
  }

  /**
   * 判断数据是否为增长趋势
   */
  const isRise = (change: string): boolean => change.indexOf('+') !== -1

  /**
   * 卡片统计数据列表
   * 展示总访问次数、在线访客数、点击量和新用户等核心数据指标
   */
  const dataList = reactive<CardDataItem[]>([
    {
      des: '总访问次数',
      icon: 'ri:pie-chart-line',
      num: 9120,
      change: '+20%',
      color: 'var(--art-primary)'
    },
    {
      des: '在线访客数',
      icon: 'ri:group-line',
      num: 182,
      change: '+10%',
      color: 'var(--art-secondary)'
    },
    {
      des: '点击量',
      icon: 'ri:fire-line',
      num: 9520,
      change: '-12%',
      color: 'var(--art-warning)'
    },
    {
      des: '新用户',
      icon: 'ri:progress-2-line',
      num: 156,
      change: '+30%',
      color: 'var(--art-success)'
    }
  ])
</script>
