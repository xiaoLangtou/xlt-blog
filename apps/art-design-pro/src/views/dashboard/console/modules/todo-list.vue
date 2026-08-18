<template>
  <div class="art-card box-border h-128 p-5 flex flex-col mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>待办事项</h4>
        <p>待处理<span class="text-danger">3</span></p>
      </div>
    </div>

    <div class="mt-1 min-h-0 flex-1 overflow-hidden">
      <ElScrollbar>
        <div
          class="flex-c border-b border-g-300 py-2.5 last:border-b-0"
          v-for="(item, index) in list"
          :key="index"
        >
          <ElCheckbox v-model="item.complate" />
          <div class="ml-2 min-w-0 flex-1">
            <p class="truncate text-sm" :class="item.complate ? 'text-g-400 line-through' : 'text-g-900'">
              {{ item.username }}
            </p>
          </div>
          <span class="ml-2 shrink-0 text-xs text-g-500">{{ item.date }}</span>
        </div>
      </ElScrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface TodoItem {
    username: string
    date: string
    complate: boolean
  }

  /**
   * 待办事项列表
   * 记录每日工作任务及完成状态
   */
  const list = reactive<TodoItem[]>([
    {
      username: '查看今天工作内容',
      date: '上午 09:30',
      complate: true
    },
    {
      username: '回复邮件',
      date: '上午 10:30',
      complate: true
    },
    {
      username: '工作汇报整理',
      date: '上午 11:00',
      complate: true
    },
    {
      username: '产品需求会议',
      date: '下午 02:00',
      complate: false
    },
    {
      username: '整理会议内容',
      date: '下午 03:30',
      complate: false
    },
    {
      username: '明天工作计划',
      date: '下午 06:30',
      complate: false
    }
  ])
</script>
