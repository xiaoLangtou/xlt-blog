<template>
  <div class="art-card box-border h-128 p-5 flex flex-col overflow-hidden mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>新用户</h4>
        <p>这个月增长<span class="text-success">+20%</span></p>
      </div>
      <ElRadioGroup v-model="range" size="small">
        <ElRadioButton value="本月" label="本月"></ElRadioButton>
        <ElRadioButton value="上月" label="上月"></ElRadioButton>
        <ElRadioButton value="今年" label="今年"></ElRadioButton>
      </ElRadioGroup>
    </div>
    <ArtTable
      class="w-full min-h-0 flex-1"
      :data="tableData"
      :border="false"
      :stripe="false"
      :header-cell-style="{ background: 'transparent' }"
    >
      <template #default>
        <ElTableColumn label="用户" min-width="180">
          <template #default="scope">
            <div class="flex-c">
              <img class="size-9 shrink-0 rounded-full ring-2 ring-g-200" :src="scope.row.avatar" alt="avatar" />
              <span class="ml-3 font-medium text-g-900">{{ scope.row.username }}</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="地区" prop="province" min-width="90" />
        <ElTableColumn label="性别" width="70">
          <template #default="scope">{{ scope.row.sex === 1 ? '男' : '女' }}</template>
        </ElTableColumn>
        <ElTableColumn label="进度" min-width="160">
          <template #default="scope">
            <div class="flex-c w-full">
              <ElProgress
                class="min-w-0 flex-1"
                :percentage="scope.row.pro"
                :color="scope.row.color"
                :stroke-width="5"
                :show-text="false"
                :aria-label="`${scope.row.username}的完成进度: ${scope.row.pro}%`"
              />
              <span class="ml-2 w-8 shrink-0 text-right text-xs text-g-500">{{ scope.row.pro }}%</span>
            </div>
          </template>
        </ElTableColumn>
      </template>
    </ArtTable>
  </div>
</template>

<script setup lang="ts">
  import avatar1 from '@/assets/images/avatar/avatar1.webp'
  import avatar2 from '@/assets/images/avatar/avatar2.webp'
  import avatar3 from '@/assets/images/avatar/avatar3.webp'
  import avatar4 from '@/assets/images/avatar/avatar4.webp'
  import avatar5 from '@/assets/images/avatar/avatar5.webp'
  import avatar6 from '@/assets/images/avatar/avatar6.webp'

  interface UserTableItem {
    username: string
    province: string
    sex: 0 | 1
    percentage: number
    pro: number
    color: string
    avatar: string
  }

  const ANIMATION_DELAY = 100

  const range = ref('本月')

  /**
   * 新用户表格数据
   * 包含用户基本信息和完成进度
   */
  const tableData = reactive<UserTableItem[]>([
    {
      username: '中小鱼',
      province: '北京',
      sex: 0,
      percentage: 60,
      pro: 0,
      color: 'var(--art-primary)',
      avatar: avatar1
    },
    {
      username: '何小荷',
      province: '深圳',
      sex: 1,
      percentage: 20,
      pro: 0,
      color: 'var(--art-secondary)',
      avatar: avatar2
    },
    {
      username: '誶誶淰',
      province: '上海',
      sex: 1,
      percentage: 60,
      pro: 0,
      color: 'var(--art-warning)',
      avatar: avatar3
    },
    {
      username: '发呆草',
      province: '长沙',
      sex: 0,
      percentage: 50,
      pro: 0,
      color: 'var(--art-info)',
      avatar: avatar4
    },
    {
      username: '甜筒',
      province: '浙江',
      sex: 1,
      percentage: 70,
      pro: 0,
      color: 'var(--art-error)',
      avatar: avatar5
    },
    {
      username: '冷月呆呆',
      province: '湖北',
      sex: 1,
      percentage: 90,
      pro: 0,
      color: 'var(--art-success)',
      avatar: avatar6
    }
  ])

  /**
   * 添加进度条动画效果
   * 延迟后将进度值从 0 更新到目标百分比，触发动画
   */
  const addAnimation = (): void => {
    setTimeout(() => {
      tableData.forEach((item) => {
        item.pro = item.percentage
      })
    }, ANIMATION_DELAY)
  }

  onMounted(() => {
    addAnimation()
  })
</script>
