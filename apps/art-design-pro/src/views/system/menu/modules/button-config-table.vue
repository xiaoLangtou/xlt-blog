<template>
  <div class="menu-button-config">
    <div class="menu-button-config__header">
      <span class="menu-button-config__desc">配置当前菜单下的权限按钮</span>
      <ElButton v-if="!readonly" size="small" type="primary" plain @click="emit('add')">
        <ArtSvgIcon icon="ri:add-line" :size="12" class="mr-1" />
        添加按钮
      </ElButton>
    </div>

    <ElTable :data="localItems" class="menu-button-table" border empty-text="暂无按钮配置">
      <ElTableColumn label="名称" min-width="140">
        <template #default="{ row }">
          <span v-if="readonly">{{ row.title || '-' }}</span>
          <ElInput v-else v-model="row.title"  placeholder="按钮名称" />
        </template>
      </ElTableColumn>

      <ElTableColumn label="权限标识" min-width="160">
        <template #default="{ row }">
          <span v-if="readonly" class="menu-code">{{ row.authMark || '-' }}</span>
          <ElInput v-else v-model="row.authMark"  placeholder="权限标识" />
        </template>
      </ElTableColumn>

    

      <ElTableColumn v-if="!readonly" label="操作" width="80" align="center" fixed="right">
        <template #default="{ $index }">
          <ElButton link type="danger" @click="emit('remove', $index)">移除</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </div>
</template>

<script setup lang="ts">
  interface AuthButtonItem {
    title: string
    authMark: string
    sort: number
  }

  interface Props {
    items?: AuthButtonItem[]
    readonly?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    items: () => [],
    readonly: true
  })

  const emit = defineEmits<{
    add: []
    remove: [index: number]
    'update:items': [items: AuthButtonItem[]]
  }>()

  const localItems = computed({
    get: () => props.items,
    set: (value) => emit('update:items', value)
  })
</script>

<style lang="scss">
.menu-button-config {
  .menu-button-table {
    width: 100%;
    overflow: hidden;
    border-radius: 8px;

    &__sort {
      width: 88px;
    }

    .el-table__header th {
      font-size: 12px;
      font-weight: 600;
      color: var(--system-muted, var(--art-gray-600));
      background: color-mix(in srgb, var(--system-elevated, var(--art-gray-200)) 60%, transparent) !important;
    }

    .el-table__cell {
      font-size: 13px;
    }

    .el-input-number {
      width: 100%;
    }
  }
}
</style>
