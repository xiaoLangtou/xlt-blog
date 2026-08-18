<template>
  <div class="art-card box-border h-128 p-5 flex flex-col mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>动态</h4>
        <p>新增<span class="text-success">+6</span></p>
      </div>
    </div>

    <div class="mt-1 min-h-0 flex-1 overflow-hidden">
      <ElScrollbar>
        <div
          class="flex-c border-b border-g-300 py-2.5 last:border-b-0"
          v-for="(item, index) in list"
          :key="index"
        >
          <div
            class="flex-cc size-8 shrink-0 rounded-full text-xs font-medium text-white"
            :style="{ background: item.color }"
          >
            {{ item.username.slice(0, 1) }}
          </div>
          <div class="ml-3 min-w-0">
            <p class="truncate text-sm">
              <span class="font-medium text-g-900">{{ item.username }}</span>
              <span class="mx-1.5 text-g-500">{{ item.type }}</span>
              <span class="text-theme">{{ item.target }}</span>
            </p>
            <p class="mt-0.5 text-xs text-g-500">{{ item.time }}</p>
          </div>
        </div>
      </ElScrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface DynamicItem {
    username: string
    type: string
    target: string
    time: string
    color: string
  }

  /**
   * 用户动态列表
   * 记录用户的关注、发文、提问、兑换等各类活动
   */
  const list = reactive<DynamicItem[]>([
    {
      username: '中小鱼',
      type: '关注了',
      target: '誶誶淰',
      time: '3 分钟前',
      color: 'var(--art-primary)'
    },
    {
      username: '何小荷',
      type: '发表文章',
      target: 'Vue3 + Typescript + Vite 项目实战笔记',
      time: '12 分钟前',
      color: 'var(--art-secondary)'
    },
    {
      username: '誶誶淰',
      type: '提出问题',
      target: '主题可以配置吗',
      time: '25 分钟前',
      color: 'var(--art-warning)'
    },
    {
      username: '发呆草',
      type: '兑换了物品',
      target: '《奇特的一生》',
      time: '1 小时前',
      color: 'var(--art-info)'
    },
    {
      username: '甜筒',
      type: '关闭了问题',
      target: '发呆草',
      time: '2 小时前',
      color: 'var(--art-error)'
    },
    {
      username: '冷月呆呆',
      type: '兑换了物品',
      target: '《高效人士的七个习惯》',
      time: '3 小时前',
      color: 'var(--art-success)'
    }
  ])
</script>
