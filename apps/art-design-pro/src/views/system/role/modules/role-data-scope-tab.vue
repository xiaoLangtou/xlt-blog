<template>
  <div>
    <div class="data-scope-header">
      <div class="data-scope-title">数据范围</div>
      <div class="data-scope-desc">设置该角色可访问的数据范围</div>
    </div>

    <div class="scope-grid">
      <div
        v-for="(scope, idx) in dataScopes"
        :key="scope.id"
        class="scope-card"
        :class="{
          selected: selectedScope === scope.id,
          full: idx === dataScopes.length - 1
        }"
        @click="selectedScope = scope.id"
      >
        <div class="scope-radio"></div>
        <div>
          <div class="scope-title">{{ scope.title }}</div>
          <div class="scope-desc">{{ scope.desc }}</div>
        </div>
      </div>
    </div>

    <div v-if="selectedScope === 2" class="custom-dept">
      <div class="custom-dept-label">选择可访问的部门</div>
      <div v-loading="deptLoading">
        <template v-for="dept in deptTree" :key="dept.id">
          <div class="dept-tree-item" @click="toggleDept(dept)">
            <div
              class="perm-check sm"
              :class="{
                checked: dept.checked === true,
                indeterminate: dept.checked === 'indeterminate'
              }"
            >
              <ArtSvgIcon v-if="dept.checked === 'indeterminate'" icon="ri:subtract-line" :size="9" style="color:#fff" />
              <ArtSvgIcon v-else-if="dept.checked === true" icon="ri:check-line" :size="9" style="color:#fff" />
            </div>
            <span>{{ dept.name }}</span>
          </div>
          <div
            v-for="child in dept.children"
            :key="child.id"
            class="dept-tree-item"
            style="padding-left: 24px"
            @click="toggleDeptChild(child, dept)"
          >
            <div class="perm-check sm" :class="{ checked: child.checked === true }">
              <ArtSvgIcon v-if="child.checked === true" icon="ri:check-line" :size="9" style="color:#fff" />
            </div>
            <span>{{ child.name }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { fetchGetDeptTree } from '@/api/dept'

interface Props {
  roleId: number
}

interface Emits {
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

interface ScopeItem {
  id: number
  title: string
  desc: string
}

interface DeptNode {
  id: number
  name: string
  checked: boolean | 'indeterminate'
  children?: DeptNode[]
}

const dataScopes: ScopeItem[] = [
  { id: 1, title: '全部数据', desc: '可查看和操作所有数据' },
  { id: 2, title: '自定义数据', desc: '按部门选择可访问的数据范围' },
  { id: 3, title: '本部门数据', desc: '仅可访问本部门的数据' },
  { id: 4, title: '本部门及以下', desc: '可访问本部门及下级部门的数据' },
  { id: 5, title: '仅本人数据', desc: '仅可操作自己创建的数据' }
]

const selectedScope = ref(1)
const deptTree = ref<DeptNode[]>([])
const deptLoading = ref(false)
const saving = ref(false)

const toggleDept = (dept: DeptNode) => {
  const v = dept.checked === true ? false : true
  dept.checked = v
  if (dept.children) {
    dept.children.forEach((c) => (c.checked = v))
  }
}

const toggleDeptChild = (child: DeptNode, parent: DeptNode) => {
  child.checked = !child.checked
  if (parent.children) {
    const all = parent.children.every((c) => c.checked === true)
    const none = parent.children.every((c) => c.checked === false)
    parent.checked = all ? true : none ? false : 'indeterminate'
  }
}

const loadDeptTree = async () => {
  deptLoading.value = true
  try {
    const list = await fetchGetDeptTree()
    deptTree.value = (list as any[]).map((d: any) => ({
      id: d.id,
      name: d.deptName || d.name || '-',
      checked: false,
      children: (d.children || []).map((c: any) => ({
        id: c.id,
        name: c.deptName || c.name || '-',
        checked: false
      }))
    }))
  } finally {
    deptLoading.value = false
  }
}

const resetDataScope = () => {
  selectedScope.value = 1
  // 重置部门勾选
  deptTree.value.forEach((d) => {
    d.checked = false
    d.children?.forEach((c) => (c.checked = false))
  })
  ElMessage.info('已重置')
}

const saveDataScope = async () => {
  saving.value = true
  try {
    // TODO: 调用数据权限保存接口
    ElMessage.success('数据权限保存成功')
    emit('success')
  } catch {
    // 错误已由 http 工具统一处理
  } finally {
    saving.value = false
  }
}

defineExpose({ saveDataScope, resetDataScope, saving })

onMounted(() => {
  loadDeptTree()
})
</script>

<style lang="scss" scoped>
.data-scope-header {
  margin-bottom: 16px;
}

.data-scope-title {
  margin-bottom: 3px;
  font-size: 14px;
  font-weight: 600;
  color: var(--system-text, var(--art-gray-900));
}

.data-scope-desc {
  font-size: 12px;
  color: var(--system-muted, var(--art-gray-600));
}

.scope-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.scope-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px;
  cursor: pointer;
  background: var(--system-input, var(--default-box-color));
  border: 1px solid var(--system-border-subtle, var(--default-border));
  border-radius: var(--custom-radius, 8px);
  transition: all 0.18s;

  &:hover {
    border-color: var(--system-border, var(--default-border));
  }
  &.selected {
    background: var(--system-accent-soft, color-mix(in srgb, var(--theme-color) 12%, transparent));
    border-color: var(--system-accent, var(--theme-color));
  }
  &.full {
    grid-column: 1 / -1;
  }
}

.scope-radio {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  border: 2px solid var(--system-border, var(--default-border));
  border-radius: 50%;
  transition: all 0.18s;

  .scope-card.selected & {
    border-color: var(--system-accent, var(--theme-color));
    &::after {
      display: block;
      width: 7px;
      height: 7px;
      margin: 2.5px auto;
      content: '';
      background: var(--system-accent, var(--theme-color));
      border-radius: 50%;
    }
  }
}

.scope-title {
  margin-bottom: 2px;
  font-size: 13px;
  font-weight: 600;
  color: var(--system-text, var(--art-gray-900));
}

.scope-desc {
  font-size: 12px;
  color: var(--system-muted, var(--art-gray-600));
}

.custom-dept {
  padding: 16px;
  margin-bottom: 24px;
  background: var(--system-input, var(--default-box-color));
  border: 1px solid var(--system-border-subtle, var(--default-border));
  border-radius: var(--custom-radius, 8px);
}

.custom-dept-label {
  margin-bottom: 12px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--system-secondary, var(--art-gray-700));
}

.dept-tree-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--system-text, var(--art-gray-900));
  border-radius: 5px;
  transition: background 0.15s;

  &:hover {
    background: var(--system-elevated, var(--art-gray-200));
  }
}
</style>
