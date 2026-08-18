<!-- 角色管理 - 左侧角色列表面板 -->
<template>
  <aside class="role-left-panel">
    <div class="role-panel-header">
      <div class="role-panel-title">
        角色列表
        <span class="role-panel-count">{{ total }}</span>
      </div>
    </div>

    <div class="role-search-wrap">
      <div class="role-search-input-wrap">
        <ElInput v-model="searchKeyword" :prefix-icon="SearchIcon" placeholder="搜索角色名称..." clearable />
      </div>
    </div>

    <div v-loading="loading" class="role-list-body">
      <div
        v-for="role in filteredData"
        :key="role.roleId"
        class="role-item"
        :class="{ selected: selectedRoleId === role.roleId }"
        @click="$emit('select', role)"
      >
        <div class="role-av" :class="roleColorClass(role.roleId)">
          {{ role.roleName.charAt(0) }}
        </div>
        <div class="role-item-info">
          <div class="role-item-name">{{ role.roleName }}</div>
          <div class="role-item-meta">
            <span class="role-key">{{ role.roleCode }}</span>
            <span class="role-status" :class="role.enabled ? 'is-on' : 'is-off'">
              {{ role.enabled ? '启用' : '停用' }}
            </span>
          </div>
        </div>
        <div class="role-actions">
          <button type="button" class="ra-btn" title="编辑" @click.stop="$emit('edit', role)">
            <ArtSvgIcon icon="ri:edit-2-line" :size="12" />
          </button>
          <button
            v-if="role.roleCode !== 'admin'"
            type="button"
            class="ra-btn is-danger"
            title="删除"
            @click.stop="$emit('delete', role)"
          >
            <ArtSvgIcon icon="ri:delete-bin-4-line" :size="12" />
          </button>
        </div>
      </div>
      <div v-if="!filteredData.length" class="role-list-empty">
        无匹配角色
      </div>
    </div>

    <div class="role-panel-footer">
      <ElButton type="primary" @click="$emit('add')" plain v-ripple class="is-full-width">
        <ArtSvgIcon icon="ri:add-line" :size="12" class="ra-btn-icon-right" />
        新增
      </ElButton>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { SearchIcon } from 'lucide-vue-next'

defineOptions({ name: 'RoleLeftPanel' })

type RoleListItem = Api.SystemManage.RoleListItem

const props = defineProps<{
  roles: RoleListItem[]
  loading: boolean
  selectedRoleId: number | null
  total: number
}>()

defineEmits<{
  select: [role: RoleListItem]
  edit: [role: RoleListItem]
  delete: [role: RoleListItem]
  add: []
}>()

const searchKeyword = ref('')

const filteredData = computed(() => {
  const q = searchKeyword.value.toLowerCase()
  if (!q) return props.roles
  return props.roles.filter(
    (r) => r.roleName.toLowerCase().includes(q) || r.roleCode.toLowerCase().includes(q)
  )
})

const roleColorClasses = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']
const roleColorClass = (id: number) => roleColorClasses[id % roleColorClasses.length]
</script>

<style lang="scss" scoped>
.role-left-panel {
  display: flex;
  flex-direction: column;
  width: 320px;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--system-card, var(--default-box-color));
  border: 1px solid var(--system-border-subtle, var(--default-border));
  border-radius: calc(var(--custom-radius) / 2 + 4px);
  animation: role-panel-fade-in 0.4s ease forwards;
}

.role-panel-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--system-border-subtle, var(--default-border));
}

.role-panel-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--art-gray-900);
}

.role-panel-count {
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 500;
  color: var(--system-muted, var(--art-gray-600));
  background: var(--system-elevated, var(--art-gray-200));
  border: 1px solid var(--system-border-subtle, var(--default-border));
  border-radius: 10px;
}

.role-search-wrap {
  position: relative;
  flex-shrink: 0;
  padding: 12px 16px;
  border-bottom: 1px solid var(--system-border-subtle, var(--default-border));
}

.role-search-input-wrap {
  position: relative;
}

.role-search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  z-index: 1;
  color: var(--system-muted, var(--art-gray-600));
  pointer-events: none;
  transform: translateY(-50%);
}

.role-search-wrap :deep(.el-input__wrapper) {
  padding-left: 30px;
  background: var(--system-input, var(--default-box-color));
  border-radius: 6px;
  box-shadow: 0 0 0 1px var(--system-border-subtle, var(--default-border)) inset;

  .el-input__inner::placeholder {
    color: var(--system-muted, var(--art-gray-600));
  }

  &.is-focus {
    box-shadow:
      0 0 0 1px var(--system-accent, var(--theme-color)) inset,
      0 0 0 3px var(--system-accent-soft, color-mix(in srgb, var(--theme-color) 12%, transparent));
  }
}

.role-panel-footer {
  flex-shrink: 0;
  padding: 12px;
  border-top: 1px solid var(--system-border-subtle, var(--default-border));

  .is-full-width {
    width: 100%;
  }
}

.role-list-body {
  flex: 1;
  padding: 8px 4px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--system-border, var(--default-border));
    border-radius: 3px;
  }
}

.role-list-empty {
  padding: 48px 0;
  font-size: 13px;
  color: var(--system-muted, var(--art-gray-600));
  text-align: center;
  user-select: none;
}

.role-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px;
  margin: 0 8px 4px;
  cursor: pointer;
  position: relative;
  border: 1px solid transparent;
  border-radius: var(--custom-radius, 8px);
  transition: background 0.18s, border-color 0.18s;

  &:hover {
    background: var(--system-hover, var(--art-hover-color));
  }

  &.selected {
    background: var(--system-accent-soft, color-mix(in srgb, var(--theme-color) 12%, transparent));
    border-color: color-mix(in srgb, var(--theme-color) 15%, transparent);

    &::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 50%;
      width: 3px;
      height: 22px;
      background: var(--system-accent, var(--theme-color));
      border-radius: 0 3px 3px 0;
      transform: translateY(-50%);
    }
  }

  &:hover .role-actions,
  &.selected .role-actions {
    opacity: 1;
  }
}

.role-item-info {
  flex: 1;
  min-width: 0;
}

.role-item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--art-gray-900);
}

.role-item-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
}

.role-actions {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.role-av {
  --role-av-base: var(--theme-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--role-av-base), color-mix(in srgb, var(--role-av-base) 55%, #fff));

  &.c1 { background: linear-gradient(135deg, var(--role-av-base), color-mix(in srgb, var(--role-av-base) 55%, #fff)); }
  &.c2 { background: linear-gradient(135deg, color-mix(in srgb, var(--role-av-base) 90%, #5b8def), color-mix(in srgb, var(--role-av-base) 50%, #fff)); }
  &.c3 { background: linear-gradient(135deg, color-mix(in srgb, var(--role-av-base) 90%, #3ecf8e), color-mix(in srgb, var(--role-av-base) 50%, #fff)); }
  &.c4 { background: linear-gradient(135deg, color-mix(in srgb, var(--role-av-base) 85%, #a07cf0), color-mix(in srgb, var(--role-av-base) 50%, #fff)); }
  &.c5 { background: linear-gradient(135deg, color-mix(in srgb, var(--role-av-base) 88%, #f08080), color-mix(in srgb, var(--role-av-base) 48%, #fff)); }
  &.c6 { background: linear-gradient(135deg, color-mix(in srgb, var(--role-av-base) 90%, #5be0d0), color-mix(in srgb, var(--role-av-base) 50%, #fff)); }
}

.role-key {
  padding: 1px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  color: var(--system-muted, var(--art-gray-600));
  background: var(--system-elevated, var(--art-gray-200));
  border: 1px solid var(--system-border-subtle, var(--default-border));
  border-radius: 4px;
}

.role-status {
  padding: 1px 7px;
  font-size: 10.5px;
  font-weight: 500;
  border-radius: 10px;

  &.is-on {
    color: var(--system-green, var(--art-success));
    background: var(--system-green-soft, color-mix(in srgb, var(--art-success) 12%, transparent));
  }
  &.is-off {
    color: var(--system-red, var(--art-danger));
    background: var(--system-red-soft, color-mix(in srgb, var(--art-danger) 12%, transparent));
  }
}

.ra-btn-icon-right {
  margin-right: 4px;
}

.ra-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  cursor: pointer;
  color: var(--system-muted, var(--art-gray-600));
  background: transparent;
  border: none;
  border-radius: 4px;
  transition: all 0.15s;

  &:hover {
    color: var(--system-text, var(--art-gray-900));
    background: var(--system-elevated, var(--art-gray-200));
  }
  &.is-danger:hover {
    color: var(--system-red, var(--art-danger));
    background: var(--system-red-soft, color-mix(in srgb, var(--art-danger) 12%, transparent));
  }
}

@keyframes role-panel-fade-in {
  from { opacity: 0; transform: translateX(-14px); }
  to { opacity: 1; transform: translateX(0); }
}

@media (max-width: 960px) {
  .role-left-panel {
    width: 100%;
    max-height: 42vh;
  }
}
</style>
