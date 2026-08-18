<!-- 缓存监控 -->
<template>
  <div class="cache-page art-full-height">
    <ElCard class="art-table-card">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-base font-medium">Redis 缓存监控</span>
          <div class="flex items-center gap-3">
            <span v-if="lastRefreshTime" class="text-xs text-gray-400">
              上次刷新: {{ lastRefreshTime }}
            </span>
            <ElButton size="small" @click="handleRefresh" :loading="query.isFetching.value">
              刷新
            </ElButton>
          </div>
        </div>
      </template>

      <div v-if="query.isLoading.value" class="flex justify-center py-20">
        <ElIcon class="animate-spin" :size="28" style="color: var(--art-primary)"><Loading /></ElIcon>
      </div>

      <template v-else-if="cacheInfo">
        <!-- 概览卡片 -->
        <ElRow :gutter="16" class="mb-5">
          <ElCol :span="8">
            <div class="stat-card">
              <div class="stat-label">Redis 版本</div>
              <div class="stat-value">{{ cacheInfo.redis_version ?? '-' }}</div>
            </div>
          </ElCol>
          <ElCol :span="8">
            <div class="stat-card">
              <div class="stat-label">运行时间</div>
              <div class="stat-value">{{ cacheInfo.uptime_in_days ?? '-' }} 天</div>
            </div>
          </ElCol>
          <ElCol :span="8">
            <div class="stat-card">
              <div class="stat-label">已用内存</div>
              <div class="stat-value">{{ cacheInfo.used_memory_human ?? '-' }}</div>
            </div>
          </ElCol>
        </ElRow>

        <ElRow :gutter="16" class="mb-5">
          <ElCol :span="8">
            <div class="stat-card">
              <div class="stat-label">连接客户端数</div>
              <div class="stat-value">{{ cacheInfo.connected_clients ?? '-' }}</div>
            </div>
          </ElCol>
          <ElCol :span="8">
            <div class="stat-card">
              <div class="stat-label">命中率</div>
              <div class="stat-value">
                {{ hitRate }}%
              </div>
            </div>
          </ElCol>
          <ElCol :span="8">
            <div class="stat-card">
              <div class="stat-label">Key 数量</div>
              <div class="stat-value">{{ cacheInfo.keyspace_hits ? formatNumber(keyspaceKeys) : '-' }}</div>
            </div>
          </ElCol>
        </ElRow>

        <!-- 详细信息表格 -->
        <ElTable :data="infoTable" border stripe size="small" max-height="400">
          <ElTableColumn prop="key" label="配置项" width="260" />
          <ElTableColumn prop="value" label="值">
            <template #default="{ row }">
              <code class="info-value">{{ row.value }}</code>
            </template>
          </ElTableColumn>
        </ElTable>
      </template>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { Loading } from '@element-plus/icons-vue'
  import { useCacheInfoQuery } from '@/hooks/queries/useCacheQuery'

  defineOptions({ name: 'CacheMonitor' })

  const query = useCacheInfoQuery()

  const lastRefreshTime = ref('')

  const cacheInfo = computed(() => {
    const data = query.data.value as Record<string, string> | undefined
    return data ?? null
  })

  // 计算命中率
  const hitRate = computed(() => {
    const hits = Number(cacheInfo.value?.keyspace_hits ?? 0)
    const misses = Number(cacheInfo.value?.keyspace_misses ?? 0)
    const total = hits + misses
    if (total === 0) return '0.00'
    return ((hits / total) * 100).toFixed(2)
  })

  // 计算 keyspace 总 key 数
  const keyspaceKeys = computed(() => {
    const info = cacheInfo.value
    if (!info) return 0
    let count = 0
    Object.keys(info).forEach((k) => {
      if (k.startsWith('db')) {
        const match = String(info[k]).match(/keys=(\d+)/)
        if (match) count += Number(match[1])
      }
    })
    return count
  })

  // 表格数据
  const infoTable = computed(() => {
    if (!cacheInfo.value) return []
    return Object.entries(cacheInfo.value).map(([key, value]) => ({
      key,
      value: String(value)
    }))
  })

  function formatNumber(num: number): string {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万'
    return String(num)
  }

  function handleRefresh() {
    const now = new Date()
    lastRefreshTime.value = now.toLocaleTimeString()
    query.refetch()
  }
</script>

<style lang="scss" scoped>
  .stat-card {
    padding: 18px 20px;
    border-radius: 8px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .stat-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 700;
      font-family: ui-monospace, 'JetBrains Mono', monospace;
      color: var(--art-primary);
    }
  }

  .info-value {
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--el-text-color-regular);
    word-break: break-all;
  }
</style>
