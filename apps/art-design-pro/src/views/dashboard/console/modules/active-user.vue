<template>
  <div class="art-card box-border h-105 p-5 flex flex-col mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>用户概述</h4>
        <p>每月活跃用户<span class="text-success">+23%</span></p>
      </div>
    </div>

    <ArtBarChart
      class="min-h-0 flex-1"
      height="100%"
      barWidth="50%"
      :showAxisLine="false"
      :data="chartData"
      :xAxisData="xAxisLabels"
    />

    <div class="mt-4 flex divide-x divide-g-300 border-t border-g-300 pt-4">
      <div v-for="item in list" :key="item.name" class="min-w-0 flex-1 px-2 text-center">
        <p class="text-xl font-semibold text-g-900">{{ item.num }}</p>
        <p class="mt-0.5 text-xs text-g-500">{{ item.name }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface UserStatItem {
    name: string
    num: string
  }

  // 最近9个月
  const xAxisLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月']

  // 每月活跃用户数
  const chartData = [160, 100, 150, 80, 190, 100, 175, 120, 160]

  /**
   * 用户统计数据列表
   * 包含总用户量、总访问量、日访问量和周同比等关键指标
   */
  const list: UserStatItem[] = [
    { name: '总用户量', num: '32k' },
    { name: '总访问量', num: '128k' },
    { name: '日访问量', num: '1.2k' },
    { name: '周同比', num: '+5%' }
  ]
</script>
