<script setup lang="ts">
  import { ElCard, ElInput, ElSelect, ElOption, ElButton } from 'element-plus'

  interface FilterOption {
    label: string
    value: string | number
  }

  interface FilterItem {
    key: string
    label: string
    type: 'select' | 'input'
    placeholder?: string
    options?: FilterOption[]
  }

  const props = defineProps<{
    placeholder?: string
    filterItems?: FilterItem[]
  }>()

  const emit = defineEmits<{
    search: []
    reset: []
  }>()

  // 命名双向绑定：v-model:keyword / v-model:filter-values
  const keyword = defineModel<string>('keyword', { default: '' })
  const filterValues = defineModel<Record<string, any>>('filterValues', {
    default: () => ({})
  })

  function onFilterChange(key: string, value: any) {
    filterValues.value = { ...filterValues.value, [key]: value }
  }

  function handleSearch() {
    emit('search')
  }

  function handleReset() {
    keyword.value = ''
    filterValues.value = {}
    emit('reset')
  }

  // 避免未使用 props 的告警
  void props
</script>

<template>
  <ElCard class="art-search-card" shadow="never">
    <div class="art-search-card__row">
      <ElInput
        v-model="keyword"
        :placeholder="placeholder ?? '请输入关键词'"
        clearable
        class="art-search-card__keyword"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" :size="16" />
        </template>
      </ElInput>

      <template v-for="item in filterItems" :key="item.key">
        <ElSelect
          v-if="item.type === 'select'"
          :model-value="filterValues[item.key]"
          :placeholder="item.placeholder ?? item.label"
          clearable
          class="art-search-card__filter"
          @update:model-value="onFilterChange(item.key, $event)"
        >
          <ElOption
            v-for="opt in item.options ?? []"
            :key="String(opt.value)"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
        <ElInput
          v-else
          :model-value="filterValues[item.key]"
          :placeholder="item.placeholder ?? item.label"
          clearable
          class="art-search-card__filter"
          @update:model-value="onFilterChange(item.key, $event)"
          @keyup.enter="handleSearch"
        />
      </template>

      <ElButton type="primary" @click="handleSearch">
        <ArtSvgIcon icon="ri:search-line" :size="14" class="mr-1" />
        搜索
      </ElButton>
      <ElButton @click="handleReset">
        <ArtSvgIcon icon="ri:refresh-line" :size="14" class="mr-1" />
        重置
      </ElButton>

      <div class="art-search-card__actions">
        <slot name="actions" />
      </div>
    </div>
  </ElCard>
</template>

<style scoped>
  .art-search-card__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  .art-search-card__keyword {
    width: 260px;
  }

  .art-search-card__filter {
    width: 180px;
  }

  .art-search-card__actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
