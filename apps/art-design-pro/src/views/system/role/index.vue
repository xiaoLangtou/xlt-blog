<!-- 角色管理页面 -->
<template>
  <div class="role-page art-full-height">
    <div class="role-page__layout">
      <!-- 左侧角色列表 -->
      <RoleLeftPanel
        :roles="data"
        :loading="loading"
        :selected-role-id="selectedRoleId"
        :total="pagination.total"
        @select="selectRole"
        @edit="showDialog('edit', $event)"
        @delete="deleteRole"
        @add="showDialog('add')"
      />

      <!-- 右侧详情面板 -->
      <section v-loading="detailLoading" class="role-right-panel">
        <!-- 空状态 -->
        <RoleEmptyState v-if="!selectedRole" />

        <!-- 角色详情 -->
        <template v-else>
          <div class="rp-header">
            <div class="rp-role-av" :class="roleColorClass(selectedRole.roleId)">
              {{ selectedRole.roleName.charAt(0) }}
            </div>
            <div class="rp-header-info">
              <div class="rp-title-row">
                {{ selectedRole.roleName }}
                <span class="role-status-tag" :class="selectedRole.enabled ? 'is-on' : 'is-off'">
                  {{ selectedRole.enabled ? '启用' : '停用' }}
                </span>
                <span class="rp-role-key">{{ selectedRole.roleCode }}</span>
              </div>
              <div class="rp-desc">{{ selectedRole.description || '暂无描述' }}</div>
            </div>
            <ElButton class="rp-edit-btn" @click="showDialog('edit', selectedRole!)">
              <ArtSvgIcon icon="ri:edit-2-line" :size="13" class="ra-btn-icon-right" />
              编辑
            </ElButton>
          </div>

          <div class="role-tabs">
            <div
              class="role-tab"
              :class="{ active: activeTab === 'perm' }"
              @click="switchTab('perm')"
            >
              <ArtSvgIcon icon="ri:lock-line" :size="15" />
              功能权限
              <span v-if="permCheckedCount" class="tab-count">{{ permCheckedCount }}</span>
            </div>
            <div
              class="role-tab"
              :class="{ active: activeTab === 'data' }"
              @click="switchTab('data')"
            >
              <ArtSvgIcon icon="ri:archive-line" :size="15" />
              数据权限
            </div>
            <div
              class="role-tab"
              :class="{ active: activeTab === 'members' }"
              @click="switchTab('members')"
            >
              <ArtSvgIcon icon="ri:user-3-line" :size="15" />
              角色人员
              <span v-if="memberCount" class="tab-count">{{ memberCount }}</span>
            </div>
          </div>

          <div class="role-tab-content">
            <div v-show="activeTab === 'perm'" class="tab-pane">
              <RolePermissionTab
                ref="permTabRef"
                :role-id="selectedRole.roleId"
                :role-code="selectedRole.roleCode"
                :assigned-menu-ids="assignMenuIds"
                :assigned-button-ids="assignButtonIds"
                @count-change="onPermCountChange"
              />
            </div>
            <div v-show="activeTab === 'data'" class="tab-pane">
              <RoleDataScopeTab
                ref="scopeTabRef"
                :role-id="selectedRole.roleId"
              />
            </div>
            <div v-show="activeTab === 'members'" class="tab-pane">
              <RoleMembersTab
                ref="membersTabRef"
                :role-id="selectedRole.roleId"
                @count-change="onMemberCountChange"
              />
            </div>
          </div>

          <div v-if="activeTab !== 'members'" class="tab-footer">
            <ElButton @click="handleTabReset">重置</ElButton>
            <ElButton type="primary" :loading="footerSaving" @click="handleTabSave">
              <ArtSvgIcon icon="ri:check-line" :size="12" class="ra-btn-icon-right" />
              保存设置
            </ElButton>
          </div>
        </template>
      </section>
    </div>

    <!-- 角色编辑弹窗 -->
    <RoleEditDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :role-data="currentRoleData"
      @success="onEditSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { fetchGetRoleList } from '@/api/system-manage'
import { fetchRemoveRole, fetchGetRoleDetail } from '@/api/role'
import RoleEditDialog from './modules/role-edit-dialog.vue'
import RolePermissionTab from './modules/role-permission-tab.vue'
import RoleDataScopeTab from './modules/role-data-scope-tab.vue'
import RoleMembersTab from './modules/role-members-tab.vue'
import RoleEmptyState from './modules/role-empty-state.vue'
import RoleLeftPanel from './modules/role-left-panel.vue'

defineOptions({ name: 'Role' })

type RoleListItem = Api.SystemManage.RoleListItem

const loading = ref(false)
const detailLoading = ref(false)
const selectedRoleId = ref<number | null>(null)
const data = ref<RoleListItem[]>([])
const pagination = reactive({ total: 0, current: 1, size: 20 })

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const currentRoleData = ref<RoleListItem | undefined>(undefined)

const activeTab = ref<'perm' | 'data' | 'members'>('perm')
const permCheckedCount = ref(0)
const memberCount = ref(0)

const permTabRef = ref()
const scopeTabRef = ref()
const membersTabRef = ref()
const roleDetail = ref<any>(null)
const assignMenuIds = ref<number[]>([])
const assignButtonIds = ref<number[]>([])

const footerSaving = computed(() => {
  if (activeTab.value === 'perm') return permTabRef.value?.saving ?? false
  if (activeTab.value === 'data') return scopeTabRef.value?.saving ?? false
  return false
})

const selectedRole = computed(() =>
  data.value.find((r) => r.roleId === selectedRoleId.value) ?? null
)

const roleColorClasses = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']
const roleColorClass = (id: number) => roleColorClasses[id % roleColorClasses.length]

const getData = async () => {
  loading.value = true
  try {
    const res = await fetchGetRoleList({ current: 1, size: 200 })
    data.value = res.records
    pagination.total = res.total
  } finally {
    loading.value = false
  }
}


const selectRole = async (role: RoleListItem) => {
  selectedRoleId.value = role.roleId
  activeTab.value = 'perm'
  assignMenuIds.value = []
  assignButtonIds.value = []

  detailLoading.value = true
  try {
    const detail = await fetchGetRoleDetail(role.roleId) as any
    roleDetail.value = detail
    assignMenuIds.value = detail.menus || detail.menuIds || []
    assignButtonIds.value = detail.buttons || detail.buttonIds || []
  } catch {
    roleDetail.value = null
  } finally {
    detailLoading.value = false
  }
}

const showDialog = (type: 'add' | 'edit', row?: RoleListItem) => {
  dialogVisible.value = true
  dialogType.value = type
  currentRoleData.value = row
}

const deleteRole = (row: RoleListItem) => {
  ElMessageBox.confirm(`确定删除角色「${row.roleName}」？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await fetchRemoveRole(row.roleId)
      ElMessage.success('角色已删除')
      if (selectedRoleId.value === row.roleId) {
        selectedRoleId.value = null
      }
      await getData()
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const onEditSuccess = () => {
  getData()
}

const switchTab = (name: 'perm' | 'data' | 'members') => {
  activeTab.value = name
  if (name === 'members') {
    membersTabRef.value?.refresh()
  }
}

const onPermCountChange = (count: number) => {
  permCheckedCount.value = count
}

const onMemberCountChange = (count: number) => {
  memberCount.value = count
}

const handleTabReset = () => {
  if (activeTab.value === 'perm') {
    permTabRef.value?.resetPerms()
  } else if (activeTab.value === 'data') {
    scopeTabRef.value?.resetDataScope()
  }
}

const handleTabSave = () => {
  if (activeTab.value === 'perm') {
    permTabRef.value?.savePerms()
  } else if (activeTab.value === 'data') {
    scopeTabRef.value?.saveDataScope()
  }
}

onMounted(() => {
  getData()
})
</script>

<style lang="scss" scoped>
// === 页面布局 ===
.role-page {
  display: flex;
  flex-direction: column;
}

.role-page__layout {
  display: flex;
  flex: 1;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

// === 右侧面板 ===
.ra-btn-icon-right {
  margin-right: 4px;
}

.role-right-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: var(--system-card, var(--default-box-color));
  border: 1px solid var(--system-border-subtle, var(--default-border));
  border-radius: calc(var(--custom-radius) / 2 + 4px);
  animation: role-panel-fade-in-r 0.4s ease forwards;
  animation-delay: 0.08s;
}

// 角色详情头部
.rp-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 20px 24px 0;
}

.rp-header-info {
  flex: 1;
  min-width: 0;
}

.rp-title-row {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 18px;
  font-weight: 700;
  color: var(--art-gray-900);
}

.rp-desc {
  margin-top: 8px;
  font-size: 12px;
  color: var(--art-gray-700);
}

.rp-edit-btn {
  flex-shrink: 0;
  align-self: center;
}

.rp-role-av {
  --rp-av-base: var(--theme-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  margin-top: 2px;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--rp-av-base), color-mix(in srgb, var(--rp-av-base) 55%, #fff));

  &.c1 { background: linear-gradient(135deg, var(--rp-av-base), color-mix(in srgb, var(--rp-av-base) 55%, #fff)); }
  &.c2 { background: linear-gradient(135deg, color-mix(in srgb, var(--rp-av-base) 90%, #5b8def), color-mix(in srgb, var(--rp-av-base) 50%, #fff)); }
  &.c3 { background: linear-gradient(135deg, color-mix(in srgb, var(--rp-av-base) 90%, #3ecf8e), color-mix(in srgb, var(--rp-av-base) 50%, #fff)); }
  &.c4 { background: linear-gradient(135deg, color-mix(in srgb, var(--rp-av-base) 85%, #a07cf0), color-mix(in srgb, var(--rp-av-base) 50%, #fff)); }
  &.c5 { background: linear-gradient(135deg, color-mix(in srgb, var(--rp-av-base) 88%, #f08080), color-mix(in srgb, var(--rp-av-base) 48%, #fff)); }
  &.c6 { background: linear-gradient(135deg, color-mix(in srgb, var(--rp-av-base) 90%, #5be0d0), color-mix(in srgb, var(--rp-av-base) 50%, #fff)); }
}

.role-status-tag {
  padding: 2px 10px;
  font-size: 11.5px;
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

.rp-role-key {
  padding: 2px 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11.5px;
  color: var(--system-muted, var(--art-gray-600));
  background: var(--system-elevated, var(--art-gray-200));
  border: 1px solid var(--system-border-subtle, var(--default-border));
  border-radius: 5px;
}

// === Tabs ===
.role-tabs {
  display: flex;
  gap: 0;
  padding: 0 24px;
  margin-top: 16px;
  border-bottom: 1px solid var(--system-border-subtle, var(--default-border));
}

.role-tab {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--system-muted, var(--art-gray-600));
  cursor: pointer;
  user-select: none;
  margin-bottom: -1px;
  border-bottom: 2px solid transparent;
  transition: color 0.18s, border-color 0.18s;

  &:hover { color: var(--system-secondary, var(--art-gray-700)); }
  &.active {
    color: var(--system-accent, var(--theme-color));
    border-bottom-color: var(--system-accent, var(--theme-color));
  }

  :deep(.art-svg-icon) {
    opacity: 0.5;
    transition: opacity 0.18s;
  }
  &.active :deep(.art-svg-icon) { opacity: 0.9; }
}

.tab-count {
  padding: 0 5px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  color: var(--system-muted, var(--art-gray-600));
  background: var(--system-elevated, var(--art-gray-200));
  border: 1px solid var(--system-border-subtle, var(--default-border));
  border-radius: 8px;

  .role-tab.active & {
    color: var(--system-accent, var(--theme-color));
    background: var(--system-accent-soft, color-mix(in srgb, var(--theme-color) 12%, transparent));
    border-color: transparent;
  }
}

.role-tab-content {
  flex: 1;
  min-height: 0;
  padding-top: 20px;
}

.tab-pane {
  height: 100%;
  padding: 0 24px 20px;
  overflow-y: auto;
  animation: tab-fade-in 0.25s ease;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: var(--system-border, var(--default-border));
    border-radius: 4px;
  }
}

.tab-footer {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--system-border-subtle, var(--default-border));
}

// === 关键帧动画 ===
@keyframes role-panel-fade-in-r {
  from { opacity: 0; transform: translateX(14px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes tab-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

// === 响应式 ===
@media (max-width: 960px) {
  .role-page__layout {
    flex-direction: column;
  }
}
</style>
