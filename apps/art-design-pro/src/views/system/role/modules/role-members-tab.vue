<template>
  <div>
    <div class="members-head">
      <div class="members-search">
        <ArtSvgIcon icon="ri:search-line" :size="14" class="members-search-icon" />
        <ElInput v-model="searchKeyword" placeholder="搜索成员..." clearable />
      </div>
      <div style="flex:1" />
      <ElButton type="primary" @click="openMemberDialog">
        <ArtSvgIcon icon="ri:add-line" :size="12" class="mr-1" />
        添加成员
      </ElButton>
    </div>

    <div v-loading="loading" class="member-grid">
      <template v-if="filteredMembers.length">
        <div v-for="member in filteredMembers" :key="member.id" class="member-card">
          <div class="member-av" :class="member.color || 'c1'">
            {{ member.name.charAt(0) }}
          </div>
          <div>
            <div class="member-name">{{ member.name }}</div>
            <div class="member-dept">{{ member.dept }}</div>
          </div>
          <button class="member-remove-btn" title="移除" @click="removeMember(member)">
            <ArtSvgIcon icon="ri:close-line" :size="13" />
          </button>
        </div>
      </template>
      <div v-else class="role-list-empty" style="grid-column: 1 / -1">暂无成员</div>
    </div>

    <!-- 添加成员弹窗 -->
    <OrgSelector
      mode="modal"
      :visible="memberDialogVisible"
      :data="orgDataForSelector"
      :only-select-person="true"
      title="添加成员"
      @update:visible="memberDialogVisible = $event"
      @confirm="handleOrgSelectorConfirm"
      @cancel="memberDialogVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { fetchGetUserListByRole, fetchGetUserListNotInRole } from '@/api/user'
import { fetchAddRoleUsers, fetchRemoveRoleUsers } from '@/api/role'
import { ElMessageBox } from 'element-plus'
import OrgSelector from '@/components/core/org-selector/index.vue'

interface Props {
  roleId: number
}

interface Emits {
  (e: 'countChange', count: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const colorClasses = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']

interface MemberItem {
  id: number
  name: string
  dept: string
  color: string
}


const loading = ref(false)
const searchKeyword = ref('')
const members = ref<MemberItem[]>([])
const memberDialogVisible = ref(false)
const orgDataForSelector = ref({ children: [] })

const filteredMembers = computed(() => {
  const q = searchKeyword.value.toLowerCase()
  if (!q) return members.value
  return members.value.filter(
    (m) => m.name.toLowerCase().includes(q) || m.dept.toLowerCase().includes(q)
  )
})

const loadMembers = async () => {
  loading.value = true
  try {
    const res = await fetchGetUserListByRole({ roleId: props.roleId, current: 1, size: 200 })
    members.value = (res.records || []).map((u: any, idx: number) => ({
      id: u.id,
      name: u.nickname || u.username || '-',
      dept: u.deptName || '-',
      color: colorClasses[idx % colorClasses.length]
    }))
    emit('countChange', members.value.length)
  } finally {
    loading.value = false
  }
}

const buildOrgData = (users: any[]) => {
  const deptMap = new Map<string, any[]>()
  users.forEach((u) => {
    const dept = u.deptName || '未分配部门'
    if (!deptMap.has(dept)) deptMap.set(dept, [])
    deptMap.get(dept)!.push({
      idStaff: String(u.id),
      staffName: u.nickname || u.username || '-',
      position: u.position || '',
    })
  })
  return {
    children: Array.from(deptMap.entries()).map(([name, staffs], i) => ({
      id: `dept-${i}`,
      name,
      staffs,
      children: [],
    })),
  }
}

const openMemberDialog = async () => {
  try {
    const res = await fetchGetUserListNotInRole({ roleId: props.roleId, current: 1, size: 200 })
    orgDataForSelector.value = buildOrgData(res.records || [])
  } catch {
    orgDataForSelector.value = { children: [] }
  }
  memberDialogVisible.value = true
}

const handleOrgSelectorConfirm = async (selectedItems: any[]) => {
  const userIds = selectedItems
    .filter((item: any) => item.type === 'staff')
    .map((item: any) => Number(item.idStaff))

  if (!userIds.length) {
    ElMessage.info('没有新成员被添加')
    return
  }

  try {
    await fetchAddRoleUsers({ roleId: props.roleId, users: userIds })
    ElMessage.success(`已添加 ${userIds.length} 名成员`)
    await loadMembers()
  } catch {
    // 错误由 http 工具处理
  }
}

const removeMember = (member: MemberItem) => {
  ElMessageBox.confirm(`确定移除成员「${member.name}」？`, '移除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await fetchRemoveRoleUsers({ roleId: props.roleId, users: [member.id] })
      ElMessage.success('成员已移除')
      await loadMembers()
    })
    .catch(() => {
      ElMessage.info('已取消移除')
    })
}

const refresh = () => {
  loadMembers()
}

defineExpose({ refresh })

onMounted(() => {
  loadMembers()
})
</script>

<style lang="scss" scoped>
.members-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.members-search {
  position: relative;

  .members-search-icon {
    position: absolute;
    top: 50%;
    left: 10px;
    z-index: 1;
    color: var(--system-muted, var(--art-gray-600));
    pointer-events: none;
    transform: translateY(-50%);
  }

  :deep(.el-input__wrapper) {
    padding-left: 30px;
    background: var(--system-input, var(--default-box-color));
    border-radius: 6px;
    box-shadow: 0 0 0 1px var(--system-border-subtle, var(--default-border)) inset;

    &.is-focus {
      box-shadow:
        0 0 0 1px var(--system-accent, var(--theme-color)) inset,
        0 0 0 3px var(--system-accent-soft, color-mix(in srgb, var(--theme-color) 12%, transparent));
    }
  }
}

.member-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.member-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  background: var(--system-input, var(--default-box-color));
  border: 1px solid var(--system-border-subtle, var(--default-border));
  border-radius: var(--custom-radius, 8px);
  transition: all 0.18s;

  &:hover {
    border-color: var(--system-border, var(--default-border));
    box-shadow: 0 2px 12px color-mix(in srgb, var(--art-gray-900) 15%, transparent);
  }
}

.member-av {
  --mav-base: var(--theme-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--mav-base), color-mix(in srgb, var(--mav-base) 55%, #fff));

  &.c1 {
    background: linear-gradient(135deg, var(--mav-base), color-mix(in srgb, var(--mav-base) 55%, #fff));
  }
  &.c2 {
    background: linear-gradient(135deg, color-mix(in srgb, var(--mav-base) 90%, #5b8def), color-mix(in srgb, var(--mav-base) 50%, #fff));
  }
  &.c3 {
    background: linear-gradient(135deg, color-mix(in srgb, var(--mav-base) 90%, #3ecf8e), color-mix(in srgb, var(--mav-base) 50%, #fff));
  }
  &.c4 {
    background: linear-gradient(135deg, color-mix(in srgb, var(--mav-base) 85%, #a07cf0), color-mix(in srgb, var(--mav-base) 50%, #fff));
  }
  &.c5 {
    background: linear-gradient(135deg, color-mix(in srgb, var(--mav-base) 88%, #f08080), color-mix(in srgb, var(--mav-base) 48%, #fff));
  }
  &.c6 {
    background: linear-gradient(135deg, color-mix(in srgb, var(--mav-base) 90%, #5be0d0), color-mix(in srgb, var(--mav-base) 50%, #fff));
  }
}

.member-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--system-text, var(--art-gray-900));
}

.member-dept {
  margin-top: 1px;
  font-size: 11.5px;
  color: var(--system-muted, var(--art-gray-600));
}

.member-remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  margin-left: auto;
  cursor: pointer;
  color: var(--system-muted, var(--art-gray-600));
  background: transparent;
  border: none;
  border-radius: 5px;
  transition: all 0.15s;

  &:hover {
    color: var(--system-red, var(--art-danger));
    background: var(--system-red-soft, color-mix(in srgb, var(--art-danger) 12%, transparent));
  }
}
</style>
